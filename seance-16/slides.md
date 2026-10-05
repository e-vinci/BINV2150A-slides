---
theme: default
title: Web 2 - Séance 16 - React Router hooks
---

# Web 2 — Séance 16
## React Router hooks

---

# Hooks de React Router
##

`BrowserRouter` connaît l'URL actuelle et sait naviguer. Ses **hooks** donnent accès à ces informations depuis n'importe quel composant situé à l'intérieur :

- `useParams` : lire les segments dynamiques de l'URL (`:id`)
- `useNavigate` : naviguer depuis le code (après une action)
- `useLocation` : lire l'URL actuelle
- `useSearchParams` : lire et modifier les paramètres de requête (`?search=...`)

Ce sont des hooks : mêmes règles que `useState` (séance 11), et ils ne fonctionnent que dans un composant affiché **à l'intérieur** de `BrowserRouter`.

---

# useParams : lire l'URL

```tsx
// Route déclarée dans App
<Route path="recipes/:id" element={<RecipeDetailPage recipes={recipes} />} />
```

```tsx
import { useParams } from "react-router";

const RecipeDetailPage = ({ recipes }: RecipeDetailPageProps) => {
  const { id } = useParams(); // URL /recipes/3 → { id: "3" }
  // ...
};
```

- Retourne un objet : une propriété par segment dynamique de la route
- Le nom de la propriété est celui déclaré dans `path` (`:id` &rarr; `id`)
- Le composant est **réaffiché** quand l'URL change (de `/recipes/3` à `/recipes/5`), 
  - ⚠️ Réaffiché, pas recréé : ses états (par exemple le nombre de portions choisi) sont **conservés**
  - Pour repartir de zéro à chaque recette, il faut donner une `key` au composant

---

# Les paramètres sont des chaînes

Une URL est du texte : `useParams` retourne toujours des `string`, ou `undefined`.

```tsx
const { id } = useParams();       // id : string | undefined
const recipeId = Number(id);      // "3" → 3, "abc" → NaN, undefined → NaN

const recipe = recipes.find((r) => r.id === recipeId);

if (!recipe) {
  return <Typography>Recette introuvable.</Typography>;
}

return <RecipeDetail recipe={recipe} />;
```

- Même problème que `req.params.id` dans les contrôleurs du backend : il faut convertir et vérifier
- L'utilisateur peut taper n'importe quelle URL : `/recipes/abc`, `/recipes/999`
- Guard clause : traiter le cas « introuvable » d'abord, le reste du composant peut utiliser `recipe` sans `?.`

---

# useNavigate : naviguer après une action

- `Link` navigue quand l'utilisateur **clique sur un lien**
- Pour naviguer **après une action** (formulaire soumis, recette supprimée), on utilise `useNavigate`.

```tsx
import { useNavigate } from "react-router";

const AddRecipePage = ({ onAdd }: AddRecipePageProps) => {
  const navigate = useNavigate();

  const handleAdd = (newRecipe: NewRecipe) => {
    onAdd(newRecipe);
    navigate("/"); // retour à la liste
  };

  return <RecipeForm onAdd={handleAdd} />;
};
```

- `useNavigate()` retourne une **fonction** `navigate`
- On l'appelle dans un handler d'événement, **jamais** directement pendant le rendu

---

# Options de navigation

```tsx
const navigate = useNavigate();

navigate("/recipes/3");               // ajoute une entrée dans l'historique
navigate("/", { replace: true });     // remplace l'entrée actuelle
navigate(-1);                         // comme le bouton « Précédent »
```

`replace` : l'utilisateur ne doit pas pouvoir revenir sur la page actuelle avec « Précédent ».

```
Historique après navigate("/")                /, /recipes/new, /
Historique après navigate("/", { replace })   /, /
```

Exemple : après la suppression d'une recette depuis sa page de détail, revenir sur cette page n'a plus de sens.

> ⚠️ Si la page a été ouverte directement (lien partagé, nouvel onglet), il n'y a pas de page précédente dans l'application : `navigate(-1)` quitte le site. Un lien vers `/` est plus sûr pour un bouton « Retour à la liste ».

---

# Exemple : page de détail complète

