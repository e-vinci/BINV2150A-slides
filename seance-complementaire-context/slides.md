---
theme: default
title: Web 2 - Séance complémentaire - React Context
---

# Web 2 — Séance complémentaire
## React Context

---

# À propos de cette séance
##

Cette séance n'est pas présentée au cours : elle est fournie aux étudiants qui veulent aller plus loin.

Prérequis :

- Séance 14 : état partagé et props en cascade
- Séance 19 : hooks personnalisés, « un hook partage la logique, pas l'état »
- Séance 23 : le hook `useAuth`, appelé une seule fois dans `App`

Les exemples partent de MiamMiam à la fin de la séance 23 et remplacent les props de l'authentification par un **Context**.

---

# Le problème : les props en cascade
##

Depuis la séance 23, `App` appelle `useAuth` et transmet la session en props :

```
App (useAuth)
├── Layout                  user, isLoggedIn, onLogout ← les transmet
│   └── UserMenu            user, isLoggedIn, onLogout ← les utilise
├── LoginPage               onLogin ← l'utilise
├── AddRecipePage           isLoggedIn ← l'utilise
└── RecipeDetailPage        user ← le transmet
    └── RecipeActions       user ← l'utilise (auteur de la recette ?)
```

- Dans MiamMiam, la cascade reste courte (deux niveaux) : les props sont le bon choix
- Dans une application plus grande, l'utilisateur connecté est utile à des dizaines de composants, parfois à cinq ou six niveaux de profondeur
- Chaque composant intermédiaire doit alors recevoir et retransmettre des props qu'il n'utilise pas
  - **Prop drilling** : les props descendent dans l'arbre, mais ne sont pas utilisées par tous les composants

---

# Le principe du Context
##

Un **Context** permet à un composant de fournir une valeur à **tous ses descendants**, sans la passer en props.

```
AuthProvider (fournit : token, user, login, logout)
└── App
    ├── Layout
    │   └── UserMenu            lit le contexte directement
    ├── LoginPage               lit le contexte directement
    ├── AddRecipePage           lit le contexte directement
    └── RecipeDetailPage
        └── RecipeActions       lit le contexte directement
```

- Le **fournisseur** (*provider*) place une valeur dans l'arbre
- Un **consommateur** lit la valeur du fournisseur le plus proche **au-dessus** de lui
- Quand la valeur change, tous les consommateurs sont réaffichés

Exemples classiques : utilisateur connecté, thème (clair/sombre), langue.

---

# 1. Créer le contexte

```ts
// contexts/AuthContext.ts
import { createContext } from "react";
import type { useAuth } from "../hooks/useAuth";

export type AuthContextType = ReturnType<typeof useAuth>;

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

- `createContext` crée un objet contexte, qui servira de **clé** pour fournir et lire la valeur
- `AuthContextType` : le type de ce que retourne `useAuth` (`token`, `user`, `login`, `logout`)
  - `typeof useAuth` : le type de la fonction
  - `ReturnType<...>` : type utilitaire de TypeScript, qui extrait le type de retour d'une fonction
- `undefined` : valeur par défaut, lue seulement par un composant **sans** fournisseur au-dessus de lui

---

# 2. Fournir une valeur
##

Le contexte ne **stocke** rien : il transmet. La valeur vient d'un composant fournisseur, qui appelle `useAuth`.

```tsx
// contexts/AuthProvider.tsx
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import { useAuth } from "../hooks/useAuth";

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth(); // l'unique appel de useAuth de toute l'application

  return <AuthContext value={auth}>{children}</AuthContext>;
};

export default AuthProvider;
```

- `<AuthContext value={...}>` : tous les descendants (`children`) peuvent lire `value`
- Le hook partage la **logique**, le contexte partage l'**état** : un seul appel de `useAuth`, un seul état de session, lu par tous

---

# 3. Lire le contexte

```ts
// hooks/useAuthContext.ts
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext doit être utilisé dans un AuthProvider");
  }
  return context; // AuthContextType : plus de undefined
};
```

```tsx
// Plus aucune prop : UserMenu lit la session lui-même
const UserMenu = () => {
  const { token, user, logout } = useAuthContext();

  if (!token) return <Button component={NavLink} to="/login" color="inherit">Connexion</Button>;
  return <Button onClick={logout} color="inherit">Déconnexion {user?.firstName}</Button>;
};
```

- `useContext(AuthContext)` : valeur du fournisseur le plus proche
- `useAuthContext` est un hook personnalisé : il vérifie l'absence de fournisseur une fois pour toutes

---

# 4. Placer le fournisseur

Le fournisseur doit se trouver **au-dessus** de tous les composants qui lisent le contexte, y compris `App` si `App` l'utilise :

```tsx
// main.tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
```

```tsx
// App.tsx
const App = () => {
  const { token } = useAuthContext();
  const { recipes, addRecipe, deleteRecipe } = useRecipes(token);
  // ...
};
```

- `useAuth` n'est plus appelé que dans `AuthProvider` : un deuxième appel créerait une deuxième session, indépendante

---

# Avant / après

```tsx
// Avant (séance 23) : la session descend en props
<Route path="/" element={<Layout user={auth.user} isLoggedIn={isLoggedIn} onLogout={auth.logout} />}>
  <Route path="login" element={<LoginPage onLogin={auth.login} />} />
  <Route path="recipes/new" element={<AddRecipePage isLoggedIn={isLoggedIn} onAdd={addRecipe} />} />
