---
theme: default
title: Web 2 - Séance 20 - Consolidation
---

# Web 2 — Séance 20
## Consolidation

---

# Objectifs de la séance
##

La Partie 3 (séances 07 à 19) est terminée. Avant de relier le frontend au backend (Partie 4), MiamMiam doit être **complet**, **propre** et **compris**.

Déroulement :

1. **Trouvez l'erreur** : six extraits de code, chacun avec une erreur classique, à analyser ensemble
2. **Travail sur MiamMiam** : terminer les exercices filés en retard, à l'aide de la liste de contrôle
3. **Relecture** : chaque ligne de votre code doit pouvoir être expliquée
4. **Préparer la Partie 4** : relancer le backend de la Partie 1

Pour chaque extrait : que se passe-t-il à l'écran ? Pourquoi ? Comment corriger ?

---

# La Partie 3 en une page

| Séance | Notion | À retenir |
|---|---|---|
| 07 | Composants et JSX | Une fonction qui retourne du JSX, une seule racine |
| 08 | Props et children | Paramètres du composant, en lecture seule |
| 09 | MUI | Composants prêts à l'emploi, `sx`, thème |
| 10 | Collections | `map()` avec une `key` stable et unique |
| 11 | `useState` | Changer l'état provoque un nouveau rendu ; ne pas stocker ce qui se calcule |
| 12 | Formulaires | Champs contrôlés : `value` + `onChange` |
| 13 | Collection comme état | Jamais de mutation : un nouveau tableau, un nouvel objet |

---

| Séance | Notion | À retenir |
|---|---|---|
| 14 | État partagé | L'état dans le parent commun, les données descendent, les événements remontent |
| 15-16 | Routage | Routes déclarées, `Link`, `useParams`, `useNavigate` |
| 17 | `useEffect`, stockage | Synchroniser avec l'extérieur ; dépendances complètes |
| 18 | Timers | Tout ce qu'un effet démarre, son nettoyage l'arrête |
| 19 | MVVM | La logique dans des hooks, l'affichage dans les composants |

---

# Trouvez l'erreur (1)

```tsx
const RecipeForm = () => {
  const [form, setForm] = useState<RecipeFormData>(emptyForm);

  const addStep = () => {
    form.steps.push("");
    setForm(form);
  };
  // ...
};
```

Un clic sur « Ajouter une étape » n'affiche aucun nouveau champ.

<!--
Séance 13. push modifie le tableau existant (mutation) et setForm reçoit le même objet : Object.is(ancien, nouveau) vaut true, React ne refait pas le rendu.
Correction : setForm((prev) => ({ ...prev, steps: [...prev.steps, ""] }));
-->

---

# Trouvez l'erreur (2)

```tsx
{recipes.map((recipe, index) => (
  <RecipeCard key={index} recipe={recipe} onDelete={onDelete} />
))}
```

`RecipeCard` contient un état local `isFavorite` (séance 11). L'utilisateur met la 2e recette en favori, puis supprime la 1re : le cœur rempli apparaît sur une **autre** recette.

<!--
Séance 10. Après la suppression, la recette qui était à l'index 2 passe à l'index 1 : React garde l'état de la carte key=1 (favori) et l'affiche avec la recette désormais à l'index 1, c'est-à-dire la suivante.
Correction : key={recipe.id}, une clé stable qui suit la donnée.
-->

---

# Trouvez l'erreur (3)

```tsx
const RecipeActions = ({ recipe, onDelete }: RecipeActionsProps) => (
  <Button color="error" onClick={onDelete(recipe.id)}>
    Supprimer
  </Button>
);
```

TypeScript refuse de compiler : *No overload matches this call*, avec le détail *Type 'void' is not assignable to type 'MouseEventHandler&lt;HTMLButtonElement&gt; | undefined'*.

<!--
Séance 12. onDelete(recipe.id) est un appel : il serait exécuté pendant le rendu, et onClick recevrait son résultat (undefined). Sans TypeScript, chaque recette serait supprimée dès son affichage.
Correction : onClick={() => onDelete(recipe.id)}, une fonction que React appellera au clic.
-->

---

# Trouvez l'erreur (4)

```tsx
const HomePage = ({ recipes, query }: HomePageProps) => {
  const [count, setCount] = useState(0);

  const filtered = recipes.filter((r) => r.title.includes(query));

  useEffect(() => {
    setCount(filtered.length);
  }, [filtered]);

  return <Typography>{count} recette(s)</Typography>;
};
```

L'affichage semble correct, mais le linter signale `set-state-in-effect`.

