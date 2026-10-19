import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Avatar,
  Alert,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import {
  AutoStoriesOutlined,
  SpaceDashboardOutlined,
  ArticleOutlined,
  PermMediaOutlined,
  FolderOutlined,
  LocalOfferOutlined,
  ChatBubbleOutline,
  PeopleOutline,
  InsightsOutlined,
  SettingsOutlined,
  Logout,
  OpenInNew,
  Menu,
  Search,
  ArrowForward,
  SchoolOutlined,
} from "@mui/icons-material";
import { api } from "./api";
import { AuthContext, useAuth, Loading, initials } from "./common";
import Dashboard from "./pages/Dashboard";
import Content from "./pages/Content";
import Editor from "./pages/Editor";
import Media from "./pages/Media";
import {
  Taxonomy,
  Comments,
  Users,
  Settings,
  Analytics,
} from "./pages/Management";
import { Library, Article } from "./pages/Library";
import "./styles.css";
const theme = createTheme({
  palette: {
    primary: { main: "#176b55", dark: "#10503f", light: "#e7f1ec" },
    secondary: { main: "#c68732" },
    background: { default: "#f7f8fa", paper: "#fff" },
    text: { primary: "#202d36", secondary: "#7b858e" },
    divider: "#edf0f2",
  },
  typography: {
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    h4: { fontSize: "1.85rem", fontWeight: 650, letterSpacing: "-1px" },
    h5: { fontWeight: 650, letterSpacing: "-0.5px" },
    h6: { fontWeight: 650, fontSize: "1rem" },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { padding: "9px 17px", borderRadius: 8 } },
    },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { background: "#fff", fontSize: 14 },
        notchedOutline: { borderColor: "#e1e5e8" },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: "#eef1f3", fontSize: 13, padding: "17px 20px" },
        head: {
          color: "#7b858e",
          fontSize: 11,
          fontWeight: 600,
          background: "#fcfcfd",
        },
      },
    },
    MuiDialogTitle: { styleOverrides: { root: { fontWeight: 650 } } },
  },
});
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const expire = () => {
      sessionStorage.removeItem("educms.token");
      setUser(null);
    };
    window.addEventListener("educms.session-expired", expire);
    if (sessionStorage.getItem("educms.token"))
      api("/auth/me")
        .then(setUser)
        .catch(expire)
        .finally(() => setLoading(false));
    else setLoading(false);
    return () => window.removeEventListener("educms.session-expired", expire);
  }, []);
  const login = async (path, body) => {
    const data = await api(path, { method: "POST", body });
    sessionStorage.setItem("educms.token", data.token);
    setUser(data.user);
    return data.user;
  };
  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      sessionStorage.removeItem("educms.token");
      setUser(null);
    }
  };
  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
function Brand() {
  return (
    <Link className="brand" to="/">
      <span className="brand-icon">
        <AutoStoriesOutlined fontSize="small" />
      </span>
      <span>
        Edu<span className="brand-light">CMS</span>
        <small>THE LEARNING WORKSPACE</small>
      </span>
    </Link>
  );
}
function AuthPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user)
    return (
      <Navigate
        to={user.role === "subscriber" ? "/library" : "/admin"}
        replace
      />
    );
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const current = await login(
        register ? "/auth/register" : "/auth/login",
        data,
      );
      navigate(current.role === "subscriber" ? "/library" : "/admin");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-layout">
      <div className="auth-story">
        <Brand />
        <div>
          <span className="pill">MADE FOR EDUCATION</span>
          <h1>
            Great learning
            <br />
            starts with
            <br />
            <em>great content.</em>
          </h1>
          <p>
            One shared space for the ideas, resources, and people that move
            education forward.
          </p>
          <div className="auth-grid">
            <span>
              <SchoolOutlined /> Built for your institution
            </span>
            <span>
              <ArticleOutlined /> A home for every idea
            </span>
          </div>
        </div>
        <small>EduCMS · A little more organized. A lot more possible.</small>
      </div>
      <div className="auth-form">
        <div className="auth-form-inner">
          <Typography className="eyebrow">YOUR LEARNING WORKSPACE</Typography>
          <Typography variant="h4" sx={{ mt: 1 }}>
            {register ? "Join the community" : "Welcome back."}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
            {register
              ? "Create an account to explore and join the conversation."
              : "Sign in to pick up where you left off."}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={submit}>
            {register && (
              <TextField
                required
                fullWidth
                label="Username"
                name="username"
                inputProps={{
                  pattern: "[a-zA-Z0-9_]{3,50}",
                  minLength: 3,
                  maxLength: 50,
                }}
                sx={{ mb: 2 }}
              />
            )}
            <TextField
              required
              type="email"
              fullWidth
              label="Email address"
              name="email"
              autoComplete="email"
              sx={{ mb: 2.5 }}
            />
            <TextField
              required
              fullWidth
              type="password"
              label="Password"
              name="password"
              autoComplete={register ? "new-password" : "current-password"}
              inputProps={{ minLength: register ? 10 : 1, maxLength: 72 }}
              helperText={register ? "Use at least 10 characters." : null}
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={busy}
              endIcon={<ArrowForward />}
            >
              {busy
                ? "Please wait…"
                : register
                  ? "Create account"
                  : "Sign in to EduCMS"}
            </Button>
          </form>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 3, textAlign: "center" }}
          >
            {register ? "Already have an account?" : "New to EduCMS?"}{" "}
            <Button
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
              size="small"
            >
              {register ? "Sign in" : "Create account"}
            </Button>
          </Typography>
          <Link className="subtle-link" to="/library">
            Explore the public library ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