</Route>

// Après : chaque composant lit le contexte
<Route path="/" element={<Layout />}>
  <Route path="login" element={<LoginPage />} />
  <Route path="recipes/new" element={<AddRecipePage onAdd={addRecipe} />} />
</Route>
```

```tsx
const AddRecipePage = ({ onAdd }: AddRecipePageProps) => {
  const { token } = useAuthContext();
  const navigate = useNavigate();

  if (!token) return <Navigate to="/login" replace />;
  // ... identique à la séance 23
};
```

Les routes sont plus courtes, mais on ne voit plus dans le JSX **d'où** viennent les données de chaque composant.

---

# Pourquoi trois fichiers ?

```
src/
├── contexts/
│   ├── AuthContext.ts       # createContext + type (pas de composant)
│   └── AuthProvider.tsx     # composant fournisseur (uniquement un composant)
└── hooks/
    ├── useAuth.ts           # logique de session (séance 23, inchangé)
    └── useAuthContext.ts    # lecture du contexte
```

- Le rechargement à chaud de Vite (*Fast Refresh*) ne fonctionne correctement que si un fichier `.tsx` n'exporte **que des composants**
- Le linter le signale avec la règle `only-export-components` (séance 19)
- Séparer contexte, fournisseur et hook respecte cette règle et rend chaque fichier simple

---

# Vous utilisez déjà des contextes

- `ThemeProvider` (séance 09) est un fournisseur de contexte : il fournit le thème MUI à tous les composants MUI en dessous de lui
- `BrowserRouter` (séance 15) aussi : il fournit l'URL actuelle et la fonction de navigation
- `useNavigate`, `useParams`, `useLocation` (séance 16) lisent ce contexte

C'est pourquoi les hooks de React Router ne fonctionnent que dans un composant affiché **à l'intérieur** de `BrowserRouter` : sans fournisseur au-dessus, il n'y a rien à lire.

---

# Context ou props ?
##

Le Context n'est pas une solution universelle :

- **Props** : le choix par défaut ; le flux de données est explicite et le composant reste réutilisable
- **Context** : donnée utilisée à de nombreux endroits, éloignés dans l'arbre (utilisateur, thème, langue)

Coûts du Context :

- Tous les consommateurs sont réaffichés quand la valeur change
- Un composant qui lit un contexte ne fonctionne que sous le fournisseur correspondant
- On ne voit plus dans les props d'où vient une donnée

Un contexte par **sujet** (authentification, thème…) plutôt qu'un contexte global contenant tout l'état de l'application.

---

# Récapitulatif

- **Prop drilling** — Props transmises par des composants qui ne les utilisent pas
- **Context** — Valeur fournie à tout un sous-arbre de composants
- **createContext** — Crée le contexte, typé avec la forme de la valeur partagée
- **Fournisseur** — `<AuthContext value={...}>` autour des consommateurs ; la valeur vient d'un hook ou d'un état
- **useContext** — Lit la valeur du fournisseur le plus proche au-dessus
- **Hook de lecture** — `useAuthContext()` vérifie la présence du fournisseur
- **Placement** — Au-dessus de tous les consommateurs, dans `main.tsx` si `App` en fait partie
- **Organisation** — Contexte, fournisseur et hook dans des fichiers séparés (Fast Refresh)
- **Choix** — Props par défaut, Context pour les données utilisées partout

---

# Exercice : MiamMiam avec un Context

À partir de MiamMiam à la fin de la séance 23 ou 24 :

1. Créez `AuthContext`, `AuthProvider` et `useAuthContext` ; `AuthProvider` est le seul composant qui appelle `useAuth`
2. Placez `AuthProvider` dans `main.tsx`, autour d'`App`
3. Supprimez les props d'authentification de `Layout`, `LoginPage`, `AddRecipePage` et `RecipeDetailPage` : chacun lit le contexte
4. Vérifiez que tout fonctionne comme avant : connexion, session conservée au rechargement, page d'ajout protégée, déconnexion
5. Comparez les deux versions : quels fichiers sont plus simples ? Lesquels sont plus difficiles à comprendre ?

---

# Exercice complémentaire

1. Créez un projet `EC-Context` avec Vite + React + TypeScript et installez MUI
2. **Thème** : un contexte `ColorModeContext` partage le mode (`"light"` ou `"dark"`) et une fonction `toggleColorMode`
   - Le fournisseur crée le thème MUI avec `createTheme({ palette: { mode } })` et entoure ses enfants d'un `ThemeProvider`
   - Un bouton dans une `AppBar`, dans un composant séparé, bascule le mode
3. **Langue** : un contexte `LanguageContext` partage la langue (`"fr"` ou `"en"`), une fonction pour la changer et une fonction `t(clé)` qui retourne le texte traduit
   - Les traductions sont un objet `{ fr: { welcome: "Bienvenue" }, en: { welcome: "Welcome" } }`
   - Un sélecteur de langue dans l'`AppBar` ; au moins trois composants différents affichent des textes traduits
4. Chaque contexte suit l'organisation en trois fichiers de la séance
