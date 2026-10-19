import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBack,
  History,
  SaveOutlined,
  OpenInNew,
} from "@mui/icons-material";
import { api } from "../api";
import {
  useAuth,
  useLoad,
  Loading,
  ErrorMessage,
  PageTitle,
  date,
} from "../common";
const blank = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  status: "draft",
  content_type: "article",
  category_id: "",
  tag_ids: [],
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  featured_image: "",
  is_featured: false,
  allow_comments: true,
};
export default function Editor() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [versions, setVersions] = useState(null);
  const [dirty, setDirty] = useState(false);
  const categories = useLoad("/categories");
  const tags = useLoad("/tags");
  const media = useLoad("/media?limit=100");
  useEffect(() => {
    let active = true;
    if (id) {
      setLoading(true);
      api(`/posts/${id}`)
        .then((post) => {
          if (active) {
            setForm({
              ...blank,
              ...post,
              category_id: post.category_id || "",
              featured_image: post.featured_image || "",
              tag_ids: post.tags.map((t) => t.tag_id),
            });
            setDirty(false);
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      setForm(blank);
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [id]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const change = (field) => (e) => {
    setForm((f) => ({
      ...f,
      [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
    setDirty(true);
    setMessage("");
  };
  const editable =
    user.role !== "author" ||
    !id ||
    (form.author_id === user.user_id && form.status === "draft");
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const body = { ...form, category_id: form.category_id || null };
    if (!body.slug) delete body.slug;
    try {
      const post = await api(id ? `/posts/${id}` : "/posts", {
        method: id ? "PUT" : "POST",
        body,
      });
      setForm((f) => ({
        ...f,
        ...post,
        category_id: post.category_id || "",
        featured_image: post.featured_image || "",
      }));
      setDirty(false);
      setMessage("Your content has been saved.");
      if (!id) navigate(`/admin/content/${post.post_id}`, { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (loading) return <Loading />;
  return (
    <>
      <Button
        component={Link}
        to="/admin/content"
        startIcon={<ArrowBack />}
        size="small"
        sx={{ mb: 2 }}
      >
        Back to content
      </Button>
      <PageTitle
        eyebrow={
          id ? `REVISION ${form.revision || 1}` : "A NEW IDEA STARTS HERE"
        }
        title={id ? "Edit content" : "Create content"}
        description="Make it useful. Make it yours. Share it when it’s ready."
        action={
          id && (
            <Button
              variant="outlined"
              startIcon={<History />}
              onClick={async () => {
                setError("");
                try {
                  setVersions(await api(`/posts/${id}/versions`));
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Version history
            </Button>
          )
        }
      />
      <ErrorMessage error={error} />
      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      {!editable && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Authors can edit their own drafts. An editor can update published
          content.
        </Alert>
      )}
      <form onSubmit={save}>
        <div className="editor-layout">
          <div>
            <section className="panel form-panel">
              <TextField
                fullWidth
                required
                label="Content title"
                value={form.title}
                onChange={change("title")}
                inputProps={{ minLength: 3, maxLength: 255 }}
                disabled={!editable}
              />
              <TextField
                fullWidth
                label="URL slug"
                value={form.slug}
                onChange={change("slug")}
                helperText="Leave empty to generate from the title. Use lowercase letters, numbers, and hyphens."
                inputProps={{
                  pattern: "[a-z0-9]+(-[a-z0-9]+)*",
                  maxLength: 255,
                }}
                disabled={!editable}
              />
              <div>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Content
                </Typography>
                <div className="editor-toolbar">
                  <span>HTML editor</span>
                  <code>
                    &lt;h2&gt; &lt;p&gt; &lt;strong&gt; &lt;a&gt; &lt;ul&gt;
                  </code>
                </div>
                <TextField
                  fullWidth
                  required
                  multiline
                  minRows={16}
                  value={form.content}
                  onChange={change("content")}
                  placeholder="<h2>Start with something worth sharing</h2>"
                  inputProps={{
                    "aria-label": "Content HTML",
                    maxLength: 1000000,
                  }}
                  disabled={!editable}
                  sx={{
                    "& textarea": {
                      fontFamily: "Consolas, monospace",
                      fontSize: 13,
                      lineHeight: 1.8,
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Safe HTML is supported. Scripts and unsafe markup are removed
                  when you save.
                </Typography>
              </div>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Excerpt"
                value={form.excerpt}
                onChange={change("excerpt")}
                helperText="A short introduction for content cards and search results."
                inputProps={{ maxLength: 1000 }}
                disabled={!editable}
              />
            </section>
            <section className="panel form-panel">
              <div>
                <Typography variant="h6">Search engine preview</Typography>
                <Typography color="text.secondary" variant="body2">
                  Help students find the right resource.
                </Typography>
              </div>
              <div className="seo-preview">
                <small>
                  educms / library / {form.slug || "your-content-slug"}
                </small>
                <strong>
                  {form.meta_title || form.title || "Your content title"}
                </strong>
                <p>
                  {form.meta_description ||
                    form.excerpt ||
                    "Add a description to help people understand what they will learn."}
                </p>
              </div>
              <TextField
                fullWidth
                label="SEO title"
                value={form.meta_title}
                onChange={change("meta_title")}
                helperText={`${form.meta_title.length} characters · around 60 is a useful target`}
                inputProps={{ maxLength: 255 }}
                disabled={!editable}
              />
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Meta description"
                value={form.meta_description}
                onChange={change("meta_description")}
                helperText={`${form.meta_description.length} characters · aim for a clear, concise summary`}
                inputProps={{ maxLength: 1000 }}
                disabled={!editable}
              />
              <TextField
                fullWidth
                label="Keywords"
                value={form.meta_keywords}
                onChange={change("meta_keywords")}
                helperText="Separate keywords with commas."
                inputProps={{ maxLength: 1000 }}
                disabled={!editable}
              />
            </section>
          </div>
          <div>
            <section className="panel form-panel">
              <Typography variant="h6">Publishing</Typography>
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={change("status")}
                disabled={!editable || user.role === "author"}
              >
                {["draft", "published", "archived"].map((s) => (
                  <MenuItem value={s} key={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
              {user.role === "author" && (
                <Typography variant="caption" color="text.secondary">
                  An editor will review and publish your draft.
                </Typography>
              )}
              <TextField
                select
                label="Content type"
                value={form.content_type}
                onChange={change("content_type")}
                disabled={!editable}
              >
                {["article", "course", "announcement", "resource"].map((s) => (
                  <MenuItem value={s} key={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Category"
                value={form.category_id}
                onChange={change("category_id")}
                disabled={!editable}
              >
                <MenuItem value="">Uncategorized</MenuItem>
                {categories.data?.map((c) => (
                  <MenuItem key={c.category_id} value={c.category_id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
              <ErrorMessage error={categories.error} />
              <TextField
                select
                label="Tags"
                value={form.tag_ids}
                onChange={change("tag_ids")}
                disabled={!editable}
                SelectProps={{
                  multiple: true,
                  renderValue: (ids) =>
                    ids
                      .map(
                        (tagId) =>
                          tags.data?.find((t) => t.tag_id === tagId)?.name ||
                          tagId,
                      )
                      .join(", "),
                }}
              >
                {tags.data?.map((t) => (
                  <MenuItem key={t.tag_id} value={t.tag_id}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
              <ErrorMessage error={tags.error} />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.allow_comments}
                    onChange={change("allow_comments")}
                    disabled={!editable}
                  />
                }
                label="Allow comments"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.is_featured}
                    onChange={change("is_featured")}
                    disabled={!editable || user.role === "author"}
                  />
                }
                label="Feature this content"
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveOutlined />}
                disabled={busy || !editable}
              >
                {busy ? "Saving…" : "Save content"}
              </Button>
              {form.status === "published" && id && (
                <Button
                  component={Link}
                  to={`/library/${form.slug}`}
                  endIcon={<OpenInNew fontSize="small" />}
                >
                  View published content
                </Button>
              )}
            </section>
            <section className="panel form-panel">
              <Typography variant="h6">Featured image</Typography>
              {form.featured_image && (
                <img
                  className="featured-preview"
                  src={form.featured_image}
                  alt="Featured preview"
                />
              )}
              <TextField
                select
                label="Choose from media"
                value={form.featured_image}
                onChange={change("featured_image")}
                disabled={!editable}
              >
                <MenuItem value="">No featured image</MenuItem>
                {form.featured_image &&
                  !media.data?.items.some(
                    (m) => m.file_path === form.featured_image,
                  ) && (
                    <MenuItem value={form.featured_image}>
                      Current image
                    </MenuItem>
                  )}
                {media.data?.items
                  .filter((m) => m.file_type === "image")
                  .map((m) => (
                    <MenuItem value={m.file_path} key={m.media_id}>
                      {m.original_name}
                    </MenuItem>
                  ))}
              </TextField>
              <ErrorMessage error={media.error} />
              <Button component={Link} to="/admin/media" size="small">
                Open media library ↗
              </Button>
            </section>
            <div className="editor-note">
              {dirty
                ? "You have unsaved changes."
                : id
                  ? `Last updated ${date(form.updated_at)}`
                  : "Your next great resource starts here."}
            </div>
          </div>
        </div>
      </form>
      <Dialog
        open={versions !== null}
        onClose={() => setVersions(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Version history</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
            Restoring saves a new draft and preserves every previous version.
            Unsaved edits will be replaced.
          </Typography>
          {versions?.map((v) => (
            <div className="version-row" key={v.version_id}>
              <div>
                <strong>Revision {v.revision}</strong>
                <small>
                  {date(v.created_at)} · {v.created_by_name || "Former user"} ·{" "}
                  {v.snapshot.title}
                </small>
              </div>
              <Button
                size="small"
                disabled={busy || v.revision === form.revision || !editable}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const post = await api(
                      `/posts/${id}/versions/${v.version_id}/restore`,
                      { method: "POST", body: { revision: form.revision } },
                    );
                    const full = await api(`/posts/${post.post_id}`);
                    setForm({
                      ...blank,
                      ...full,
                      category_id: full.category_id || "",
                      featured_image: full.featured_image || "",
                      tag_ids: full.tags.map((t) => t.tag_id),
                    });
                    setVersions(null);
                    setDirty(false);
                    setMessage("Version restored as a new draft.");
                  } catch (e) {
                    setError(e.message);
                    setVersions(null);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Restore
              </Button>
            </div>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersions(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