```tsx
const RecipeDetailPage = ({ recipes, onDelete }: RecipeDetailPageProps) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const recipe = recipes.find((r) => r.id === Number(id));

  if (!recipe) {
    return (<>
      <Typography>Recette introuvable.</Typography>
      <Button component={Link} to="/">Retour aux recettes</Button>
    </>);
  }

  const handleDelete = () => {
    onDelete(recipe.id);
    navigate("/", { replace: true });
  };

  return (<>
    <Button onClick={() => navigate(-1)}>Retour</Button>
    <RecipeDetail recipe={recipe} />
    <Button color="error" onClick={handleDelete}>Supprimer</Button>
  </>);
};
```

---

# useLocation : l'URL actuelle

```tsx
import { useLocation } from "react-router";

const Layout = () => {
  const location = useLocation();
  // URL : http://localhost:5173/recipes/3?from=home#ingredients

  console.log(location.pathname); // "/recipes/3"
  console.log(location.search);   // "?from=home"
  console.log(location.hash);     // "#ingredients"
  // ...
};
```

Utile pour adapter l'affichage à la page courante :

```tsx
const navigate = useNavigate();
const isHome = location.pathname === "/";

{!isHome && <Button onClick={() => navigate(-1)}>Retour</Button>}
```

Pour mettre en évidence le lien actif, `NavLink` (séance 15) le fait déjà.

---

# Paramètres de requête

Les **query parameters** décrivent une variante de la page : filtres, tri, pagination.

```
/?search=chocolat
```

Placer les filtres dans l'URL plutôt que dans un état :

- Le lien peut être partagé ou mis en favori avec les filtres actifs
- « Précédent » revient aux filtres précédents
- Les filtres survivent au rechargement de la page

L'URL devient alors une **source de vérité**, au même titre que l'état.

---

# useSearchParams

```tsx
import { useSearchParams } from "react-router";

const HomePage = ({ recipes }: HomePageProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("search") ?? "";        // string | null → string

  const handleSearch = (value: string) => {
    setSearchParams({ search: value }); // URL : /?search=value
  };

  const filtered = recipes.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()));
  // ...
};
```

- Fonctionne comme `useState` : une valeur et une fonction pour la remplacer
- `searchParams.get(nom)` : la valeur (toujours une chaîne), ou `null` si absente
- `setSearchParams(objet)` : remplace **tous** les paramètres de l'URL et provoque un nouveau rendu

---

# Récapitulatif Séance 16

- **Hooks de React Router** — Utilisables dans tout composant situé dans `BrowserRouter`
- **useParams** — Segments dynamiques de l'URL, toujours des chaînes à convertir et vérifier
- **useNavigate** — `navigate(chemin)` dans un handler, après une action
- **replace** — Remplacer l'entrée courante de l'historique
- **navigate(-1)** — Revenir à la page précédente
- **useLocation** — `pathname`, `search`, `hash` de l'URL actuelle
- **useSearchParams** — Paramètres de requête comme source de vérité (filtres partageables)

**Prochaine séance** : Séance 17 — useEffect et stockage web

---

# Exercice filé S16

1. Dans `RecipeDetailPage`, lisez l'id avec `useParams` et affichez la recette correspondante ; affichez un message et un lien vers la liste si elle n'existe pas (testez `/recipes/abc` et `/recipes/999`)
2. Ajoutez un bouton « Retour » en haut de la page de détail
3. Déplacez le bouton « Supprimer » de `RecipeCard` vers la page de détail ; après la suppression, revenez à la liste sans pouvoir revenir sur la page supprimée
4. Après l'ajout d'une recette, naviguez vers la page de détail de la nouvelle recette (`addRecipe` dans `App` doit alors retourner l'id créé, et le type de `onAdd` devient `(recipe: NewRecipe) => number`)
5. Ajoutez un bouton « Annuler » à la page d'ajout, qui revient à la page précédente
6. **Optionnel** : stockez la recherche et la catégorie choisie dans les paramètres de requête avec `useSearchParams` au lieu de l'état de `App` ; vérifiez qu'un rechargement conserve les filtres. 
    - ⚠️ `setSearchParams` remplace **tous** les paramètres, il faut donc inclure la catégorie si on change la recherche, et vice versa.