<!--
Séance 17. count est une valeur dérivée : un état et un effet inutiles, un rendu supplémentaire, et pendant un rendu le nombre affiché est périmé. De plus filtered est un nouveau tableau à chaque rendu, donc l'effet s'exécute après chaque rendu.
Correction : const count = filtered.length; directement pendant le rendu.
-->

---

# Trouvez l'erreur (5)

```tsx
const Countdown = ({ seconds }: CountdownProps) => {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setInterval(() => setRemaining((prev) => prev - 1), 1000);
  }, []);

  return <Typography>{remaining} s</Typography>;
};
```

En développement, le décompte descend de 2 par seconde. Après avoir quitté la page, il continue, et passe sous zéro.

<!--
Séance 18. Aucun nettoyage : StrictMode exécute effet, nettoyage (vide), effet, donc deux intervalles tournent. L'intervalle survit au composant et rien n'arrête le décompte à zéro.
Correction : const intervalId = setInterval(...); return () => clearInterval(intervalId); et arrêter à zéro, par exemple setRemaining((prev) => Math.max(prev - 1, 0)).
-->

---

# Trouvez l'erreur (6)

```tsx
const RecipeDetailPage = ({ recipes }: RecipeDetailPageProps) => {
  const { id } = useParams();
  const recipe = recipes.find((r) => r.id === Number(id));

  if (!recipe) return <Typography>Recette introuvable.</Typography>;

  const [servings, setServings] = useState(recipe.servings);
  // ...
};
```

Le linter signale `rules-of-hooks`.

<!--
Séance 19. useState est appelé après un return conditionnel : selon que la recette existe ou non, le composant n'appelle pas le même nombre de hooks, et React ne retrouve plus ses cases d'état.
Correction : déplacer l'état dans le composant enfant RecipeDetail, qui reçoit une recette existante (séance 16), et y appeler useState au premier niveau.
-->

---

# MiamMiam à la fin de la Partie 3

- **Liste** : cartes MUI, recherche différée, filtre par catégorie, message si aucun résultat
- **Détail** (`/recipes/:id`) : ingrédients, étapes, portions ajustables, titre de l'onglet, message « Recette introuvable »
- **Ajout** (`/recipes/new`) : formulaire contrôlé et validé, ingrédients et étapes dynamiques, brouillon conservé
- **Navigation** : layout commun avec `NavLink`, page 404, navigation après ajout et suppression
- **Favoris** : persistants dans le `localStorage`
- **Architecture** : `useRecipes`, `useFavorites`, `useRecipeDraft` ; aucun composant n'accède directement au stockage ou au module de données
- **Qualité** : `npm run lint` et `npm run build` sans erreur ni warning

---

# Relire son code

Pour chaque fichier, vous devez pouvoir répondre :

- **Chaque ligne** : que fait-elle, et pourquoi est-elle là ?
- **Chaque état** : est-il nécessaire, ou peut-il être calculé à partir d'un autre état ou des props ?
- **Chaque effet** : avec quel système extérieur synchronise-t-il ? Ses dépendances sont-elles complètes ? Démarre-t-il quelque chose qu'un nettoyage doit arrêter ?
- **Chaque mise à jour d'état** : crée-t-elle un nouvel objet ou un nouveau tableau ?
- **Chaque liste** : la `key` est-elle stable et unique ?
- **Chaque composant** : affiche-t-il seulement, ou contient-il de la logique qui appartient à un hook ?

Une ligne que vous ne savez pas expliquer est une ligne à comprendre avant l'examen.

---

# Préparer la Partie 4

En Partie 4, le frontend remplace le module `data/recipes` par des requêtes HTTP vers une API.

Vérifiez dès maintenant que votre backend fonctionne :

```bash
cd backend
npm install
npm run dev        # http://localhost:3000
```

- Testez `GET /recipes`, `POST /auth/login` et `GET /auth/me` avec vos fichiers `.http` (séances 02 et 03)
- Grâce à MVVM, seuls les hooks et les nouveaux services changeront : les composants resteront presque identiques

**Prochaine séance** : Séance 21 — Fetch

---

# Exercice filé S20

1. Pour chaque extrait « Trouvez l'erreur », vérifiez que votre code ne contient pas la même erreur
2. Complétez MiamMiam pour remplir toute la liste de contrôle de la Partie 3
3. Relisez votre code avec les questions de la slide « Relire son code » ; ajoutez un commentaire là où une décision n'est pas évidente
4. Lancez votre backend MiamMiam et testez ses routes principales
5. **Optionnel** : terminez les exercices complémentaires EC04 à EC09, ou lisez la séance complémentaire sur React Context
