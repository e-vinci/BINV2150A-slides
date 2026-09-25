---
theme: default
title: Web 2 - Séance 10 - Modules et collections
---

# Web 2 — Séance 10
## Modules et collections

---

# Organisation des fichiers


```
src/
├── App.tsx        # Composant principal
├── models/        # Types : à quoi ressemble une recette ?
│   ├── recipe.ts
│   └── category.ts
├── data/          # Données : quelles sont les recettes ?
│   ├── recipes.ts
│   └── categories.ts
└── components/    # Affichage : comment montrer une recette ?
    ├── RecipeCard.tsx
    └── RecipeList.tsx
```

---

# Le modèle Recipe

Le modèle reprend **exactement** le `RecipeDTO` renvoyé par le backend MiamMiam.

```ts
// models/recipe.ts
export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  prepTime: number;   // minutes
  cookTime: number;   // minutes
  servings: number;
  difficulty: number; // 1 à 5
  categoryId: number;
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
  authorId: number;
}
```

---

# Un module de données

```ts
// data/recipes.ts
import type { Recipe } from "../models/recipe";

export const recipes: Recipe[] = [
  {
    id: 1,
    title: "Pancakes moelleux",
    description: "Des pancakes épais et aérés pour un brunch réussi.",
    imageUrl: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800",
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    difficulty: 1,
    categoryId: 3,
    tags: ["brunch", "sucré", "rapide"],
    ingredients: [
      { name: "farine", quantity: 250, unit: "g" },
      { name: "lait", quantity: 300, unit: "ml" },
    ],
    steps: ["Mélanger la farine, le sucre et la levure.", "Cuire dans une poêle chaude."],
    authorId: 2,
  },
  // ...
];
```

---

# Passer un objet en prop

Plutôt que de passer chaque champ séparément, on peut passer la recette entière.

```tsx
interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard = ({ recipe }: RecipeCardProps) => {
  return (
    <Card>
      <CardMedia component="img" height="200" image={recipe.imageUrl} alt={recipe.title} />
      <CardContent>
        <Typography variant="h6" component="h2">{recipe.title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {recipe.prepTime + recipe.cookTime} min
        </Typography>
      </CardContent>
    </Card>
  );
};
```

- Une seule prop, typée par le modèle
- Si le modèle évolue, l'interface des props suit automatiquement
- Alternative : le spread `<RecipeCard {...recipe} />` passe chaque propriété comme une prop séparée

---

# Afficher une collection avec map()
##

En JSX, une expression `{...}` peut contenir un **tableau de JSX** : React les affiche les uns après les autres.

```tsx
const titles = [<li>Pancakes</li>, <li>Carbonara</li>]; // un tableau de JSX (sans key : warning, voir plus loin)
<ul>{titles}</ul>
```

Pour afficher une collection de données, on peut utiliser `map` pour le transformer en un tableau de JSX :

```tsx
import { recipes } from "../data/recipes";

const RecipeTitles = () => {
  return (
    <ul>
      {recipes.map((recipe) => (
        <li key={recipe.id}>{recipe.title}</li>
      ))}
    </ul>
  );
};
```

- `map` appelle la fonction pour chaque recette et retourne un **nouveau tableau**
- Le tableau d'origine n'est pas modifié

---

# Pourquoi une key ?
##

Quand les données changent, React ne recrée pas toute la page : il **compare** le nouveau JSX à l'ancien et ne modifie dans le DOM que ce qui a changé (**réconciliation**).

Dans une liste, React doit savoir quel élément correspond à quel élément :

```
Avant :  [Carbonara, Guacamole]
Après :  [Pancakes, Carbonara, Guacamole]   (ajout au début)
```

- Sans key, React compare par **position** : il croit que « Carbonara » est devenu « Pancakes », « Guacamole » est devenu « Carbonara », et qu'un élément a été ajouté à la fin
- Avec `key={recipe.id}`, il sait que Carbonara et Guacamole n'ont pas changé : il insère un seul élément

Règles :

- La `key` se place sur l'élément **retourné par `map`** (le plus externe)
- Elle doit être **unique parmi ses frères** et **stable** (toujours la même pour la même donnée)
- Elle n'est pas transmise au composant : ce n'est pas une prop

---

# Quelle key choisir ?

- **Index** : acceptable seulement si la liste ne change jamais d'ordre ni de taille (rare) : ⚠️

```tsx
{recipe.steps.map((step, index) => <li key={index}>{step}</li>)}
```

- **Identifiant unique** venant des données (l'`id`, pas le titre : deux recettes peuvent avoir le même) : ✅

```tsx
{recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
```

Oubli de la key &rarr; warning dans la console : *Each child in a list should have a unique "key" prop*

---

# filter() puis map()

```tsx
const QuickRecipes = () => {
  return (
    <Grid container spacing={2}>
      {recipes
        .filter((recipe) => recipe.prepTime + recipe.cookTime <= 20)
        .map((recipe) => (
          <Grid key={recipe.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <RecipeCard recipe={recipe} />
          </Grid>
        ))}
    </Grid>
  );
};
```

- `filter` réduit le tableau, `map` transforme le résultat en JSX
- Aucune des deux méthodes ne modifie `recipes`
- Les données restent la **source de vérité**, l'affichage en est déduit

---

# Liste vide

Une collection peut être vide : il faut prévoir l'affichage correspondant.

```tsx
const RecipeList = () => {
  if (recipes.length === 0) {
    return <Typography>Aucune recette pour le moment.</Typography>;
  }

  return (
    <Grid container spacing={2}>
      {recipes.map((recipe) => (
        <Grid key={recipe.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <RecipeCard recipe={recipe} />
        </Grid>
      ))}
    </Grid>
  );
};
```

Le **retour anticipé** (guard clause) évite une condition autour de tout le JSX.

---

# Récapitulatif Séance 10

- **Organisation** — `models/` pour les types, `data/` pour les données, `components/` pour l'affichage
- **map()** — Transformer un tableau de données en tableau de JSX
- **key** — Identifiant unique et stable obligatoire dans les tableaux de JSX
- **filter** — Sélectionner des données avant de les afficher

**Prochaine séance** : Séance 11 — useState

---

# Exercice filé S10

1. Créez `src/models/recipe.ts` (interfaces `Ingredient` et `Recipe`) et `src/models/category.ts` (interface `Category` : `id`, `name`, `description`)
2. Téléchargez les fichiers `recipes.ts` et `categories.ts` de la séance 10 sur moodle et placez-les dans `src/data` (ce sont les recettes du backend)
3. Modifiez `RecipeCard` pour recevoir une prop `recipe: Recipe` ; affichez le nom de la catégorie dans le `Chip` et les tags dans des `Chip` supplémentaires
4. Modifiez `RecipeList` pour afficher toutes les recettes du module de données avec `map` et `Grid`
5. Créez un composant `RecipeDetail` qui reçoit une recette et affiche toutes ses informations : description, temps, portions, ingrédients (`ul > li` : « 250 g farine ») et étapes (`ol > li`)
6. Affichez provisoirement `RecipeDetail` avec la première recette sous la liste (elle aura sa propre page en séance 15)
7. Vérifiez qu'aucun warning de `key` n'apparaît dans la console