const navItems = [
  ["Overview", "/admin", SpaceDashboardOutlined],
  ["Content", "/admin/content", ArticleOutlined],
  ["Media library", "/admin/media", PermMediaOutlined],
  ["Categories", "/admin/categories", FolderOutlined, "manage"],
  ["Tags", "/admin/tags", LocalOfferOutlined, "manage"],
  ["Comments", "/admin/comments", ChatBubbleOutline, "manage"],
  ["People", "/admin/users", PeopleOutline, "admin"],
  ["Analytics", "/admin/analytics", InsightsOutlined],
];
function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "subscriber") return <Navigate to="/library" replace />;
  const side = (
    <>
      <Brand />
      <div className="workspace-label">
        YOUR WORKSPACE <span>⌄</span>
      </div>
      <nav>
        {navItems
          .filter(
            ([, , , role]) =>
              !role ||
              (role === "manage"
                ? ["admin", "editor"].includes(user.role)
                : user.role === "admin"),
          )
          .map(([label, path, Icon]) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/admin"}
              onClick={() => setMobile(false)}
            >
              <Icon sx={{ fontSize: 19 }} />
              {label}
            </NavLink>
          ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="workspace-tip">
          <span>ROOM TO GROW</span>
          <strong>
            Knowledge is better
            <br />
            when it’s shared.
          </strong>
          <Link to="/library">
            Visit your library <OpenInNew sx={{ fontSize: 13 }} />
          </Link>
        </div>
        <NavLink to="/admin/settings">
          <SettingsOutlined sx={{ fontSize: 19 }} />
          Settings
        </NavLink>
        <button
          className="logout"
          onClick={async () => {
            try {
              await logout();
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          <Logout sx={{ fontSize: 18 }} />
          Sign out
        </button>
        <div className="sidebar-user">
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: "#ede9de",
              color: "#756b4e",
              fontSize: 12,
            }}
          >
            {initials(user)}
          </Avatar>
          <div>
            <strong>
              {user.first_name || user.username} {user.last_name}
            </strong>
            <small>{user.role}</small>
          </div>
          <span className="online-dot" />
        </div>
      </div>
    </>
  );
  const page =
    navItems.find(
      ([, path]) => path !== "/admin" && location.pathname.startsWith(path),
    )?.[0] ||
    (location.pathname.includes("settings") ? "Settings" : "Overview");
  return (
    <div className="admin-shell">
      <aside className="sidebar">{side}</aside>
      <Drawer
        open={mobile}
        onClose={() => setMobile(false)}
        PaperProps={{ className: "sidebar mobile-sidebar" }}
      >
        {side}
      </Drawer>
      <div className="admin-body">
        <header className="topbar">
          <div className="breadcrumb">
            <IconButton
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </IconButton>
            <span>Workspace</span>
            <span className="crumb-slash">/</span>
            <strong>{page}</strong>
          </div>
          <div className="topbar-actions">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/admin/content?q=${encodeURIComponent(search)}`);
              }}
            >
              <TextField
                placeholder="Search content…"
                aria-label="Search content"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 18, color: "#9ba3aa" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: 230,
                  "& fieldset": { border: 0 },
                  "& input": { py: 1 },
                }}
              />
            </form>
            <Button
              component={Link}
              to="/library"
              color="inherit"
              endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
            >
              View library
            </Button>
            <Avatar
              sx={{
                width: 31,
                height: 31,
                bgcolor: "#ede9de",
                color: "#756b4e",
                fontSize: 11,
              }}
            >
              {initials(user)}
            </Avatar>
          </div>
        </header>
        <main className="main-content">
          {error && <Alert severity="error">{error}</Alert>}
          <Outlet />
        </main>
        <footer className="admin-footer">
          <span>
            © {new Date().getFullYear()} EduCMS. Built for better learning.
          </span>
          <span>
            <span className="online-dot" />
            Your learning workspace
          </span>
        </footer>
      </div>
    </div>
  );
}
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/library" element={<Library />} />
            <Route path="/library/:slug" element={<Article />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="content" element={<Content />} />
              <Route path="content/new" element={<Editor />} />
              <Route path="content/:id" element={<Editor />} />
              <Route path="media" element={<Media />} />
              <Route
                path="categories"
                element={<Taxonomy type="categories" />}
              />
              <Route path="tags" element={<Taxonomy type="tags" />} />
              <Route path="comments" element={<Comments />} />
              <Route path="users" element={<Users />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route
              path="*"
              element={
                <Box sx={{ p: 8 }}>
                  <Typography variant="h4">Page not found</Typography>
                  <Button component={Link} to="/">
                    Go home
                  </Button>
                </Box>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
createRoot(document.getElementById("root")).render(<App />);
