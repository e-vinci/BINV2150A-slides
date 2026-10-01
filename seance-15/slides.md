---
theme: default
title: Web 2 - Séance 15 - Routage
---

# Web 2 — Séance 15
## Routage

---

# Plusieurs pages

MiamMiam affiche tout sur une seule page : liste, formulaire, détail d'une recette. On voudrait :

- `/` : la liste des recettes
- `/recipes/3` : le détail de la recette 3
- `/recipes/new` : le formulaire d'ajout

Chaque page doit avoir sa propre **URL** :

- On peut la mettre en favori ou la partager
- Les boutons « Précédent » et « Suivant » du navigateur fonctionnent
- Un rechargement (F5) réaffiche la même page

---

# Site multi-pages (MPA)

Fonctionnement « classique » d'un site web (*Multi-Page Application*) :

```
Clic sur un lien <a href="/recipes/3">
  → le navigateur envoie GET /recipes/3 au serveur
  → le serveur renvoie une nouvelle page HTML complète
  → le navigateur efface la page actuelle et affiche la nouvelle
```

- Chaque navigation recharge **tout** : HTML, CSS, JavaScript
- Tout l'état JavaScript de la page est perdu (variables, état React)
- Écran blanc bref entre deux pages

---

# Application monopage (SPA)

Une application React est une **Single-Page Application** :

```
Premier chargement : le serveur renvoie index.html + le bundle JavaScript
Clic sur un lien :
  → JavaScript intercepte le clic (pas de requête au serveur)
  → JavaScript change l'URL affichée dans la barre d'adresse
  → React affiche d'autres composants
```

- Un seul fichier HTML, chargé une fois
- Navigation instantanée, l'état de l'application est conservé
- L'URL est gérée **par le JavaScript**, avec l'API *History* du navigateur
  - `history.pushState(...)` : change l'URL et ajoute une entrée dans l'historique, sans requête
  - L'événement `popstate` : l'utilisateur a cliqué sur « Précédent »

---

# Routage côté client
##

Le **routage** associe une URL à ce qu'il faut en faire.

- Côté backend (Express) : une route associe une méthode et un chemin à un middleware ou un contrôleur
- Côté frontend : une route associe un chemin à un **composant**

```
/               →  HomePage
/recipes/new    →  AddRecipePage
/recipes/:id    →  RecipeDetailPage
autre chose     →  NotFoundPage
```

<br>

> ⚠️ Au chargement de la page, le navigateur effectue une requête au serveur de fichier. 
> Avec le routage côté client, le serveur doit renvoyer `index.html` pour **toutes** les URLs de l'application.
> Le serveur de développement de Vite le fait automatiquement, mais un serveur de production doit être configuré pour le faire aussi.

---

# React Router

Bibliothèque de routage la plus utilisée avec React.

```bash
npm install react-router
```

- Depuis la version 7, tout s'importe depuis `"react-router"`
- Beaucoup d'exemples en ligne importent depuis `"react-router-dom"` : c'était le nom du paquet jusqu'à la version 6, l'API est la même pour ce que nous utilisons
- React Router peut aussi servir de framework complet (chargement de données, rendu serveur) : nous n'utilisons que le routage (*declarative mode*)

---

# Déclarer les routes

```tsx
import { BrowserRouter, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";
import AddRecipePage from "./pages/AddRecipePage";
import RecipeDetailPage from "./pages/RecipeDetailPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipes/new" element={<AddRecipePage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
};
```

- `BrowserRouter` : synchronise React avec l'URL du navigateur (API History)
- `Routes` : choisit, parmi ses `Route`, celle qui correspond à l'URL actuelle
- `Route` : associe un `path` à un `element` (du JSX, avec ses props)
- `:id` : segment **dynamique**, correspond à n'importe quelle valeur (`/recipes/3`, `/recipes/42`)

---

# Correspondance des routes
##

Pour l'URL `/recipes/new`, deux routes correspondent : `/recipes/new` et `/recipes/:id`.

- React Router choisit la route **la plus spécifique** : un segment fixe (`new`) l'emporte sur un segment dynamique (`:id`)
- L'ordre de déclaration n'a pas d'importance

```
/                →  HomePage
/recipes/new     →  AddRecipePage       (segment fixe)
/recipes/3       →  RecipeDetailPage    (id = "3")
/recipes/abc     →  RecipeDetailPage    (id = "abc" : à vérifier dans la page)
/recipes         →  aucune route
```

- Une page est un composant comme un autre 
- On les range dans `src/pages` pour les distinguer des composants réutilisables de `src/components`

---

# Naviguer avec Link
##

Un `<a href>` classique provoquerait une requête au serveur et un rechargement complet.

```tsx
import { Link } from "react-router";

const RecipeCard = ({ recipe }: RecipeCardProps) => (
  <Card>
    <Typography variant="h6">{recipe.title}</Typography>
    <Link to={`/recipes/${recipe.id}`}>Voir la recette</Link>
  </Card>
);
```

- `Link` génère un vrai `<a href="/recipes/3">` (clic droit, ouverture dans un onglet fonctionnent)
- Mais intercepte le clic : `preventDefault()` puis `history.pushState()`, sans rechargement
- Avec MUI, la prop `component` permet d'utiliser `Link` pour le rendu d'un bouton :

