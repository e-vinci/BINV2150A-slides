---
theme: default
title: Web 2 - Séance 21 - Fetch
---

# Web 2 — Séance 21
## Fetch

---

# Partie 4 : relier le frontend et le backend

Jusqu'ici, les recettes viennent d'un module TypeScript compilé **dans** l'application :

- Les modifications sont perdues au rechargement
- Chaque utilisateur a sa propre copie des données
- Le backend des séances 01 à 04 n'est pas utilisé

Objectif des 4 dernières séances : le frontend envoie des **requêtes HTTP** à une API, comme REST Client le faisait en séance 02.

- **S21** : envoyer des requêtes et afficher les réponses
- **S22** : autoriser un frontend à appeler un backend d'une autre origine
- **S23** : se connecter et rester connecté
- **S24** : envoyer des requêtes authentifiées

---

# Une API de démonstration : JSON Server

Pour cette séance, une petite API est fournie sur moodle : `miammiam-api`

```bash
cd miammiam-api
npm install
npm start          # http://localhost:3001
```

- **JSON Server** génère une API REST complète à partir d'un fichier `db.json`
- `db.json` contient des recettes et des catégories au **même format** que le backend MiamMiam
- Routes : `GET /recipes`, `GET /recipes/1`, `POST /recipes`, `PUT /recipes/1`, `DELETE /recipes/1`, `GET /categories`…
- Aucune authentification
- Port 3001, pour ne pas entrer en conflit avec le backend MiamMiam (port 3000)

Testez-la d'abord dans le navigateur : http://localhost:3001/recipes

---

# L'API fetch
##

`fetch` est une fonction du navigateur qui envoie une requête HTTP et retourne une **Promise**.

```ts
const response = await fetch("http://localhost:3001/recipes");
const recipes = await response.json();
```

Deux étapes, donc deux `await` :

1. `fetch(url)` : se résout dès que les **en-têtes** de la réponse sont reçus &rarr; un objet `Response`
2. `response.json()` : lit le **corps** de la réponse (qui peut être long à arriver) et le parse en JSON

Sans option, `fetch` envoie une requête `GET` sans en-têtes ni corps ou paramètres.

---

# L'objet Response

```ts
const response = await fetch("http://localhost:3001/recipes/42");

response.status;      // 404
response.ok;          // false : true uniquement pour un statut 200 à 299
```

⚠️ `fetch` ne rejette **pas** la Promise pour un statut d'erreur HTTP (404, 500…) : le serveur a répondu, la requête a donc réussi du point de vue du réseau.

| Situation | Résultat de `fetch` |
|---|---|
| 200, 201, 204 | Promise résolue, `response.ok === true` |
| 400, 401, 404, 500… | Promise résolue, `response.ok === false` |
| Serveur éteint, pas de réseau, requête bloquée | Promise **rejetée** (`TypeError: Failed to fetch`) |

Il faut donc **toujours** vérifier `response.ok`.

---

# Typer la réponse
##

`response.json()` retourne une `Promise<any>` : TypeScript ne sait pas ce que le serveur a envoyé.

```ts
import type { Recipe } from "../models/recipe";

const getRecipes = async (): Promise<Recipe[]> => {
  const response = await fetch("http://localhost:3001/recipes");
  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status}`);
  }
  const data = await response.json();
  return data as Recipe[];
};
```

- `as Recipe[]` est une **affirmation** : on dit à TypeScript de nous croire, rien n'est vérifié à l'exécution
- C'est acceptable parce que le frontend et le backend partagent le même contrat (les DTO)
- Pour une API externe non maîtrisée, on validerait la réponse avec un type guard (séance 01)
- `throw` : l'erreur HTTP devient une Promise rejetée, traitée comme une erreur réseau par l'appelant

---

# Envoyer des données

```ts
const createRecipe = async (newRecipe: NewRecipe): Promise<Recipe> => {
  const response = await fetch("http://localhost:3001/recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newRecipe),
  });
  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status}`);
  }
  const data = await response.json();
  return data as Recipe; // la recette créée, avec son id
};
```

Le deuxième paramètre décrit la requête :

- `method` : le verbe HTTP
- `headers` : les en-têtes ; `Content-Type` indique au serveur que le corps est du JSON
- `body` : le corps, sous forme de **string** &rarr; `JSON.stringify` convertit un objet en JSON

---

# Une couche service
##

Les appels HTTP sont regroupés dans une couche **service**.
```ts
// services/recipes.service.ts
import type { Recipe } from "../models/recipe";

const API_URL = "http://localhost:3001";

export const getRecipes = async (): Promise<Recipe[]> => {
  const response = await fetch(`${API_URL}/recipes`);
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
  const data = await response.json();
  return data as Recipe[];
};

export const getRecipe = async (id: number): Promise<Recipe> => {
  const response = await fetch(`${API_URL}/recipes/${id}`);
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
  const data = await response.json();
  return data as Recipe;
};
```

Dans le modèle MVVM, les services font partie du **Model** : `useRecipes` appellera `getRecipes` au lieu de lire le module `data/recipes`.

---

# Quand envoyer la requête ?
##

Charger les recettes quand la page s'affiche : **synchronisation** avec le serveur &rarr; un effet.

