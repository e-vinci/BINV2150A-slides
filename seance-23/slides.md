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
import type { User } from "../models/user";

const API_URL = "/api";

export const login = async (email: string, password: string): Promise<string> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (response.status === 401) throw new Error("Email ou mot de passe incorrect");
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
  const data = await response.json();
  return data.token!;
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

Toute la logique de session est rangée dans un **hook personnalisé** (séance 19) :

```ts
// hooks/useAuth.ts
export const useAuth = () => {
  const [token, setToken] = useState<string | null>(/* ... */);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(/* ... */);
  // ... login, register, logout, restauration de la session
  return { user, token, loading, login, register, logout };
};
```

- `user` : l'utilisateur connecté, tel que le renvoie `GET /auth/me`, ou `null`
- `token` : nécessaire pour les requêtes authentifiées (séance 24)
- `loading` : au démarrage, on ne sait pas encore si l'utilisateur est connecté
- `login` et `register` sont **asynchrones** : la page de connexion attend leur résultat pour naviguer ou afficher une erreur
- Comme `useRecipes`, `useAuth` est appelé **une seule fois**, dans `App` : un seul état de session pour toute l'application

---

# Se connecter

```ts
// hooks/useAuth.ts
const TOKEN_KEY = "miammiam.token";

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => localStorage.getItem(TOKEN_KEY) !== null);

  const login = async (email: string, password: string) => {
    const newToken = await authService.login(email, password); // lève une erreur si refusé
    const me = await authService.getMe(newToken);
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(me);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };
  // ... restauration de la session (slide suivant)
};
```

---

# Restaurer la session au démarrage

Après un rechargement, le token est dans le `localStorage`, mais `user` est `null`. Il faut redemander l'utilisateur au backend : c'est une **synchronisation** au démarrage, donc un effet.

```tsx
useEffect(() => {
  const storedToken = localStorage.getItem(TOKEN_KEY);
  if (!storedToken) return; // loading est déjà false (initialisation du slide précédent)
  let ignore = false;
  authService
    .getMe(storedToken)
    .then((me) => { if (!ignore) setUser(me); })
    .catch(() => {
      if (ignore) return;
      localStorage.removeItem(TOKEN_KEY); // token expiré ou invalide
      setToken(null);
    })
    .finally(() => { if (!ignore) setLoading(false); });
  return () => { ignore = true; };
}, []); // uniquement au démarrage : l'effet ne dépend d'aucune valeur du composant
```

- Le backend vérifie la signature et l'expiration : c'est lui qui décide si la session est encore valide
- `loading` vaut `true` au départ seulement si un token est enregistré : pendant la vérification, on n'affiche pas encore « Connexion »

---

# Brancher useAuth dans App

```tsx
const App = () => {
  const auth = useAuth();
  const { recipes, addRecipe, deleteRecipe } = useRecipes();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout user={auth.user} loading={auth.loading} onLogout={auth.logout} />}>
          <Route index element={<HomePage recipes={recipes} />} />
          <Route path="login" element={<LoginPage onLogin={auth.login} />} />
          <Route path="register" element={<RegisterPage onRegister={auth.register} />} />
          <Route path="recipes/:id"
            element={<RecipeDetailPage recipes={recipes} user={auth.user} onDelete={deleteRecipe} />} />
          {/* recipes/new : route protégée, slide « Protéger des routes » */}
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
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onLogin(form.email, form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  };
  // Formulaire : TextField email et password, Alert si error, bouton désactivé si submitting
};
```

---

# Afficher selon l'utilisateur

```tsx
const Layout = ({ user, loading, onLogout }: LayoutProps) => (
  <>
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>MiamMiam</Typography>
        <Button component={NavLink} to="/" end color="inherit">Recettes</Button>
        {user && <Button component={NavLink} to="/recipes/new" color="inherit">Ajouter</Button>}
        {!loading && <UserMenu user={user} onLogout={onLogout} />}
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

- Masquer un bouton n'est **pas** une sécurité : le backend refuse de toute façon une suppression non autorisée (`403`)

---

# Protéger des routes
##

Certaines pages n'ont de sens que pour un utilisateur connecté. Une **route parente** vérifie la session :

```tsx
import { Navigate, Outlet, useLocation } from "react-router";

