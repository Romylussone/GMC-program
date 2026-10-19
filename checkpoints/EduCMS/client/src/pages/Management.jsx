import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  DeleteOutline,
  EditOutlined,
  Check,
  Close,
} from "@mui/icons-material";
import { api } from "../api";
import {
  useAuth,
  useLoad,
  Loading,
  ErrorMessage,
  PageTitle,
  Empty,
  Confirm,
  Status,
  date,
  number,
} from "../common";
import { StatCards, ViewsChart } from "./Dashboard";
export function Taxonomy({ type }) {
  const category = type === "categories";
  const key = category ? "category_id" : "tag_id";
  const [version, setVersion] = useState(0);
  const state = useLoad(`/${type}`, version);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  if (!["admin", "editor"].includes(user.role))
    return (
      <Alert severity="info">Categories and tags are managed by editors.</Alert>
    );
  const noun = category ? "category" : "tag";
  return (
    <>
      <PageTitle
        title={category ? "Categories" : "Tags"}
        description={
          category
            ? "Create a clear structure for every learning journey."
            : "Connect related ideas and make resources easier to discover."
        }
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setError("");
              setEditing({
                name: "",
                slug: "",
                description: "",
                parent_id: "",
                display_order: 0,
                is_active: true,
              });
            }}
          >
            Add {noun}
          </Button>
        }
      />
      <ErrorMessage error={state.error || error} />
      <section className="panel">
        {state.loading ? (
          <Loading />
        ) : state.data?.length ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>NAME</TableCell>
                  <TableCell>SLUG</TableCell>
                  {category && <TableCell>PARENT</TableCell>}
                  <TableCell>PUBLISHED CONTENT</TableCell>
                  {category && <TableCell>STATUS</TableCell>}
                  <TableCell align="right">ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.data.map((item) => (
                  <TableRow key={item[key]}>
                    <TableCell>
                      <strong>{item.name}</strong>
                      <Typography
                        color="text.secondary"
                        variant="caption"
                        display="block"
                      >
                        {item.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.slug}</TableCell>
                    {category && (
                      <TableCell>
                        {state.data.find(
                          (c) => c.category_id === item.parent_id,
                        )?.name || "—"}
                      </TableCell>
                    )}
                    <TableCell>{item.post_count}</TableCell>
                    {category && (
                      <TableCell>
                        <Status
                          value={item.is_active ? "active" : "archived"}
                        />
                      </TableCell>
                    )}
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        aria-label={`Edit ${item.name}`}
                        onClick={() => {
                          setError("");
                          setEditing({
                            ...item,
                            parent_id: item.parent_id || "",
                          });
                        }}
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label={`Delete ${item.name}`}
                        onClick={() => setRemoving(item)}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Empty
            title={`Add your first ${noun}`}
            description="A little organization makes a big difference."
          />
        )}
      </section>
      <Dialog
        open={!!editing}
        onClose={() => !busy && setEditing(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editing?.[key] ? "Edit" : "Add"} {noun}
        </DialogTitle>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const body = { ...editing };
            if (!body.slug) delete body.slug;
            if (category) body.parent_id = body.parent_id || null;
            try {
              await api(`/${type}${editing[key] ? `/${editing[key]}` : ""}`, {
                method: editing[key] ? "PUT" : "POST",
                body,
              });
              setEditing(null);
              setVersion((v) => v + 1);
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <DialogContent className="dialog-form">
            <ErrorMessage error={error} />
            <TextField
              required
              label="Name"
              value={editing?.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              inputProps={{ maxLength: category ? 100 : 50 }}
            />
            <TextField
              label="Slug"
              value={editing?.slug || ""}
              onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              helperText="Generated from the name when left blank."
              inputProps={{
                pattern: "[a-z0-9]+(-[a-z0-9]+)*",
                maxLength: category ? 100 : 50,
              }}
            />
            <TextField
              multiline
              minRows={3}
              label="Description"
              value={editing?.description || ""}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
              inputProps={{ maxLength: 2000 }}
            />
            {category && (
              <>
                <TextField
                  select
                  label="Parent category"
                  value={editing?.parent_id || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, parent_id: e.target.value })
                  }
                >
                  <MenuItem value="">No parent</MenuItem>
                  {state.data
                    ?.filter((c) => c.category_id !== editing?.category_id)
                    .map((c) => (
                      <MenuItem key={c.category_id} value={c.category_id}>
                        {c.name}
                      </MenuItem>
                    ))}
                </TextField>
                <TextField
                  label="Display order"
                  type="number"
                  value={editing?.display_order || 0}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      display_order: Number(e.target.value),
                    })
                  }
                  inputProps={{ min: 0, max: 10000 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editing?.is_active ?? true}
                      onChange={(e) =>
                        setEditing({ ...editing, is_active: e.target.checked })
                      }
                    />
                  }
                  label="Active category"
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={busy}>
              Save {noun}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Confirm
        open={!!removing}
        title={`Delete ${removing?.name}?`}
        description={
          category
            ? "Posts will become uncategorized and child categories will become top-level categories."
            : "This tag will be removed from all posts."
        }
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          await api(`/${type}/${removing[key]}`, { method: "DELETE" });
          setVersion((v) => v + 1);
        }}
      />
    </>
  );
}
export function Comments() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("pending");
  const [version, setVersion] = useState(0);
  const state = useLoad(
    `/comments?page=${page}&limit=10${status ? `&status=${status}` : ""}`,
    version,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(null);
  if (!["admin", "editor"].includes(user.role))
    return (
      <Alert severity="info">Comment moderation is available to editors.</Alert>
    );
  const moderate = async (id, value) => {
    setBusy(true);
    setError("");
    try {
      await api(`/comments/${id}/status`, {
        method: "PATCH",
        body: { status: value },
      });
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageTitle
        title="Comments"
        description="Keep your learning community constructive and welcoming."
      />
      <div className="filter-bar">
        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          sx={{ width: 200 }}
        >
          <MenuItem value="">All comments</MenuItem>
          {["pending", "approved", "spam", "trash"].map((s) => (
            <MenuItem key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </MenuItem>
          ))}
        </TextField>
      </div>
      <ErrorMessage error={error || state.error} />
      <section className="panel">
        {state.loading ? (
          <Loading />
        ) : state.data?.items.length ? (
          <>
            {state.data.items.map((c) => (
              <div className="comment-review" key={c.comment_id}>
                <div className="comment-meta">
                  <strong>{c.first_name || c.username || "Former user"}</strong>
                  <span>on {c.post_title}</span>
                  <Status value={c.status} />
                </div>
                <p>{c.content}</p>
                <div className="comment-actions">
                  <small>{date(c.created_at)}</small>
                  <Button
                    size="small"
                    startIcon={<Check />}
                    disabled={busy || c.status === "approved"}
                    onClick={() => moderate(c.comment_id, "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    color="warning"
                    disabled={busy || c.status === "spam"}
                    onClick={() => moderate(c.comment_id, "spam")}
                  >
                    Mark as spam
                  </Button>
                  <Button
                    size="small"
                    color="inherit"
                    disabled={busy || c.status === "trash"}
                    onClick={() => moderate(c.comment_id, "trash")}
                  >
                    Move to trash
                  </Button>
                  <IconButton
                    size="small"
                    aria-label="Permanently delete comment"
                    onClick={() => setRemoving(c)}
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </div>
              </div>
            ))}
            <Pagination
              sx={{ p: 3 }}
              count={Math.max(1, state.data.pagination.totalPages)}
              page={page}
              onChange={(_, p) => setPage(p)}
            />
          </>
        ) : (
          <Empty
            title="You’re all caught up"
            description="Comments matching this status will appear here."
          />
        )}
      </section>
      <Confirm
        open={!!removing}
        title="Delete this comment permanently?"
        description="Replies to this comment will also be removed."
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          await api(`/comments/${removing.comment_id}`, { method: "DELETE" });
          setVersion((v) => v + 1);
        }}
      />
    </>
  );
}
export function Users() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  const [page, setPage] = useState(1);
  const state = useLoad(`/users?page=${page}&limit=10`, version);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user.role !== "admin")
    return (
      <Alert severity="info">Only administrators can manage people.</Alert>
    );
  return (
    <>
      <PageTitle
        title="People"
        description="The people behind your institution’s knowledge."
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setError("");
              setEditing({
                username: "",
                email: "",
                password: "",
                first_name: "",
                last_name: "",
                role: "subscriber",
                is_active: true,
              });
            }}
          >
            Add person
          </Button>
        }
      />
      <ErrorMessage error={state.error} />
      <section className="panel">
        {state.loading ? (
          <Loading />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>PERSON</TableCell>
                    <TableCell>ROLE</TableCell>
                    <TableCell>STATUS</TableCell>
                    <TableCell>JOINED</TableCell>
                    <TableCell align="right">ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {state.data?.items.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <strong>
                          {u.first_name || u.username} {u.last_name}
                        </strong>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {u.email}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        {u.role}
                      </TableCell>
                      <TableCell>
                        <Status value={u.is_active ? "active" : "archived"} />
                      </TableCell>
                      <TableCell>{date(u.created_at)}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          aria-label={`Edit ${u.username}`}
                          disabled={u.user_id === user.user_id}
                          onClick={() => {
                            setEditing(u);
                            setError("");
                          }}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label={`Delete ${u.username}`}
                          disabled={u.user_id === user.user_id}
                          onClick={() => setRemoving(u)}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Pagination
              sx={{ p: 3 }}
              count={Math.max(1, state.data?.pagination.totalPages || 1)}
              page={page}
              onChange={(_, p) => setPage(p)}
            />
          </>
        )}
      </section>
      <Dialog
        open={!!editing}
        onClose={() => !busy && setEditing(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editing?.user_id ? "Edit access" : "Add person"}
        </DialogTitle>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await api(
                editing.user_id ? `/users/${editing.user_id}` : "/users",
                { method: editing.user_id ? "PATCH" : "POST", body: editing },
              );
              setEditing(null);
              setVersion((v) => v + 1);
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <DialogContent className="dialog-form">
            <ErrorMessage error={error} />
            {!editing?.user_id && (
              <>
                <TextField
                  required
                  label="Username"
                  value={editing?.username || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, username: e.target.value })
                  }
                  inputProps={{ pattern: "[a-zA-Z0-9_]{3,50}" }}
                />
                <TextField
                  required
                  type="email"
                  label="Email"
                  value={editing?.email || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, email: e.target.value })
                  }
                />
                <TextField
                  required
                  type="password"
                  label="Initial password"
                  value={editing?.password || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, password: e.target.value })
                  }
                  inputProps={{ minLength: 10, maxLength: 72 }}
                  helperText="Share securely and ask the person to change it after signing in."
                />
                <TextField
                  label="First name"
                  value={editing?.first_name || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, first_name: e.target.value })
                  }
                />
                <TextField
                  label="Last name"
                  value={editing?.last_name || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, last_name: e.target.value })
                  }
                />
              </>
            )}
            <TextField
              select
              label="Role"
              value={editing?.role || "subscriber"}
              onChange={(e) => setEditing({ ...editing, role: e.target.value })}
            >
              {["admin", "editor", "author", "subscriber"].map((r) => (
                <MenuItem key={r} value={r}>
                  {r[0].toUpperCase() + r.slice(1)}
                </MenuItem>
              ))}
            </TextField>
            {editing?.user_id && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editing?.is_active || false}
                    onChange={(e) =>
                      setEditing({ ...editing, is_active: e.target.checked })
                    }
                  />
                }
                label="Active account"
              />
            )}
            <Typography variant="caption" color="text.secondary">
              Changing access revokes this person’s existing sessions.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={busy}>
              Save person
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Confirm
        open={!!removing}
        title={`Delete ${removing?.username}?`}
        description="The account will be removed permanently. Their content remains attributed to a former user."
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          await api(`/users/${removing.user_id}`, { method: "DELETE" });
          setVersion((v) => v + 1);
        }}
      />
    </>
  );
}
export function Settings() {
  const { user, setUser, logout } = useAuth();
  const [profile, setProfile] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    bio: user.bio || "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <PageTitle
        title="Your settings"
        description="A few details to make this workspace feel like yours."
      />
      <ErrorMessage error={error} />
      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      <div className="settings-grid">
        <form
          className="panel form-panel"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              setUser(
                await api("/users/me", { method: "PATCH", body: profile }),
              );
              setMessage("Profile updated.");
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Typography variant="h6">Profile details</Typography>
          {["first_name", "last_name", "bio"].map((field) => (
            <TextField
              key={field}
              label={field
                .replace("_", " ")
                .replace(/^./, (c) => c.toUpperCase())}
              value={profile[field]}
              onChange={(e) =>
                setProfile({ ...profile, [field]: e.target.value })
              }
              multiline={field === "bio"}
              minRows={field === "bio" ? 4 : undefined}
              inputProps={{ maxLength: field === "bio" ? 2000 : 50 }}
            />
          ))}
          <TextField label="Email" value={user.email} disabled />
          <Button variant="contained" type="submit" disabled={busy}>
            Save profile
          </Button>
        </form>
        <form
          className="panel form-panel"
          onSubmit={async (e) => {
            e.preventDefault();
            const body = Object.fromEntries(new FormData(e.currentTarget));
            setBusy(true);
            setError("");
            try {
              await api("/auth/password", { method: "PATCH", body });
              await logout();
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Typography variant="h6">Change password</Typography>
          <Typography variant="body2" color="text.secondary">
            Updating your password signs you out of all sessions.
          </Typography>
          <TextField
            required
            label="Current password"
            type="password"
            name="current_password"
            autoComplete="current-password"
            inputProps={{ maxLength: 72 }}
          />
          <TextField
            required
            label="New password"
            type="password"
            name="password"
            autoComplete="new-password"
            inputProps={{ minLength: 10, maxLength: 72 }}
            helperText="At least 10 characters."
          />
          <Button type="submit" variant="outlined" disabled={busy}>
            Update password
          </Button>
        </form>
      </div>
    </>
  );
}
export function Analytics() {
  const state = useLoad("/analytics");
  const activity = useLoad("/analytics/activity?limit=20");
  if (state.loading) return <Loading />;
  if (state.error) return <ErrorMessage error={state.error} />;
  const data = state.data;
  return (
    <>
      <PageTitle
        eyebrow="KNOW WHAT MAKES AN IMPACT"
        title="Analytics"
        description={
          data.scope === "own"
            ? "Explore engagement with your educational content."
            : "A closer look at your institution’s content and readership."
        }
      />
      <StatCards data={data} />
      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-heading">
          <div>
            <h3>Content views</h3>
            <p>Daily views over the last 30 days</p>
          </div>
        </div>
        <ViewsChart data={data.daily_views} />
      </section>
      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-heading">
          <h3>Most read content</h3>
        </div>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>TITLE</TableCell>
                <TableCell>STATUS</TableCell>
                <TableCell>VIEWS</TableCell>
                <TableCell>LIKES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.top_posts.map((p) => (
                <TableRow key={p.post_id}>
                  <TableCell>{p.title}</TableCell>
                  <TableCell>
                    <Status value={p.status} />
                  </TableCell>
                  <TableCell>{number(p.view_count)}</TableCell>
                  <TableCell>{number(p.like_count)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h3>Recent activity</h3>
        </div>
        <ErrorMessage error={activity.error} />
        {activity.data?.items.length ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>PERSON</TableCell>
                  <TableCell>ACTION</TableCell>
                  <TableCell>DETAILS</TableCell>
                  <TableCell>DATE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activity.data.items.map((a) => (
                  <TableRow key={a.log_id}>
                    <TableCell>{a.username || "Former user"}</TableCell>
                    <TableCell>
                      {a.action} {a.entity_type}
                    </TableCell>
                    <TableCell>{a.description || "—"}</TableCell>
                    <TableCell>{date(a.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Empty
            title="Your story is just beginning"
            description="Workspace activity will appear here."
          />
        )}
      </section>
    </>
  );
}