```tsx
const [recipes, setRecipes] = useState<Recipe[]>([]);

useEffect(() => {
  getRecipes().then((data) => setRecipes(data));
}, []);
```

- Premier rendu : `recipes` vaut `[]`, la liste est vide
- L'effet envoie la requête, la réponse arrive plus tard
- `setRecipes` provoque un nouveau rendu avec les recettes
- La fonction passée à `useEffect` ne peut pas être `async`
  - On utilise `.then` ou une fonction `async` déclarée dans l'effet

```tsx
useEffect(() => {
  const loadRecipes = async () => {
    const data = await getRecipes();
    setRecipes(data);
  };
  loadRecipes();
}, []);
```

---

# Trois états : chargement, erreur, données

Une requête peut être **en cours**, **échouée** ou **réussie** : l'affichage doit prévoir les trois cas.

```tsx
const [recipes, setRecipes] = useState<Recipe[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  getRecipes()
    .then((data) => setRecipes(data))
    .catch((err: unknown) => setError(err instanceof Error ? err.message : "Erreur inconnue"))
    .finally(() => setLoading(false));
}, []);
```

```tsx
if (loading) return <CircularProgress />;
if (error) return <Alert severity="error">Impossible de charger les recettes : {error}</Alert>;
return <RecipeList recipes={recipes} />;
```

- `catch` reçoit une valeur de type `unknown` : n'importe quoi peut être lancé avec `throw`
- `finally` s'exécute dans les deux cas : fin du chargement

---

# Requêtes concurrentes
##

Sur la page de détail, l'id change quand on navigue de la recette 3 à la recette 5 :

```
Requête GET /recipes/3 envoyée
Navigation vers /recipes/5
Requête GET /recipes/5 envoyée
Réponse de /recipes/5 reçue   → affiche la recette 5
Réponse de /recipes/3 reçue   → affiche la recette 3 ! (réponse plus lente)
```

Le nettoyage de l'effet (séance 18) permet d'**ignorer** une réponse devenue inutile :

```tsx
useEffect(() => {
  let ignore = false;
  getRecipe(recipeId).then((data) => {
    if (!ignore) setRecipe(data);
  });
  return () => {
    ignore = true; // l'id a changé ou la page a été quittée
  };
}, [recipeId]);
```

---

# Le hook useRecipes
##

Le ViewModel de la séance 19 change de source de données ; son interface ne change presque pas.

```ts
// hooks/useRecipes.ts
export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getRecipes()
      .then((data) => { if (!ignore) setRecipes(data); })
      .catch((err: unknown) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Erreur inconnue");
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  // addRecipe et deleteRecipe modifient encore uniquement l'état local
  return { recipes, loading, error, addRecipe, deleteRecipe };
};
```

Les pages ajoutent l'affichage du chargement et de l'erreur ; le reste ne change pas.

---

# Observer les requêtes
##

Onglet **Réseau** (*Network*) des outils de développement :

- Une ligne par requête : méthode, URL, statut, durée
- Cliquer sur une requête : en-têtes, corps envoyé (*Payload*), réponse (*Response*, *Preview*)
- Filtre *Fetch/XHR* : n'afficher que les requêtes envoyées par le JavaScript
- *Throttling* : simuler une connexion lente pour voir le chargement

---

# Récapitulatif Séance 21

- **fetch** — Envoie une requête HTTP, retourne une `Promise<Response>`
- **Deux étapes** — `await fetch(...)` pour les en-têtes, `await response.json()` pour le corps
- **response.ok** — `fetch` ne rejette pas pour un statut d'erreur HTTP : toujours le vérifier
- **Options** — `method`, `headers` (`Content-Type`), `body` (`JSON.stringify`)
- **Typage** — `as Recipe[]` : affirmation non vérifiée, justifiée par un contrat commun
- **Services** — Les appels HTTP regroupés dans `services/`, partie Model de MVVM
- **Effet** — Chargement des données dans `useEffect`, jamais pendant le rendu
- **Trois états** — `loading`, `error`, données
- **Réponses obsolètes** — Drapeau `ignore` mis à jour par le nettoyage de l'effet

**Prochaine séance** : Séance 22 — CORS et proxy

---

# Exercice filé S21

1. Téléchargez `miammiam-api` sur moodle, installez-la et lancez-la ; testez `GET /recipes` et `GET /categories` dans le navigateur
2. Créez `services/recipes.service.ts` (`getRecipes`, `getRecipe`) et `services/categories.service.ts` (`getCategories`)
3. Modifiez `useRecipes` pour charger les recettes depuis l'API ; supprimez `data/recipes.ts`
4. Créez un hook `useCategories` sur le même modèle ; supprimez `data/categories.ts`
5. Affichez un `CircularProgress` pendant le chargement et une `Alert` en cas d'erreur ; testez en arrêtant JSON Server et avec le *throttling* du navigateur
6. La page de détail charge sa recette avec `getRecipe` (et le drapeau `ignore`) ; en cas d'erreur (testez `/recipes/999`), elle affiche « Recette introuvable »
7. **Optionnel** : ajoutez `createRecipe` et utilisez-le dans `addRecipe` ; vérifiez dans `db.json` que la recette a été enregistrée