interface RequireAuthProps {
  user: User | null;
  loading: boolean;
}

const RequireAuth = ({ user, loading }: RequireAuthProps) => {
  const location = useLocation();

  if (loading) return <CircularProgress />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
};
```

- `Navigate` : composant qui navigue dès qu'il est affiché (équivalent déclaratif de `navigate`)
- `state` : la page de connexion peut ramener l'utilisateur là où il voulait aller après le login

---

# Protéger des routes (suite)

```tsx
<Route path="/" element={<Layout />}>
  <Route index element={<HomePage />} />
  <Route path="login" element={<LoginPage />} />
  <Route element={<RequireAuth user={auth.user} loading={auth.loading} />}>
    <Route path="recipes/new" element={<AddRecipePage />} />
  </Route>
</Route>
```

---

# Expiration du token
##

Le JWT du backend expire. Côté frontend :

- Le frontend peut lire `exp` pour anticiper, mais pas vérifier la signature (il n'a pas la clé secrète)
  - Accéder à la deuxième partie du token
  - La décoder du Base64 avec `atob` 
  - Récupérer `exp` et le comparer à `Date.now() / 1000`
- Le backend répond `401` à toute requête avec un token expiré : c'est la **seule** vérification fiable

  &rarr; Quand le backend répond `401`, le frontend supprime le token et redirige vers la page de connexion

---

# Récapitulatif Séance 23

- **HTTP sans état** — Chaque requête doit prouver l'identité de l'utilisateur
- **Session serveur / token** — Le serveur stocke les sessions, ou le client conserve un token signé
- **API** — `POST /auth/register`, `POST /auth/login` &rarr; `{ token }`, `GET /auth/me` &rarr; utilisateur
- **Stockage du token** — Mémoire, Web Storage (exposé au XSS) ou cookie `HttpOnly`
- **useAuth** — Hook appelé une fois dans `App` : `user`, `token`, `loading`, `login`, `register`, `logout`, transmis en props
- **Connexion** — Token obtenu, utilisateur demandé à `/auth/me`, token enregistré
- **Restauration** — Effet au démarrage, le backend valide le token
- **Affichage selon l'utilisateur** — Confort pour l'utilisateur, pas une sécurité : le backend décide
- **Routes protégées** — Route parente qui affiche `Outlet` ou `Navigate` vers `/login`
- **Expiration** — Le backend répond `401` ; `exp` lisible côté client pour anticiper

**Prochaine séance** : Séance 24 — Fetch avec JWT

---

# Exercice filé S23

1. Créez `models/user.ts` avec l'interface `User` du backend (`id`, `email`, `firstName`, `lastName`, `role`, `favorites`), puis `services/auth.service.ts` avec `login`, `register` et `getMe`, et des messages d'erreur adaptés à chaque statut (400, 401, 409)
2. Créez `hooks/useAuth.ts` (`user`, `token`, `loading`, `login`, `register`, `logout`) ; appelez-le une seule fois, dans `App`
3. Créez les pages `/login` (email et mot de passe) et `/register` ; après succès, retour à la page demandée à l'origine (ou à la liste)
4. Restaurez la session au démarrage de l'application ; testez en rechargeant la page, puis en modifiant le token dans le `localStorage`
5. Dans l'en-tête, affichez le prénom de l'utilisateur et un bouton « Déconnexion », ou un lien « Connexion » ; pendant la restauration de la session, ni l'un ni l'autre
6. Protégez la page d'ajout de recette avec une route `RequireAuth` ; le lien « Ajouter » n'est visible que si un utilisateur est connecté
7. Le bouton « Supprimer » n'est visible que pour l'auteur de la recette ou un administrateur
