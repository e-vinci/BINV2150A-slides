---
theme: default
title: Web 2 - Séance 07 - Projet Vite et composant React
---

# Web 2 — Séance 07
## Projet Vite et composant React

---

# React

- Librairie JavaScript pour construire des interfaces utilisateur
- **Déclaratif**
  - Le développeur décrit l'UI
  - React gère les mises à jour du DOM
- Basé sur les **composants**
  - Pièces réutilisables d'interfaces
  - Unités autonomes

---

# Vite

- Outil de build pour les applications web modernes
- Permet de créer un projet React + TypeScript en quelques commandes
- Compile le code TypeScript/JSX en JavaScript compatible navigateur
- Gère les dépendances du projet (npm packages)
- Propose un serveur de développement avec hot reload
- Rassemble l'entièreté du code source en un bundle optimisé pour la production
  - Un seul fichier HTML
  - Un seul fichier CSS
  - Un seul fichier JavaScript avec code minifié
  - Fichiers statiques optimisés (images, fonts, etc.)

---

# Créer un projet Vite + React + TypeScript

```bash
npm create vite@latest frontend
cd frontend
npm install
npm run dev
```

- Crée un projet préconfiguré avec Vite
- `frontend` &rarr; nom du projet et du dossier créé
- Vite demande quel template utiliser
  - Sélectionner `React` puis `TypeScript`
  - Passer l'option `--template react-ts` pour automatiser la sélection

---

# Structure du projet

```
frontend/
├── src/
│   ├── main.tsx          # Point d'entrée, monte App
│   ├── App.tsx           # Composant principal
│   ├── App.css           # Styles du composant App 
│   ├── index.css         # Styles globaux
│   └── vite-env.d.ts     # Types Vite
├── index.html            # HTML root
├── vite.config.ts        # Config Vite
├── tsconfig.json         # Config TypeScript
└── package.json          # Dépendances et scripts
```

- **vite.config.ts**: Configure le bundler et le dev server, rien à modifier pour l'instant
- **index.html**: Contient `<div id="root"></div>` pour React, à ne pas modifier
- **main.tsx**: Lance l'application en montant le composant `App` dans le DOM à l'élément `#root`
- **App.tsx**: Composant racine, où commence votre logique

---

# JSX: HTML en JavaScript/TypeScript

Fichiers `.tsx` = TypeScript + JSX. Permet d'écrire du HTML-like dans le code TypeScript.

```tsx
const element = <h1>Bienvenue!</h1>

// Avec des variables
const title = "Recettes"
const greeting = <h2>{title}</h2>

// Avec des attributs
const card = <div className="recipe-card" id="card-1"></div>
```

**Differences clés avec HTML**
- `className` au lieu de `class` (mot-clé réservé JS)
- `htmlFor` au lieu de `for` (mot-clé réservé JS)
- Expressions JavaScript entre `{}`
- Tags auto-fermants: `<img />`

---

# JSX: Expressions et conditions

```tsx
// Variables
const duration = 30;
const time = <p>Durée: {duration} minutes</p>;

// Ternaire
const difficulty = "facile";
const badge = <span>{difficulty === "facile" ? "✅" : "⚠️"}</span>;

// Map pour listes
const ingredients = ["oeuf", "farine", "sucre"];
const list = (
  <ul>
    {ingredients.map((ing) => <li>{ing}</li>)}
  </ul>
);
```

---

# Composants React

Un composant React &rarr; une fonction TypeScript qui retourne du JSX

```tsx
// Convention: PascalCase pour les noms de composants
const Welcome = () => {
  return <h1>Bienvenue dans MiamMiam!</h1>;
};

// Avec du contenu plus complexe
const RecipeCard = () => {
  return (
    <div className="recipe-card">
      <h2>Pâtes Carbonara</h2>
      <p>Durée: 20 minutes</p>
      <p>Difficulté: Facile</p>
    </div>
  );
};
```

