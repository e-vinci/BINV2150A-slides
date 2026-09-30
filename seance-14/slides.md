---
theme: default
title: Web 2 - Séance 14 - État partagé
---

# Web 2 — Séance 14
## État partagé

---

# Le problème : deux composants, une donnée
##

On veut une barre de recherche qui filtre la liste des recettes.

```tsx
const SearchBar = () => {
  const [query, setQuery] = useState("");
  return <TextField value={query} onChange={(e) => setQuery(e.target.value)} />;
};

const RecipeList = ({ recipes }: RecipeListProps) => {
  // Comment connaître query ?
};

const App = () => (
  <>
    <SearchBar />
    <RecipeList recipes={recipes} />
  </>
);
```

- L'état `query` est **local** à `SearchBar` : aucun autre composant ne peut le lire
- `SearchBar` et `RecipeList` sont **frères** : aucun ne peut passer de props à l'autre

---

# Flux de données unidirectionnel
##

En React, les données circulent **dans un seul sens** :

- Du parent vers l'enfant, par les **props**
- Un enfant ne peut ni lire l'état de son parent, ni celui de ses frères, sauf si on le lui passe en prop

<br>

```mermaid
flowchart LR
  App -->|props| SearchBar
  App -->|props| RecipeList
  RecipeList -->|props| RecipeCard
```

**Conséquence** : si deux composants doivent partager une donnée, il faut la stocker dans leur **plus proche parent commun**.

---

# Remonter l'état (lifting state up)

1. Identifier les composants qui ont besoin de la donnée : `SearchBar` et `RecipeList`
2. Trouver leur **plus proche parent commun** : `App`
3. Y déplacer l'état
4. Passer la **valeur** aux enfants qui la lisent, et une **fonction** à ceux qui la modifient

```tsx
const App = () => {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [query, setQuery] = useState("");

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <SearchBar value={query} onChange={setQuery} />
      <RecipeList recipes={filteredRecipes} />
    </>
  );
};
```

---

# Un composant contrôlé par son parent

```tsx
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <TextField
      label="Rechercher une recette"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
    />
  );
};
```

- `SearchBar` n'a **plus d'état** : elle affiche ce qu'on lui donne et signale les changements
- C'est exactement le principe d'un champ contrôlé (séance 12) : `value` + `onChange`, appliqué à **notre** composant
- On peut passer directement le setter (`onChange={setQuery}`) : ses types correspondent

---

# Les données descendent, les événements remontent

```mermaid
flowchart TD
  App["App<br/>état : recipes, query"]
  App -- "value = query" --> SearchBar
  SearchBar -. "onChange(texte)" .-> App
  App -- "recipes filtrées" --> RecipeList
  RecipeList -- "recipe" --> RecipeCard
  RecipeCard -. "onDelete(id)" .-> App
```

- Flèches pleines : props (données)
- Flèches pointillées : appels de fonctions reçues en props (événements)
- **Une seule source de vérité** : chaque donnée est stockée à un seul endroit
- Pour savoir pourquoi l'affichage a changé, il suffit de chercher qui appelle le setter

---

# État ou valeur dérivée ?

`filteredRecipes` n'est **pas** un état : il se calcule à partir de `recipes` et `query`.

```tsx
// ❌ Deux états qui doivent rester synchronisés à la main
const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(initialRecipes);
// Ajouter une recette : penser à mettre à jour les deux...

// ✅ Un état, une valeur déduite à chaque rendu
const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
const filteredRecipes = recipes.filter(/* ... */);
```

Question à se poser avant de créer un état : **peut-on le calculer** à partir des props ou d'un autre état ? Si oui, ce n'est pas un état.

---

# Plusieurs filtres combinés

```tsx
const App = () => {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const filteredRecipes = recipes.filter((recipe) => {
    const text = `${recipe.title} ${recipe.description}`.toLowerCase();
    if (!text.includes(query.toLowerCase())) return false;
    if (categoryId !== null && recipe.categoryId !== categoryId) return false;
    return true;
  });

  return (
    <>
      <SearchBar value={query} onChange={setQuery} />
      <CategoryFilter selectedId={categoryId} onSelect={setCategoryId} />
      <Typography>{filteredRecipes.length} recette(s)</Typography>
      <RecipeList recipes={filteredRecipes} onDelete={deleteRecipe} />
    </>
  );
};
```

