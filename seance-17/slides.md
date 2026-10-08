---
theme: default
title: Web 2 - Séance 17 - useEffect et stockage web
---

# Web 2 — Séance 17
## useEffect et stockage web

---

# Le rendu doit être pur
##

Depuis la séance 08, un composant est une **fonction pure** : il calcule du JSX à partir de ses props et de son état, **sans rien modifier** d'autre.

- React peut appeler un composant plusieurs fois, à des moments qu'il choisit
- En développement, `StrictMode` (dans `main.tsx`) appelle volontairement chaque composant **deux fois** pour détecter les composants impurs

Mais une application doit parfois agir sur le **monde extérieur** à React :

- Modifier le titre de l'onglet (`document.title`)
- Enregistrer des données dans le navigateur (cette séance)
- Exécuter du code après un délai, ou à intervalle régulier (séance 18)
- Charger des données depuis un serveur (Partie 4)

Ce sont des **effets de bord** (*side effects*).

---

# Où placer un effet de bord ?
##

**Dans un handler d'événement**, quand il est provoqué par une action de l'utilisateur :

```tsx
const handleSubmit = () => {
  document.title = "Envoyé"; // suit une action de l'utilisateur
};
```

**Dans un effet**, quand il découle simplement de l'**affichage** du composant :

- « Tant que la page de détail est affichée, le titre de l'onglet est le titre de la recette »
- « Chaque fois que la liste des favoris change, elle est enregistrée dans le navigateur »

Aucun clic ne déclenche ces actions : elles doivent **synchroniser** un système extérieur avec l'état du composant. C'est le rôle de `useEffect`.

---

# useEffect

Hook React pour exécuter un effet de bord de manière contrôlée.

```tsx
import { useEffect } from "react";

const RecipeDetail = ({ recipe }: RecipeDetailProps) => {
  useEffect(() => {
    document.title = `${recipe.title} - MiamMiam`;
  }, [recipe.title]);

  return <Typography variant="h4" component="h1">{recipe.title}</Typography>;
};
```

- Premier argument : la fonction **effet**
- Second argument : le **tableau de dépendances**, les valeurs utilisées par l'effet
- React exécute l'effet **après** avoir mis à jour l'écran : le rendu reste pur et rapide

---

# Quand un effet s'exécute-t-il ?

```
Rendu 1 (recette « Guacamole »)
  → écran mis à jour
  → effet exécuté : document.title = "Guacamole - MiamMiam"

Rendu 2 (un autre état a changé, même recette)
  → écran mis à jour
  → dépendances identiques ([ "Guacamole" ]) : effet ignoré

Rendu 3 (navigation vers la recette « Carbonara »)
  → écran mis à jour
  → dépendances différentes : effet exécuté, document.title = "Carbonara - MiamMiam"
```