- **Naming**: Commencez par une majuscule = composant React
- **Structure**: Une fonction = un composant

---

# Exemple: RecipeCard

```tsx
const RecipeCard = () => {
  return (
    <div className="recipe-card">
      <h2>Pâtes Carbonara</h2>
      <img
        src="carbonara.jpg"
        alt="Pâtes carbonara"
        style={{ width: "200px", height: "150px", objectFit: "cover" }}
      />
      <p>
        <strong>Durée:</strong> 20 minutes
      </p>
      <p>
        <strong>Difficulté:</strong> Facile
      </p>
      <p>
        <strong>Ingrédients:</strong> Pâtes, œufs, lard, fromage
      </p>
    </div>
  )
};

export default RecipeCard;
```

---

# Utiliser un composant

Importer et rendre le composant comme une balise JSX

```tsx
// App.tsx
import RecipeCard from "./RecipeCard";

const App = () => {
  return (
    <div className="app">
      <h1>MiamMiam</h1>
      <RecipeCard />
    </div>
  );
};

export default App;
```

---

# Utiliser un composant (suite)

```tsx
// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

# Plusieurs composants : un fichier


```tsx
// App.tsx
const Header = () => <header>MiamMiam</header>;
const Footer = () => <footer>© 2026</footer>;
const App = () => (
  <div>
    <Header />
    <main>Contenu</main>
    <Footer />
  </div>
);
export default App;
```

- Un composant principal, avec un affichage décomposé en sous-composants
- Un seul composant exporté par fichier

---

# Plusieurs composants : plusieurs fichiers

```
src/
├── App.tsx
├── components/
│   ├── RecipeCard.tsx
│   ├── Header.tsx
│   └── Footer.tsx
```

- Composants réutilisables
- Code complexe
- Meilleure organisation du code

---

# Récapitulatif

- React = bibliothèque pour construire des interfaces utilisateur
- Vite = bundler moderne pour compiler et servir le code React
- JSX = syntaxe HTML-like dans le code TypeScript
- Composants = fonctions TypeScript qui retournent du JSX, organisés en fichiers

**Prochaine séance** : Séance 08 — Props et children

---

# Exercice filé S07

1. Créez l'application frontend dans votre dossier d'exercices MiamMiam, avec Vite + React + TypeScript
2. Créez un fichier `RecipeCard.tsx` dans le dossier `src/components`
3. Dans ce fichier, créez un l'objet `recipe` suivant :
```tsx
const recipe = {
  title: "Pâtes Carbonara",
  image: "https://img.taste.com.au/86bOXAkG/taste/2016/11/carbonara-sauce-28894-1.jpeg",
  duration: 20,
  difficulty: "Facile",
  ingredients: ["Pâtes", "œufs", "lard", "fromage"],
  steps: ["Cuire les pâtes", "Mélanger les œufs et le fromage", "Faire revenir le lard", "Mélanger le tout"]
};
```

4. Créez un composant `RecipeCard` qui affiche cet objet avec la structure suivante :
    - Titre (h2)
    - Image (img)
    - Durée et difficulté (p)
    - Liste des ingrédients (ul > li)
    - Liste des étapes (ol > li)

---

# Exercice filé S07 (suite)

3. Enlevez le contenu de `App.tsx` et le remplacer par le code suivant :

```tsx
const App = () => {
  return (
    <div className="app">
      <h1>MiamMiam</h1>
    </div>
  );
};

export default App;
```

4. Intégrez le composant `RecipeCard` dans `App.tsx` pour qu'il s'affiche sous le titre

---

# Exercice complémentaire SC03

1. Téléchargez la page HTML de la séance 07 sur moodle
2. Créez un projet SC03 dans votre dossier d'exercices complémentaires, avec Vite + React + TypeScript
3. Identifiez les composants nécessaires pour reproduire la page HTML
4. Créez les composants et intégrez-les dans `App.tsx`
5. Assurez-vous d'organiser correctement et lisiblement vos composants