`null` représente « toutes les catégories ».

---

# Exemple : CategoryFilter

```tsx
interface CategoryFilterProps {
  selectedId: number | null;
  onSelect: (categoryId: number | null) => void;
}

const CategoryFilter = ({ selectedId, onSelect }: CategoryFilterProps) => {
  return (
    <Stack direction="row" spacing={1}>
      <Chip
        label="Toutes"
        color={selectedId === null ? "primary" : "default"}
        onClick={() => onSelect(null)}
      />
      {categories.map((category) => (
        <Chip
          key={category.id}
          label={category.name}
          color={selectedId === category.id ? "primary" : "default"}
          onClick={() => onSelect(category.id)}
        />
      ))}
    </Stack>
  );
};
```

---

# Où placer un état ?

- Un seul composant l'utilise &rarr; **état local** de ce composant
  - Ouverture d'un menu, champ en cours de saisie, nombre de portions affiché
- Plusieurs composants l'utilisent &rarr; dans leur **plus proche parent commun**
  - Recherche, filtres, liste des recettes, favoris affichés à plusieurs endroits
- Le plus bas possible : un état remonté trop haut provoque des rendus inutiles et des props en cascade

```tsx
// ✅ État local : personne d'autre n'a besoin de savoir si les étapes sont affichées
const RecipeDetail = ({ recipe }: RecipeDetailProps) => {
  const [showSteps, setShowSteps] = useState(true);
  // ...
};
```

---

# Limite : les props en cascade

Quand le parent commun est très haut dans l'arbre, les props traversent des composants qui n'en ont pas besoin.

```
App (état : user)
└── PageLayout        user ← ne l'utilise pas, le transmet
    └── Header        user ← ne l'utilise pas, le transmet
        └── UserMenu  user ← l'utilise enfin
```

- On parle de **prop drilling**
- Supportable sur 2 ou 3 niveaux, pénible au-delà : chaque composant intermédiaire doit déclarer et transmettre la prop
- Solution en séance 17 : **React Context**

---

# Récapitulatif Séance 14

- **Flux unidirectionnel** — Les données descendent par les props
- **Lifting state up** — L'état partagé est placé dans le plus proche parent commun
- **Composant contrôlé** — `value` + `onChange` pour nos propres composants
- **Événements vers le haut** — L'enfant appelle une fonction reçue en prop
- **Source de vérité unique** — Chaque donnée est stockée à un seul endroit
- **Valeurs dérivées** — Filtrage et compteurs calculés pendant le rendu
- **Placement** — Le plus bas possible, là où tous les utilisateurs de la donnée y ont accès
- **Prop drilling** — Props transmises à travers des composants qui ne les utilisent pas

**Prochaine séance** : Séance 15 — Routage

---

# Exercice filé S14 partie 1

1. Modifiez la liste de recettes pour qu'elle corresponde à une variable d'état
2. Faites en sorte que le composant `AddRecipeForm` ajoute une recette à la liste quand on soumet le formulaire
3. Ajoutez un bouton « Supprimer » à chaque carte de recette
4. Faites en sorte que ce bouton supprime la recette correspondante de la liste

---

# Exercice filé S14 partie 2

1. Créez un composant `SearchBar` contrôlé par `App` (props `value` et `onChange`) ; la recherche porte sur le titre et la description, sans tenir compte des majuscules
2. Créez un composant `CategoryFilter` qui affiche un `Chip` par catégorie et un `Chip` « Toutes »
3. Dans `App`, calculez la liste filtrée à partir de la liste des recettes, de la recherche et de la catégorie choisie ; affichez le nombre de résultats
4. Si aucune recette ne correspond, affichez un message et un bouton qui réinitialise les filtres
5. Remontez l'état des favoris : `App` stocke les ids des recettes favorites (`number[]`) ; `FavoriteButton` devient un composant contrôlé (`isFavorite`, `onToggle`)
6. Affichez le nombre de favoris dans l'en-tête de `PageLayout`
7. **Optionnel** : ajoutez un filtre « Favoris uniquement » (case à cocher ou `Chip`)
