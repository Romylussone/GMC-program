import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Pagination,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBack,
  ArrowForward,
  AutoStoriesOutlined,
  FavoriteBorder,
  AccessTime,
} from "@mui/icons-material";
import { api } from "../api";
import {
  useAuth,
  useLoad,
  Loading,
  ErrorMessage,
  Empty,
  date,
} from "../common";
function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="library-header">
      <Link className="brand" to="/library">
        <span className="brand-icon">
          <AutoStoriesOutlined fontSize="small" />
        </span>
        <span>
          Edu<span className="brand-light">CMS</span>
        </span>
      </Link>
      <div>
        <Link to="/library">Learning library</Link>
        {user && user.role !== "subscriber" && (
          <Link to="/admin">Workspace ↗</Link>
        )}
        {user ? (
          <Button onClick={() => logout().catch(() => {})}>Sign out</Button>
        ) : (
          <Button component={Link} to="/login" variant="contained">
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
export function Library() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);
  const categories = useLoad("/categories");
  const tags = useLoad("/tags");
  const state = useLoad(
    `/posts?${new URLSearchParams({ status: "published", page, limit: 9, ...(search && { q: search }), ...(category && { category_id: category }), ...(type && { content_type: type }), ...(tag && { tag_id: tag }) })}`,
  );
  return (
    <div className="library">
      <Header />
      <div className="library-hero">
        <span className="eyebrow">A COMMUNITY OF CURIOUS MINDS</span>
        <h1>
          A little curiosity.
          <br />
          <em>Endless possibility.</em>
        </h1>
        <p>
          Explore courses, discover ideas, and find the resources
          <br />
          that take your learning a step further.
        </p>
      </div>
      <main className="library-main">
        <div className="filter-bar library-filters">
          <TextField
            placeholder="What do you want to learn?"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ flex: 1, minWidth: 230 }}
            inputProps={{ "aria-label": "Search library" }}
          />
          <TextField
            select
            label="Type"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All types</MenuItem>
            {["article", "course", "announcement", "resource"].map((v) => (
              <MenuItem key={v} value={v}>
                {v[0].toUpperCase() + v.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All categories</MenuItem>
            {categories.data?.map((c) => (
              <MenuItem key={c.category_id} value={c.category_id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Tag"
            value={tag}
            onChange={(e) => {
              setTag(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All tags</MenuItem>
            {tags.data?.map((t) => (
              <MenuItem key={t.tag_id} value={t.tag_id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
        </div>
        <ErrorMessage error={state.error || categories.error || tags.error} />
        {state.loading ? (
          <Loading />
        ) : state.data?.items.length ? (
          <>
            <div className="library-grid">
              {state.data.items.map((p, i) => (
                <Link
                  className="library-card panel"
                  key={p.post_id}
                  to={`/library/${p.slug}`}
                >
                  <div className={`library-cover tone-${i % 4}`}>
                    {p.featured_image ? (
                      <img src={p.featured_image} alt="" />
                    ) : (
                      <>
                        <AutoStoriesOutlined
                          sx={{ fontSize: 65, opacity: 0.65 }}
                        />
                        <span className="cover-orbit" />
                      </>
                    )}
                    <span className="cover-type">{p.content_type}</span>
                  </div>
                  <div className="library-card-body">
                    <small>{p.category_name || "EXPLORE & LEARN"}</small>
                    <h2>{p.title}</h2>
                    <p>{p.excerpt}</p>
                    <div>
                      <span>
                        {p.author_first_name || p.author || "EduCMS"} ·{" "}
                        {p.reading_time || 1} min read
                      </span>
                      <ArrowForward fontSize="small" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Pagination
              sx={{ mt: 4 }}
              count={Math.max(1, state.data.pagination.totalPages)}
              page={page}
              onChange={(_, p) => setPage(p)}
              color="primary"
            />
          </>
        ) : (
          !state.error && (
            <Empty
              title="There’s more to discover"
              description="Try a different search or come back for new resources."
            />
          )
        )}
      </main>
      <footer className="library-footer">
        Made for learning. Built around you. <strong>EduCMS</strong>
      </footer>
    </div>
  );
}
export function Article() {
  const { slug } = useParams();
  const { user } = useAuth();
  const state = useLoad(`/posts/slug/${encodeURIComponent(slug)}`);
  const [commentsVersion, setCommentsVersion] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [likes, setLikes] = useState(null);
  const [liked, setLiked] = useState(false);
  const id = state.data?.post_id;
  const comments = useLoad(
    `/comments?post_id=${id || 0}&status=approved&limit=100`,
    commentsVersion,
  );
  useEffect(() => {
    setLikes(null);
    setLiked(false);
    setMessage("");
    if (id && state.data.status === "published")
      api(`/posts/${id}/view`, { method: "POST" }).catch(() => {});
  }, [id]);
  useEffect(() => {
    if (!state.data) return;
    document.title = `${state.data.meta_title || state.data.title} · EduCMS`;
    const meta = document.querySelector('meta[name="description"]');
    const old = meta.content;
    meta.content = state.data.meta_description || state.data.excerpt || "";
    return () => {
      document.title = "EduCMS · Your learning, connected";
      meta.content = old;
    };
  }, [state.data]);
  const p = state.data;
  return (
    <div className="library">
      <Header />
      {state.loading ? (
        <Loading />
      ) : state.error ? (
        <Box sx={{ p: 5 }}>
          <ErrorMessage error={state.error} />
        </Box>
      ) : (
        <main className="article-main">
          <Button
            component={Link}
            to="/library"
            startIcon={<ArrowBack />}
            sx={{ mb: 4 }}
          >
            Back to the library
          </Button>
          {p.status !== "published" && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Draft preview · this content is not public.
            </Alert>
          )}
          <div className="article-labels">
            <Chip
              label={p.content_type}
              size="small"
              color="primary"
              variant="outlined"
            />
            <span>{p.category_name}</span>
          </div>
          <h1>{p.title}</h1>
          <p className="article-excerpt">{p.excerpt}</p>
          <div className="article-meta">
            <span>
              By {p.author_first_name || p.author || "EduCMS"}{" "}
              {p.author_last_name}
            </span>
            <span>{date(p.published_at || p.created_at)}</span>
            <span>
              <AccessTime sx={{ fontSize: 15 }} />
              {p.reading_time || 1} min read
            </span>
          </div>
          {p.featured_image && (
            <img className="article-featured" src={p.featured_image} alt="" />
          )}
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: p.content }}
          />
          <div className="article-tags">
            {p.tags.map((t) => (
              <Chip label={t.name} key={t.tag_id} size="small" />
            ))}
            {p.status === "published" && (
              <Button
                disabled={!user || busy}
                startIcon={<FavoriteBorder />}
                variant={liked ? "contained" : "outlined"}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const result = await api(`/posts/${id}/like`, {
                      method: "POST",
                    });
                    setLikes(result.like_count);
                    setLiked(result.liked);
                  } catch (e) {
                    setError(e.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {likes ?? p.like_count} likes
              </Button>
            )}
          </div>
          <ErrorMessage error={error} />
          {p.allow_comments && p.status === "published" && (
            <section className="article-comments">
              <Typography variant="h5">Join the conversation</Typography>
              <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Ideas grow when we learn from each other.
              </Typography>
              {message && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {message}
                </Alert>
              )}
              {user ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    setError("");
                    try {
                      const result = await api("/comments", {
                        method: "POST",
                        body: { post_id: id, content: comment },
                      });
                      setComment("");
                      setMessage(
                        result.status === "pending"
                          ? "Thanks! Your comment is waiting for moderation."
                          : "Your comment is published.",
                      );
                      setCommentsVersion((v) => v + 1);
                    } catch (e) {
                      setError(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <TextField
                    fullWidth
                    required
                    multiline
                    minRows={3}
                    label="Share a thought or ask a question"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    inputProps={{ maxLength: 5000 }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{ mt: 2 }}
                    disabled={busy}
                  >
                    Post comment
                  </Button>
                </form>
              ) : (
                <Button component={Link} to="/login" variant="outlined">
                  Sign in to leave a comment
                </Button>
              )}
              <ErrorMessage error={id ? comments.error : ""} />
              <div className="public-comments">
                {comments.data?.items.map((c) => (
                  <div className="public-comment" key={c.comment_id}>
                    <strong>
                      {c.first_name || c.username || "Former user"}
                    </strong>
                    <small>{date(c.created_at)}</small>
                    <p>{c.content}</p>
                    {user?.user_id === c.user_id && (
                      <Button
                        size="small"
                        color="inherit"
                        onClick={async () => {
                          setBusy(true);
                          try {
                            await api(`/comments/${c.comment_id}`, {
                              method: "DELETE",
                            });
                            setCommentsVersion((v) => v + 1);
                          } catch (e) {
                            setError(e.message);
                          } finally {
                            setBusy(false);
                          }
                        }}
                        disabled={busy}
                      >
                        Delete my comment
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      )}
      <footer className="library-footer">
        Knowledge grows when it’s shared. <strong>EduCMS</strong>
      </footer>
    </div>
  );
}
