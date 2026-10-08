---
theme: default
title: Web 2 - Séance 23 - Session
---

# Web 2 — Séance 23
## Session

---

# HTTP est sans état

Chaque requête HTTP est **indépendante** : le serveur ne se souvient pas des requêtes précédentes.

```
POST /auth/login   { email, password }   → 200 : identifiants corrects
GET  /auth/me                            → le serveur ne sait pas qui vous êtes
```

Une **session** permet au serveur de reconnaître le même utilisateur d'une requête à l'autre.

Le principe est toujours le même :

1. Le client prouve son identité une fois (email + mot de passe)
2. Le serveur lui remet une **preuve** (un identifiant de session ou un token)
3. Le client joint cette preuve à **chaque** requête suivante

---

# Deux façons de gérer une session
##

**Session côté serveur** (sessions « classiques ») :

- Le serveur stocke les sessions actives (en mémoire, en base de données)
- Le client reçoit un identifiant aléatoire, dans un **cookie**
- À chaque requête, le serveur retrouve la session à partir de l'identifiant
- Se déconnecter = le serveur supprime la session

**Token signé** (sessions modernes, JWT) :

- Le serveur ne stocke **rien** : le token contient l'identité et une date d'expiration, et il est signé
- À chaque requête, le serveur vérifie la signature et l'expiration
- Le client est responsable de **conserver** le token et de l'envoyer
- Se déconnecter = le client oublie le token (qui reste valable jusqu'à son expiration)

---

# L'API d'authentification du backend

| Requête | Corps | Réponse |
|---|---|---|
| `POST /auth/register` | `{ email, password, firstName, lastName }` | `201 { token }`, `409` si l'email existe, `400` si invalide |
| `POST /auth/login` | `{ email, password }` | `200 { token }`, `401` si identifiants incorrects |
| `GET /auth/me` | — (token dans `Authorization`) | `200` utilisateur, `401` si token absent ou invalide |

- Le token est envoyé tel quel dans l'en-tête `Authorization`
- `login` ne renvoie que le token : `GET /auth/me` fournit les informations de l'utilisateur connecté
- Avec le proxy de la séance 22, ces routes sont accessibles sous `/api/auth/...`

---

# Le service d'authentification

```ts
// services/auth.service.ts
export const login = async (email: string, password: string): Promise<string> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (response.status === 401) throw new Error("Email ou mot de passe incorrect");
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
  const data = await response.json();
  return data.token as string;
};

export const getMe = async (token: string): Promise<User> => {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: token },
  });
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
  const data = await response.json();
  return data as User;
};
```

Chaque statut d'erreur attendu reçoit un **message compréhensible** pour l'utilisateur.

---

# Où conserver le token ?

| Emplacement | Survit au rechargement |
|---|---|
| État React (mémoire) | Non |
| `sessionStorage` | Oui, dans l'onglet | 
| `localStorage` | Oui, partout | 
| Cookie `HttpOnly` | Oui, envoyé automatiquement |

Choix du cours : `localStorage`, simple et compatible avec l'en-tête `Authorization` du backend.

---

# Le hook useAuth
##

Toute la session est rangée dans un **hook personnalisé** (séance 19), appelé une seule fois dans `App`.

```ts
// hooks/useAuth.ts
const TOKEN_KEY = "miammiam.token";

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const newToken = await authService.login(email, password); // lève une erreur si refusé
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  // ... chargement de l'utilisateur (slide suivant)
  return { token, user, login, logout };
};
```

---

# Charger l'utilisateur
##

Le token ne contient pas le prénom de l'utilisateur : il faut le demander à `GET /auth/me`, chaque fois que le token change.

```ts
// hooks/useAuth.ts (suite)
useEffect(() => {
  if (!token) return; // personne n'est connecté
  authService
    .getMe(token)
    .then((me) => setUser(me))
    .catch(() => {
      // token expiré ou invalide : on déconnecte
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    });
}, [token]);
```

- **Au démarrage**, si un token est enregistré : l'utilisateur est chargé s'il est valide, ou il est supprimé
- **Après `login`**, quand `token` change : l'utilisateur est chargé

C'est le backend qui décide si le token est encore valide (signature, expiration). Ensuite, l'application **suppose** qu'il le reste pendant toute la visite : ce n'est pas parfait (un token peut expirer pendant l'utilisation), mais c'est suffisant ici.

---

# Brancher useAuth dans App

```tsx
const App = () => {
  const auth = useAuth();
  const { recipes, addRecipe, deleteRecipe } = useRecipes();
  const isLoggedIn = auth.token !== null; // valeur dérivée (séance 11)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout user={auth.user} isLoggedIn={isLoggedIn} onLogout={auth.logout} />}>
          <Route index element={<HomePage recipes={recipes} />} />
          <Route path="login" element={<LoginPage onLogin={auth.login} />} />
          <Route path="register" element={<RegisterPage onRegister={auth.register} />} />
          <Route path="recipes/new" element={<AddRecipePage isLoggedIn={isLoggedIn} onAdd={addRecipe} />} />
          <Route path="recipes/:id"
            element={<RecipeDetailPage recipes={recipes} user={auth.user} onDelete={deleteRecipe} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
```

- Chaque page reçoit **uniquement** ce dont elle a besoin : `LoginPage` ne connaît que `login`
- Deux appels de `useAuth` créeraient deux sessions indépendantes (séance 19)

---

# Page de connexion

```tsx
interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>; // auth.login, passé par App
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await onLogin(form.email, form.password);
      navigate("/"); // retour à la liste des recettes
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  };
  // Formulaire : TextField email et password (séance 12), Alert si error
};
```

- Un handler d'événement peut être `async`, contrairement à la fonction d'un effet
- Le message d'erreur vient du service : « Email ou mot de passe incorrect » pour un `401`

---

# Afficher selon l'utilisateur

```tsx
const Layout = ({ user, isLoggedIn, onLogout }: LayoutProps) => (
  <>
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>MiamMiam</Typography>
        <Button component={NavLink} to="/" end color="inherit">Recettes</Button>
        {isLoggedIn && <Button component={NavLink} to="/recipes/new" color="inherit">Ajouter</Button>}
        {isLoggedIn
          ? <Button onClick={onLogout} color="inherit">Déconnexion {user?.firstName}</Button>
          : <Button component={NavLink} to="/login" color="inherit">Connexion</Button>}
      </Toolbar>
    </AppBar>
    <Container><Outlet /></Container>
  </>
);
```

```tsx
// Dans la page de détail : seul l'auteur ou un administrateur peut supprimer, comme dans le backend
const canDelete = user !== null && (user.id === recipe.authorId || user.role === "admin");
{canDelete && <Button color="error" onClick={handleDelete}>Supprimer</Button>}
```

- `user?.firstName` : `user` peut être `null` le temps que la réponse de `/auth/me` arrive
- Masquer un bouton n'est **pas** une sécurité : le backend effectue aussi la vérification

---

# Protéger une page
##

La page d'ajout n'a de sens que pour un utilisateur connecté : sinon, on le renvoie vers `/login`.

```tsx
import { Navigate, useNavigate } from "react-router";

const AddRecipePage = ({ isLoggedIn, onAdd }: AddRecipePageProps) => {
  const navigate = useNavigate();

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const handleAdd = (newRecipe: NewRecipe) => {
    const id = onAdd(newRecipe);
    navigate(`/recipes/${id}`);
  };
  return <RecipeForm onAdd={handleAdd} />;
};
```

- `navigate()` : fonction qui navigue quand elle est appelée &rarr; ne peut pas être appelé pendant le rendu
- `Navigate` : composant qui navigue dès qu'il est affiché
- `replace` : `/recipes/new` ne reste pas dans l'historique

---

# Récapitulatif Séance 23

- **HTTP sans état** — Chaque requête doit prouver l'identité de l'utilisateur
- **Session serveur / token** — Le serveur stocke les sessions, ou le client conserve un token signé
- **API** — `POST /auth/register`, `POST /auth/login` &rarr; `{ token }`, `GET /auth/me` &rarr; utilisateur
- **Stockage du token** — Mémoire, Web Storage ou cookie `HttpOnly` ; choix du cours : `localStorage`
- **useAuth** — Hook appelé une fois dans `App` : `token`, `user`, `login`, `logout`
- **Connecté** — Un token est enregistré ; `isLoggedIn` est une valeur dérivée
- **Chargement de l'utilisateur** — Effet qui dépend du token ; token invalide &rarr; déconnexion
- **Affichage selon l'utilisateur** — Confort pour l'utilisateur, pas une sécurité : le backend décide
- **Page protégée** — `Navigate` vers `/login` si personne n'est connecté

**Prochaine séance** : Séance 24 — Fetch avec JWT

---

# Exercice filé S23

1. Créez `models/user.ts` avec l'interface `User` du backend (`id`, `email`, `firstName`, `lastName`, `role`, `favorites`), puis `services/auth.service.ts` avec `login`, `register` et `getMe`, et des messages d'erreur adaptés à chaque statut (400, 401, 409)
2. Créez `hooks/useAuth.ts` (`token`, `user`, `login`, `register`, `logout`) ; appelez-le une seule fois, dans `App`
3. Créez les pages `/login` (email et mot de passe) et `/register` ; après succès, retour à la liste des recettes
4. Rechargez la page : vous devez rester connecté ; modifiez ensuite le token dans le `localStorage` et rechargez : vous devez être déconnecté
5. Dans l'en-tête, affichez le prénom de l'utilisateur et un bouton « Déconnexion », ou un lien « Connexion » ; le lien « Ajouter » n'est visible que si un utilisateur est connecté
6. La page d'ajout redirige vers `/login` si personne n'est connecté
7. Le bouton « Supprimer » n'est visible que pour l'auteur de la recette ou un administrateur
