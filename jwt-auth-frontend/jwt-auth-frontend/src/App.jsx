import { useEffect, useState } from "react";

const TOKEN_KEY = "jwt_token";
const USER_KEY = "jwt_user";

function apiRequest(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(path, {
    ...options,
    headers
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.error || "Request failed");
      error.status = response.status;
      throw error;
    }

    return data;
  });
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

function App() {
  const [user, setUser] = useState(getStoredUser);
  const [page, setPage] = useState(user ? "dashboard" : "login");

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setPage("login");
  };

  const handleAuthenticated = (authUser) => {
    setUser(authUser);
    setPage("dashboard");
  };

  if (!user) {
    return (
      <AuthPage
        page={page}
        setPage={setPage}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  return (
    <Dashboard
      user={user}
      page={page}
      setPage={setPage}
      onLogout={logout}
    />
  );
}

function AuthPage({ page, setPage, onAuthenticated }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = page === "register";

  const updateField = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isRegister) {
        const response = await apiRequest("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            username: form.username,
            email: form.email,
            password: form.password
          })
        });

        setMessage(
          `Registration successful for ${response.username}. You can now log in.`
        );
        setPage("login");
        setForm({ username: form.username, email: "", password: "" });
      } else {
        const response = await apiRequest("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            username: form.username,
            password: form.password
          })
        });

        localStorage.setItem(TOKEN_KEY, response.token);

        const authUser = {
          username: response.username,
          role: response.role
        };

        localStorage.setItem(USER_KEY, JSON.stringify(authUser));
        onAuthenticated(authUser);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <div className="brand">
          <span className="brand-mark">JWT</span>
          <div>
            <h1>Auth Demo</h1>
            <p>React + Spring Boot</p>
          </div>
        </div>

        <div className="auth-heading">
          <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>
          <p>
            {isRegister
              ? "Register with the Spring Boot API."
              : "Sign in to receive your JWT access token."}
          </p>
        </div>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <form onSubmit={submit}>
          <label>
            Username
            <input
              name="username"
              value={form.username}
              onChange={updateField}
              placeholder="Enter username"
              minLength={3}
              maxLength={20}
              required
            />
          </label>

          {isRegister && (
            <label>
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                placeholder="you@example.com"
                required
              />
            </label>
          )}

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />
          </label>

          <button className="primary-button" disabled={loading}>
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Login"}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <button
            className="link-button"
            onClick={() => {
              setError("");
              setMessage("");
              setPage(isRegister ? "login" : "register");
            }}
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </div>
      </section>
    </main>
  );
}

function Dashboard({ user, page, setPage, onLogout }) {
  return (
    <main className="app-layout">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-mark">JWT</span>
          <strong>Auth Demo</strong>
        </div>

        <div className="nav-actions">
          <button
            className={page === "dashboard" ? "nav-button active" : "nav-button"}
            onClick={() => setPage("dashboard")}
          >
            Profile
          </button>

          {user.role === "ROLE_ADMIN" && (
            <button
              className={page === "admin" ? "nav-button active" : "nav-button"}
              onClick={() => setPage("admin")}
            >
              Admin
            </button>
          )}

          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

      <section className="content">
        {page === "admin" && user.role === "ROLE_ADMIN" ? (
          <AdminDashboard />
        ) : (
          <UserDashboard user={user} />
        )}
      </section>
    </main>
  );
}

function UserDashboard({ user }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/api/user/profile")
      .then(setProfile)
      .catch((err) => {
        setError(err.message);
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          window.location.reload();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-container">
      <div className="hero-card">
        <div>
          <p className="eyebrow">Authenticated</p>
          <h2>Hello, {user.username} 👋</h2>
          <p>Your React frontend is connected to the Spring Boot JWT API.</p>
        </div>
        <div className="role-badge">{user.role}</div>
      </div>

      <div className="grid">
        <section className="panel">
          <h3>JWT Authentication</h3>
          <p>
            Your login response is stored in localStorage and automatically
            sent as a Bearer token for protected API requests.
          </p>
        </section>

        <section className="panel">
          <h3>Protected API response</h3>

          {loading && <p>Loading profile...</p>}
          {error && <div className="alert error">{error}</div>}

          {profile && (
            <div className="profile-data">
              <div>
                <span>Message</span>
                <strong>{profile.message}</strong>
              </div>
              <div>
                <span>Username</span>
                <strong>{profile.username}</strong>
              </div>
              <div>
                <span>Role</span>
                <strong>{profile.role}</strong>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/api/admin/dashboard")
      .then(setResponse)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-container">
      <div className="hero-card">
        <div>
          <p className="eyebrow">Authorization</p>
          <h2>Admin Dashboard</h2>
          <p>
            This page calls an endpoint protected by <code>ROLE_ADMIN</code>.
          </p>
        </div>
        <div className="role-badge admin">ROLE_ADMIN</div>
      </div>

      <section className="panel">
        <h3>Admin API response</h3>
        {loading && <p>Loading...</p>}
        {error && <div className="alert error">{error}</div>}
        {response && <pre>{JSON.stringify(response, null, 2)}</pre>}
      </section>
    </div>
  );
}

export default App;