```tsx
<Button component={Link} to={`/recipes/${recipe.id}`}>Voir la recette</Button>
```

---

# NavLink : lien de navigation
##

`NavLink` est un `Link` qui sait s'il correspond à la page actuelle.

```tsx
import { NavLink } from "react-router";

<nav>
  <NavLink to="/" end>Recettes</NavLink>
  <NavLink to="/recipes/new">Ajouter</NavLink>
</nav>
```

- Ajoute automatiquement la classe CSS `active` au lien de la page courante
- `end` : le lien `/` n'est actif que sur `/` exactement (sinon `/` correspond au début de toutes les URLs)

```tsx
// Avec MUI : style du lien actif via sx
<Button
  component={NavLink} to="/" end color="inherit"
  sx={{ "&.active": { textDecoration: "underline" } }}
>
  Recettes
</Button>
```

---

# Un layout commun : routes imbriquées

L'en-tête et le pied de page sont les mêmes sur toutes les pages : on les place dans une **route parente**.

```tsx
<Routes>
  <Route element={<Layout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/recipes/new" element={<AddRecipePage />} />
    <Route path="/recipes/:id" element={<RecipeDetailPage />} />
  </Route>
</Routes>
```

- La route parente n'a pas de `path` : elle entoure ses routes enfants
- Pour l'URL `/recipes/3`, React Router affiche `Layout`, **et** `RecipeDetailPage` à l'intérieur de `Layout`
- En naviguant, seule la page change : `Layout` reste affiché et garde son état

---

# Outlet
##

`Outlet` indique **où** la route enfant s'affiche dans la route parente.

```tsx
import { Outlet } from "react-router";

const Layout = () => {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>MiamMiam</Typography>
          <Button component={NavLink} to="/" end color="inherit">Recettes</Button>
          <Button component={NavLink} to="/recipes/new" color="inherit">Ajouter</Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 4 }}>
        <Outlet /> {/* HomePage, AddRecipePage ou RecipeDetailPage */}
      </Container>
    </>
  );
};
```

---

# Route index et page 404

```tsx
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<HomePage />} />
    <Route path="recipes/new" element={<AddRecipePage />} />
    <Route path="recipes/:id" element={<RecipeDetailPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Route>
</Routes>
```

- Les chemins enfants sont **relatifs** au parent : `recipes/new` sous `/` donne `/recipes/new`
- `index` : route affichée quand l'URL correspond **exactement** au parent (`/`)
- `path="*"` : correspond à toute URL qu'aucune autre route ne reconnaît

```tsx
const NotFoundPage = () => (
  <>
    <Typography variant="h4" component="h1">Page introuvable</Typography>
    <Button component={Link} to="/">Retour aux recettes</Button>
  </>
);
```

---

# Et l'état de l'application ?

- Les variables d'état qui doivent être partagées entre plusieurs pages doivent être **placées dans le composant parent** qui ne disparaît jamais : `App`.
- La liste des recettes et les filtres sont dans l'état de `App` (séances 13 et 14). Les pages les reçoivent **en props**, via `element` :

```tsx
const App = () => {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  // ... addRecipe, deleteRecipe, filtres ...

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage recipes={recipes} onDelete={deleteRecipe} />} />
          <Route path="recipes/new" element={<AddRecipePage onAdd={addRecipe} />} />
          <Route path="recipes/:id" element={<RecipeDetailPage recipes={recipes} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
```

---

# Récapitulatif Séance 15

- **MPA** — Chaque navigation recharge une page HTML depuis le serveur
- **SPA** — Un seul HTML, le JavaScript change l'URL et le contenu (API History)
- **React Router** — `npm install react-router`, imports depuis `"react-router"`
- **BrowserRouter / Routes / Route** — Associer des chemins à des composants
- **Segment dynamique** — `:id` correspond à n'importe quelle valeur
- **Link / NavLink** — Navigation sans rechargement ; classe `active` et `end` pour NavLink
- **Routes imbriquées + Outlet** — Layout commun, la page s'affiche dans l'`Outlet`
- **index et `*`** — Route par défaut du parent, page 404

**Prochaine séance** : Séance 16 — React Router hooks

---

# Exercice filé S15

1. Installez React Router
2. Créez un dossier `src/pages` avec `HomePage` (recherche, filtres et liste), `AddRecipePage` (formulaire), `RecipeDetailPage` et `NotFoundPage`
3. Transformez `PageLayout` en composant `Layout` pour une route parente : `AppBar` avec des `NavLink` « Recettes » et « Ajouter une recette », le nombre de favoris, et un `Outlet`
4. Déclarez les routes dans `App` : `/`, `/recipes/new`, `/recipes/:id` et la page 404 ; l'état reste dans `App` et est passé aux pages en props
5. Dans `RecipeCard`, ajoutez un bouton « Voir la recette » qui mène à `/recipes/:id`
6. Pour l'instant, `RecipeDetailPage` affiche `RecipeDetail` avec la **première** recette : on lira l'id de l'URL en séance 16
7. Vérifiez que les recettes ajoutées sont toujours présentes après avoir navigué entre les pages, et qu'elles disparaissent après un rechargement (F5) : pourquoi ?
