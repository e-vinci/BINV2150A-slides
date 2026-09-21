---
theme: default
title: Web 2 - Séance 07 - Projet Vite et composant React
---

# Web 2 — Séance 07
## Projet Vite et composant React

---

# React

- Bibliothèque JavaScript pour construire des interfaces utilisateur
- **Déclaratif**
  - Le développeur décrit l'UI
  - React gère les mises à jour du DOM
- Basé sur les **composants**
  - Pièces réutilisables d'interface
  - Unités autonomes

---

# Vite

- Outil de build pour les applications web modernes
- Permet de créer un projet React + TypeScript en quelques commandes
- Transpile le code TypeScript/JSX en JavaScript compatible navigateur
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
  - Sélectionner `React` puis `TypeScript` (répondre non aux options expérimentales)
  - Ou tout en une commande : `npm create vite@latest frontend -- --template react-ts`
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
- **index.html**: Contient `<div id="root"></div>` pour React, ne modifier que le `<title>` et `lang`
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

// Avec des fonctions
function formatDuration(minutes: number): string {
  return `${minutes} minutes`;
}
const duration = 1; // en heures
const info = <p>Durée: {formatDuration(duration * 60)}</p>

// Avec des conditions (ternaires)
const difficulty = "facile";
const badge = (
  <span>
    {difficulty === "facile" ? "✅" : "⚠️"}
  </span>
);
```

---

# JSX: Différences avec HTML

- `className` au lieu de `class` (mot-clé réservé JS)
- `htmlFor` au lieu de `for` (mot-clé réservé JS)
- Expressions JavaScript entre `{}`
- `style` reçoit un objet, pas une chaîne : `style={{ width: "200px" }}`
- Tags auto-fermants obligatoires : `<img />`, `<input />`, `<br />`
- Une expression JSX a **un seul élément racine** : envelopper dans un `<div>` ou un fragment `<>...</>`
- Commentaires : `{/* ... */}`

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

Fichier généré par Vite, à ne pas modifier pour l'instant :

```tsx
// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- `document.getElementById("root")!` : le `!` de la séance 01, `#root` existe forcément dans `index.html`
- `StrictMode` : mode de développement qui signale les erreurs courantes

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

- Un fichier par composant dès qu'il est réutilisé ailleurs ou qu'il devient long
- Dossier `components/` pour tout ce qui n'est pas `App`
- Nom du fichier = nom du composant

---

# Récapitulatif

- **React** - bibliothèque pour construire des interfaces utilisateur
- **Vite** - bundler moderne pour compiler et servir le code React
- **JSX** - syntaxe HTML-like dans le code TypeScript
- **Composants** - fonctions TypeScript qui retournent du JSX, organisés en fichiers

**Prochaine séance** : Séance 08 — Props et children

---

# Exercice filé S07

1. Créez l'application frontend dans votre dossier d'exercices MiamMiam, avec Vite + React + TypeScript
2. Créez un fichier `RecipeCard.tsx` dans le dossier `src/components`
3. Dans ce fichier, créez l'objet `recipe` suivant :
```tsx
const recipe = {
  title: "Pâtes Carbonara",
  image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800",
  duration: 20,
  difficulty: "Facile",
};
```

4. Créez un composant `RecipeCard` qui affiche cette recette avec la structure suivante :
    - Titre (h2) et image (img), depuis l'objet `recipe`
    - Durée et difficulté (p), depuis l'objet `recipe`
    - Liste des ingrédients (ul > li), écrite en dur : pâtes, œufs, lard, fromage
    - Liste des étapes (ol > li), écrite en dur : cuire les pâtes, mélanger les œufs et le fromage, faire revenir le lard, mélanger le tout

---

# Exercice filé S07 (suite)

5. Enlevez le contenu de `App.tsx` et remplacez-le par le code suivant :

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

6. Intégrez le composant `RecipeCard` dans `App.tsx` pour qu'il s'affiche sous le titre

---

# Exercice complémentaire EC03

1. Téléchargez la page HTML de la séance 07 sur moodle et ouvrez-la dans le navigateur
2. Créez un projet `EC03` dans votre dossier d'exercices complémentaires, avec Vite + React + TypeScript
3. Sur papier, découpez la page en composants : regroupez les parties qui vont ensemble et qui peuvent être réutilisées
4. Créez les composants et assemblez-les dane le projet pour reproduire la page à l'identique
5. Copiez le CSS de la page dans `src/index.css` (le contenu généré par Vite peut être supprimé)
6. Vérifiez que la page s'affiche comme l'originale et que la console du navigateur n'affiche **aucun warning**
7. Pièges à repérer en convertissant le HTML en JSX : `class`, `for`, `style="..."`, balises non fermées, …
