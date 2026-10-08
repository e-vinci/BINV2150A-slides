---
theme: default
title: Web 2 - Séance 18 - Timers et nettoyage
---

# Web 2 — Séance 18
## Timers et nettoyage

---

# Rappel : useEffect
##

```tsx
useEffect(() => {
  document.title = `${recipe.title} - MiamMiam`;
}, [recipe.title]);
```

- Un effet **synchronise** un système extérieur à React avec l'état du composant
- React l'exécute après la mise à jour de l'écran, puis à nouveau quand une dépendance change

Les effets de la séance 17 (titre de l'onglet, stockage) font leur travail **immédiatement** et ne laissent rien derrière eux.

Certains effets **démarrent** quelque chose qui continue de tourner après eux : un timer, une connexion, un abonnement. Il faudra aussi savoir l'**arrêter**.

Cette séance : les timers de JavaScript, puis le **nettoyage** des effets.

---

# Exécuter du code plus tard : setTimeout
##

`setTimeout(callback, délai)` demande au navigateur d'appeler une fonction **une fois**, après un délai en **millisecondes**.

```ts
console.log("1. Avant");

setTimeout(() => {
  console.log("3. Deux secondes plus tard");
}, 2000);

console.log("2. Après");
```

- `setTimeout` ne bloque pas : il enregistre le callback et rend la main **immédiatement**
- Même principe que les Promises et les événements : on fournit un **callback**
- Le délai est un minimum

---

# Annuler un timeout : clearTimeout
##

`setTimeout` retourne un **identifiant** (un nombre) : on le conserve pour pouvoir annuler le timer avant qu'il ne se déclenche.

```ts
const timeoutId = setTimeout(() => {
  console.log("Message envoyé");
}, 5000);

// L'utilisateur clique sur « Annuler » avant la fin des 5 secondes :
clearTimeout(timeoutId); // le callback ne sera jamais appelé
```

- `clearTimeout` sur un timer déjà déclenché ou déjà annulé ne fait rien, sans erreur

---

# Répéter : setInterval et clearInterval
##

`setInterval(callback, délai)` appelle `callback` **toutes les** `délai` millisecondes, jusqu'à ce qu'on l'arrête avec `clearInterval`.

```ts
let count = 0;

const intervalId = setInterval(() => {
  count = count + 1;
  console.log(`${count} s`);
  if (count === 5) {
    clearInterval(intervalId); // arrêt après le 5e appel
  }
}, 1000);
```

```
1 s    2 s    3 s    4 s    5 s     ← un affichage par seconde, puis plus rien
```

- Sans `clearInterval`, l'intervalle tourne tant que la page est ouverte
- Le callback lit et modifie `count`, déclaré en dehors de lui : une fonction a accès aux variables de l'endroit où elle a été **créée**, même quand elle est appelée plus tard. On appelle cela une **closure**

---

# Un timer appartient au navigateur

Un timer est enregistré auprès du **navigateur**, pas auprès du code qui l'a créé :

- Il se déclenche même si la fonction qui l'a créé est terminée depuis longtemps
- Seul `clearTimeout` ou `clearInterval` l'arrête

Dans un composant React, il faut donc répondre à deux questions :

1. **Quand** démarrer le timer ?
2. **Quand** l'arrêter ?

Exemple : une horloge qui affiche l'heure, mise à jour chaque seconde.

---

# Un timer pendant le rendu

```tsx
// ❌ Démarrer un timer dans le corps du composant
const Clock = () => {
  const [now, setNow] = useState(new Date());

  setInterval(() => setNow(new Date()), 1000); // exécuté à CHAQUE rendu

  return <Typography>{now.toLocaleTimeString()}</Typography>;
};
```

- Chaque rendu crée un **nouvel** intervalle
- Chaque intervalle appelle `setNow` toutes les secondes, ce qui provoque un nouveau rendu, qui crée un nouvel intervalle…
- Le nombre d'intervalles **double** chaque seconde : 2, 4, 8, 16… l'application ralentit puis se bloque

Démarrer un timer est un effet de bord : sa place est dans un **effet**.

---

# Démarrer le timer dans un effet

```tsx
const Clock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setInterval(() => setNow(new Date()), 1000);
  }, []); // [] : uniquement quand le composant apparaît

  return <Typography>{now.toLocaleTimeString()}</Typography>;
};
```

- L'intervalle est créé **une seule fois**, après le premier rendu
- Chaque seconde, `setNow` provoque un rendu : l'heure affichée est à jour, et l'effet n'est pas réexécuté
- `setNow` est appelé plus tard, dans le callback de l'intervalle, et non directement dans l'effet : la règle `set-state-in-effect` (séance 17) n'est pas concernée

La question 1 est réglée. Mais rien n'arrête l'intervalle : que se passe-t-il quand `Clock` disparaît de l'écran ?

---

# Le problème : le timer survit au composant

```tsx
const App = () => {
  const [showClock, setShowClock] = useState(true);

  return (
    <>
      <Button onClick={() => setShowClock((prev) => !prev)}>
        {showClock ? "Masquer l'horloge" : "Afficher l'horloge"}
      </Button>
      {showClock && <Clock />}
    </>
  );
};
```

- **Masquer** : `Clock` disparaît de l'écran (*unmount*), mais son intervalle continue d'appeler `setNow` chaque seconde, pour un composant qui n'existe plus
- **Réafficher** : un nouveau `Clock` apparaît et crée un **deuxième** intervalle ; après dix affichages, dix intervalles tournent
- C'est une **fuite** : des ressources consommées pour rien, qui s'accumulent tant que la page est ouverte

---

# Le nettoyage (cleanup)

Un effet peut retourner une fonction de **nettoyage**, qui défait ce que l'effet a fait.

```tsx
useEffect(() => {
  const intervalId = setInterval(() => setNow(new Date()), 1000); // mise en place

  return () => {
    clearInterval(intervalId);                                     // nettoyage
  };
}, []);
```

React appelle le nettoyage :

- Quand le composant disparaît de l'écran
- Avant de réexécuter l'effet, si les dépendances ont changé

La fonction de nettoyage est créée dans l'effet : elle a accès à `intervalId` (closure).

---

# Cycle de vie d'un effet

```
Le composant apparaît        →  effet(dépendances A)
Les dépendances changent     →  nettoyage(A), puis effet(dépendances B)
Les dépendances changent     →  nettoyage(B), puis effet(dépendances C)
Le composant disparaît       →  nettoyage(C)
```

- Chaque exécution de l'effet est suivie **tôt ou tard** de son nettoyage
- Penser l'effet comme « démarrer la synchronisation », le nettoyage comme « l'arrêter »

En développement, `StrictMode` fait apparaître chaque composant, le fait disparaître et le fait réapparaître immédiatement :

```
effet → nettoyage → effet
```

C'est volontaire : avec un nettoyage correct, l'utilisateur ne voit aucune différence. Sans le `clearInterval` de `Clock`, deux intervalles tourneraient dès le départ. En production, l'effet ne s'exécute qu'une fois.

---

# Exemple : un chronomètre

```tsx
const Stopwatch = () => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return; // rien à démarrer, donc rien à nettoyer

    const intervalId = setInterval(() => {
      setSeconds((prev) => prev + 1);  // mise à jour fonctionnelle (séance 11)
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  return (
    <>
      <Typography>{seconds} s</Typography>
      <Button onClick={() => setIsRunning((prev) => !prev)}>
        {isRunning ? "Pause" : "Démarrer"}
      </Button>
    </>
  );
};
```

- **Démarrer** : `isRunning` passe à `true`, l'effet crée un intervalle
- **Pause** : `isRunning` passe à `false`, le nettoyage arrête l'intervalle, puis le nouvel effet ne fait rien
- Sans `clearInterval`, Pause n'arrêterait rien et chaque Démarrer ajouterait un intervalle : le chronomètre accélérerait

---

# Piège : la valeur périmée

```tsx
// ❌ L'affichage reste bloqué à 1 s
useEffect(() => {
  const intervalId = setInterval(() => {
    setSeconds(seconds + 1); // 0 + 1, puis encore 0 + 1...
  }, 1000);
  return () => clearInterval(intervalId);
}, []); // seconds oublié dans les dépendances : signalé par le linter
```

- Chaque rendu a **sa propre** constante `seconds` : 0 au premier rendu, 1 au deuxième…
- Le callback de l'intervalle a été créé pendant le **premier** rendu : par closure, il voit le `seconds` de ce rendu, qui vaut `0` pour toujours
- Solutions :
  - Mise à jour fonctionnelle `setSeconds((prev) => prev + 1)` : le callback n'a plus besoin de lire `seconds`
  - Ou ajouter `seconds` aux dépendances : l'intervalle est nettoyé et recréé à chaque seconde

---

# Exemple : recherche différée (debounce)

Filtrer à chaque frappe est inutile si l'utilisateur tape vite. On attend qu'il **s'arrête** de taper.

```tsx
const HomePage = ({ recipes }: HomePageProps) => {
  const [query, setQuery] = useState("");                   // ce qui est tapé
  const [debouncedQuery, setDebouncedQuery] = useState(""); // ce qui est recherché

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const filtered = recipes.filter((r) =>
    r.title.toLowerCase().includes(debouncedQuery.toLowerCase())
  );
  // ...
};
```

Chaque frappe modifie `query` : React appelle le nettoyage (qui annule le timeout précédent), puis l'effet (qui en programme un nouveau).

```
"c"    → timeout de 300 ms ... nouvelle frappe → annulé
"ca"   → timeout de 300 ms ... nouvelle frappe → annulé
"car"  → timeout de 300 ms ... 300 ms sans frappe → debouncedQuery = "car"
```

---

# Récapitulatif Séance 18

- **setTimeout** — Callback appelé une fois après un délai en millisecondes ; ne bloque pas le code qui suit
- **setInterval** — Callback appelé à intervalle régulier, jusqu'à `clearInterval`
- **Identifiant** — Retourné par `setTimeout` / `setInterval`, pour annuler avec `clearTimeout` / `clearInterval`
- **Closure** — Une fonction voit les variables de l'endroit (et du rendu) où elle a été créée
- **Timer dans un composant** — Jamais pendant le rendu : dans un effet
- **Nettoyage** — Fonction retournée par l'effet, appelée avant le prochain effet et à la disparition du composant
- **StrictMode** — Effet, nettoyage, effet en développement pour révéler un nettoyage oublié
- **Valeur périmée** — Mise à jour fonctionnelle ou dépendance ajoutée
- **Debounce** — `setTimeout` + nettoyage pour attendre la fin de la frappe

**Prochaine séance** : Séance 19 — Structure de l'application

---

# Exercice filé S18

1. Remplacez le filtrage immédiat de la recherche par une recherche différée de 300 ms : le champ se met à jour à chaque frappe, la liste seulement après une pause
2. Affichez un indicateur « Recherche… » tant que le texte tapé et le texte recherché sont différents (sans nouvel état)
3. Vérifiez dans la console qu'aucun timer n'est oublié : ajoutez des `console.log` dans l'effet et le nettoyage, puis retirez-les
4. **Optionnel** : sur la page de détail, ajoutez un minuteur de cuisson (durée de cuisson de la recette, boutons démarrer/pause/réinitialiser) ; il s'arrête s'il atteint zéro ou si l'on quitte la page

---

# Exercice complémentaire EC09

1. Créez un projet `EC09` avec Vite + React + TypeScript
2. **Chronomètre** : affichage minutes:secondes:dixièmes, boutons « Démarrer », « Pause » et « Remise à zéro », et une liste des temps intermédiaires (bouton « Tour »)
3. **Horloge** : un composant affiche l'heure actuelle, mise à jour chaque seconde, et un bouton permet de le masquer et de le réafficher ; ajoutez un `console.log` dans le callback de l'intervalle et vérifiez qu'il s'arrête quand l'horloge est masquée, puis retirez le nettoyage et observez la console
4. **Message temporaire** : un bouton « Ajouter au panier » affiche « Article ajouté » pendant 3 secondes ; un nouveau clic avant la fin relance le délai de 3 secondes
5. **Compte à rebours** : l'utilisateur saisit un nombre de secondes et démarre le décompte ; à zéro, le décompte s'arrête et le titre de l'onglet affiche « Terminé ! »