React compare chaque dépendance à sa valeur du rendu précédent, avec `Object.is` (comme pour l'état, séance 13).

---

# Le tableau de dépendances

```tsx
useEffect(() => {
  // après CHAQUE rendu
});

useEffect(() => {
  // après le premier rendu uniquement (le composant apparaît)
}, []);

useEffect(() => {
  // après le premier rendu, puis quand a ou b change
}, [a, b]);
```

Règle : **toute** valeur du composant utilisée dans l'effet (props, état, variables calculées) doit figurer dans les dépendances.

- Oublier une dépendance : l'effet utilise une valeur périmée
- La règle `exhaustive-deps` du linter du template Vite (`npm run lint`) signale les oublis
- Les setters d'état (`setX`) n'ont pas besoin d'y figurer : ils ne changent jamais

---

# Quand ne pas utiliser useEffect

Un effet sert à synchroniser React avec **l'extérieur**. Pour calculer une valeur à partir de l'état, un effet est inutile et nuisible.

```tsx
// ❌ Effet pour calculer une valeur dérivée : un rendu en trop, avec une valeur périmée
const [filtered, setFiltered] = useState<Recipe[]>([]);
useEffect(() => {
  setFiltered(recipes.filter((r) => r.categoryId === categoryId));
}, [recipes, categoryId]);

// ✅ Calcul pendant le rendu (séance 14)
const filtered = recipes.filter((r) => r.categoryId === categoryId);
```

---

# Le problème : tout disparaît au rechargement
##

L'état React vit dans la **mémoire** de l'onglet :

- Recharger la page (F5) relance l'application depuis zéro : `useState` repart de la valeur initiale
- Fermer l'onglet efface tout

Pour certaines données, c'est gênant :

- Les recettes favorites de l'utilisateur
- Un formulaire de recette à moitié rempli
- Les préférences (thème, langue)

En Partie 4, les données importantes seront stockées par le **backend**. Mais le navigateur offre aussi un stockage local, sans serveur.

---

# Web Storage

Le navigateur fournit deux espaces de stockage **clé → valeur** :

| | `localStorage` | `sessionStorage` | `état React` |
|---|---|---|---|
| Durée de vie | Permanente, jusqu'à suppression | Jusqu'à la fermeture de l'onglet | Jusqu'au rechargement de la page |
| Rechargement de la page | Conservé | Conservé | Perdu |
| Partage entre onglets | Tous les onglets de la même origine | Propre à chaque onglet | Non |
| Capacité | Environ 5 Mo | Environ 5 Mo | RAM de la machine |

- **Origine** = protocole + domaine + port : `http://localhost:5173` n'a pas accès aux données de `http://localhost:3000`
- Visible et modifiable dans les outils de développement : onglet *Application* (Chrome) ou *Stockage* (Firefox)

---

# L'API

Les deux objets ont exactement la même API.

```ts
// Écrire (remplace la valeur si la clé existe)
localStorage.setItem("miammiam.theme", "dark");

// Lire : la valeur, ou null si la clé n'existe pas
const theme = localStorage.getItem("miammiam.theme"); // string | null

// Supprimer une clé
localStorage.removeItem("miammiam.theme");

// Tout supprimer (pour cette origine)
localStorage.clear();
```

- Opérations **synchrones** : pas de Promise, la valeur est disponible immédiatement
- Préfixer les clés par le nom de l'application évite les collisions entre projets sur `localhost:5173`

---

# Uniquement des chaînes

Le Web Storage ne stocke que des **chaînes de caractères**.

```ts
localStorage.setItem("favorites", [1, 4]);        // ❌ erreur TypeScript
localStorage.setItem("count", String(3));         // "3"
```

Pour un tableau ou un objet : **sérialiser** en JSON à l'écriture, **désérialiser** à la lecture.

```ts
const favorites = [1, 4];
localStorage.setItem("miammiam.favorites", JSON.stringify(favorites)); // "[1,4]"

const stored = localStorage.getItem("miammiam.favorites");             // "[1,4]" ou null
const parsed: unknown = stored ? JSON.parse(stored) : [];              // [1, 4]
```

- `JSON.stringify` : valeur &rarr; texte JSON
- `JSON.parse` : texte JSON &rarr; valeur, de type `any`
- Même format que les corps de requêtes et réponses HTTP (séance 02)

---

# Ne pas faire confiance au stockage

Une valeur lue dans le stockage peut être **n'importe quoi** :

- Modifiée à la main dans les outils de développement
- Écrite par une ancienne version de l'application, avec un autre format
- Du texte qui n'est pas du JSON valide : `JSON.parse` lève une exception

Même méthode que pour `req.body` dans le backend : `unknown`, puis **type guard** (séance 01).

```ts
const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === "number");

export const loadFavorites = (): number[] => {
  try {
    const stored = localStorage.getItem("miammiam.favorites");
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return isNumberArray(parsed) ? parsed : [];
  } catch {
    return []; // JSON invalide
  }
};

export const saveFavorites = (favorites: number[]) => {
  localStorage.setItem("miammiam.favorites", JSON.stringify(favorites));
};
```

---

# Lire au démarrage : initialisation paresseuse

```tsx
// ❌ loadFavorites() est appelé à CHAQUE rendu, et son résultat ignoré après le premier
const [favoriteIds, setFavoriteIds] = useState<number[]>(loadFavorites());

// ✅ Une fonction : React ne l'appelle qu'au premier rendu
const [favoriteIds, setFavoriteIds] = useState<number[]>(() => loadFavorites());
```

- `useState(valeur)` : la valeur est calculée à chaque rendu, même si elle ne sert qu'une fois
- `useState(() => valeur)` : **initialisation paresseuse**, la fonction n'est appelée qu'une fois
- Lire le stockage est synchrone : la valeur est disponible dès le premier rendu, pas besoin d'effet ni d'écran de chargement

---

# Écrire à chaque changement

Garder le stockage synchronisé avec l'état est une synchronisation avec un système **extérieur** à React : un effet, comme pour `document.title`.

```tsx
const [favoriteIds, setFavoriteIds] = useState<number[]>(() => loadFavorites());

useEffect(() => {
  saveFavorites(favoriteIds);
}, [favoriteIds]);

const toggleFavorite = (recipeId: number) => {
  setFavoriteIds((prev) =>
    prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]
  );
};
```

- Toutes les modifications de `favoriteIds` sont enregistrées, quel que soit l'endroit qui appelle le setter
- Alternative : appeler `saveFavorites` dans chaque handler qui modifie les favoris, au risque d'en oublier un
- Pas de nettoyage nécessaire : l'effet ne démarre rien qui continuerait après lui (les effets avec nettoyage : séance 18)

---

# Exemple : brouillon de formulaire

Un formulaire qui survit à un rechargement accidentel :

```tsx
const DRAFT_KEY = "miammiam.recipeDraft";

const RecipeForm = ({ onAdd }: RecipeFormProps) => {
  const [form, setForm] = useState<RecipeFormData>(() => loadDraft() ?? emptyForm);

  useEffect(() => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAdd(toNewRecipe(form));
    sessionStorage.removeItem(DRAFT_KEY); // brouillon terminé
    setForm(emptyForm);
  };
  // ...
};
```

- `sessionStorage` : le brouillon ne concerne que cet onglet, et disparaît à sa fermeture
- `loadDraft()` retourne `null` si aucun brouillon valide n'existe : `??` choisit alors le formulaire vide

---

# Sécurité et limites

- **Lisible par tout script de la page** : une faille XSS (séance 05) permet de lire tout le stockage
  - Jamais de mot de passe ni de donnée sensible
  - Le cas du token d'authentification sera discuté en séance 23
- **Modifiable par l'utilisateur** : ne jamais y stocker une information que le serveur doit croire (rôle, prix…)
- **Propre au navigateur** : les favoris enregistrés sur l'ordinateur n'existent pas sur le téléphone
- **Synchrone** : lire ou écrire de gros volumes bloque l'affichage
- **Pas de synchronisation automatique** entre onglets : l'événement `storage` de `window` signale une modification faite par un autre onglet

---

# Récapitulatif Séance 17

- **Rendu pur** — Pas d'effet de bord pendant le rendu ; `StrictMode` appelle les composants deux fois en développement
- **Effet de bord** — Action sur l'extérieur de React : titre de l'onglet, stockage, timer, réseau
- **Handler ou effet** — Handler si c'est une action de l'utilisateur, effet si c'est une synchronisation
- **useEffect** — `useEffect(effet, dépendances)`, exécuté après la mise à jour de l'écran
- **Dépendances** — Toutes les valeurs utilisées ; `[]` = uniquement à l'apparition
- **Pas d'effet** — Pour les valeurs dérivées et les réactions aux événements
- **Web Storage** — `localStorage` (permanent, partagé entre onglets) et `sessionStorage` (limité à l'onglet), par origine
- **API** — `setItem`, `getItem` (`string | null`), `removeItem`, `clear` ; uniquement des chaînes, donc JSON
- **Validation** — Valeur lue = `unknown`, vérifiée par un type guard, `try/catch` autour de `JSON.parse`
- **Initialisation paresseuse** — `useState(() => load())`
- **Synchronisation** — `useEffect` qui enregistre l'état à chaque changement
- **Limites** — Pas de données sensibles, pas de données de confiance, propre à un navigateur

**Prochaine séance** : Séance 18 — Timers et nettoyage

---

# Exercice filé S17

1. Sur la page de détail, le titre de l'onglet devient « Titre de la recette - MiamMiam » ; sur les autres pages, « MiamMiam »
2. Créez un fichier `src/utils/storage.ts` avec `loadFavorites` et `saveFavorites`, qui valident les données lues
3. Rendez les favoris persistants dans le `localStorage` : ils doivent survivre à un rechargement et à la fermeture du navigateur
4. Testez la robustesse : dans les outils de développement, remplacez la valeur enregistrée par du texte invalide, puis par `["a", "b"]`, et rechargez la page
5. Enregistrez le brouillon du formulaire d'ajout de recette (champs, ingrédients et étapes) : `localStorage` ou `sessionStorage` ? Justifiez votre choix en commentaire
6. Le brouillon est supprimé quand la recette est ajoutée ; ajoutez un bouton « Effacer le brouillon »

---

# Exercice complémentaire EC08

1. Créez un projet `EC08` avec Vite + React + TypeScript et installez MUI
2. **Titre de l'onglet** : un compteur de clics est reflété dans le titre de l'onglet (« 3 clics »)
3. **Préférences** : un interrupteur (`Switch`) choisit le mode clair ou sombre de l'application (`createTheme({ palette: { mode } })`) ; le choix est enregistré dans le `localStorage` et restauré au démarrage, une valeur invalide est ignorée
4. **Liste de tâches** : ajout, suppression et case à cocher « terminée » ; la liste `{ id, text, done }[]` est enregistrée dans le `localStorage` et validée par un type guard à la lecture
5. **Note rapide** : un champ de texte libre conservé dans le `sessionStorage` ; ouvrez la page dans un second onglet et comparez avec la liste de tâches
