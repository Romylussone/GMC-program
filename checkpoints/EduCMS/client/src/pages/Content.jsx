import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import {
  Add,
  ArticleOutlined,
  DeleteOutline,
  EditOutlined,
  Search,
} from "@mui/icons-material";
import { api } from "../api";
import {
  useAuth,
  useLoad,
  Loading,
  ErrorMessage,
  PageTitle,
  Status,
  Empty,
  Confirm,
  date,
  number,
} from "../common";
export default function Content() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [query, setQuery] = useState(search);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [removing, setRemoving] = useState(null);
  useEffect(() => {
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const params = new URLSearchParams({
    page,
    limit: 10,
    sort,
    ...(query && { q: query }),
    ...(status && { status }),
    ...(type && { content_type: type }),
    ...(category && { category_id: category }),
  });
  const state = useLoad(`/posts?${params}`, version);
  const categories = useLoad("/categories");
  const filter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };
  return (
    <>
      <PageTitle
        eyebrow="YOUR CONTENT, CONNECTED"
        title="Content library"
        description="Every course, article, and idea. Organized in one place."
        action={
          <Button
            component={Link}
            to="/admin/content/new"
            variant="contained"
            startIcon={<Add />}
          >
            Create content
          </Button>
        }
      />
      <section className="panel">
        <div className="content-tabs">
          <Tabs
            value={status}
            onChange={(_, value) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <Tab label="All content" value="" />
            <Tab label="Published" value="published" />
            <Tab label="Drafts" value="draft" />
            <Tab label="Archived" value="archived" />
          </Tabs>
          <span>{state.data?.pagination.total || 0} items</span>
        </div>
        <div className="filter-bar">
          <TextField
            placeholder="Search by title or keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            inputProps={{ "aria-label": "Search posts" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 220 }}
          />
          <TextField
            select
            value={type}
            onChange={filter(setType)}
            SelectProps={{ displayEmpty: true }}
            inputProps={{ "aria-label": "Content type" }}
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
            value={category}
            onChange={filter(setCategory)}
            SelectProps={{ displayEmpty: true }}
            inputProps={{ "aria-label": "Category" }}
            sx={{ minWidth: 160 }}
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
            value={sort}
            onChange={filter(setSort)}
            inputProps={{ "aria-label": "Sort content" }}
          >
            <MenuItem value="newest">Newest first</MenuItem>
            <MenuItem value="oldest">Oldest first</MenuItem>
            <MenuItem value="title">Title A–Z</MenuItem>
            <MenuItem value="views">Most viewed</MenuItem>
          </TextField>
        </div>
        <ErrorMessage error={state.error} />
        {state.loading ? (
          <Loading />
        ) : state.data?.items.length ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>TITLE</TableCell>
                    <TableCell>TYPE</TableCell>
                    <TableCell>AUTHOR</TableCell>
                    <TableCell>STATUS</TableCell>
                    <TableCell>VIEWS</TableCell>
                    <TableCell>UPDATED</TableCell>
                    <TableCell align="right">ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {state.data.items.map((p, i) => (
                    <TableRow key={p.post_id} hover>
                      <TableCell>
                        <Link
                          className="content-title"
                          to={`/admin/content/${p.post_id}`}
                        >
                          <span className={`content-icon tone-${i % 4}`}>
                            <ArticleOutlined fontSize="small" />
                          </span>
                          <span>
                            <strong>{p.title}</strong>
                            <small>{p.category_name || "Uncategorized"}</small>
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        {p.content_type}
                      </TableCell>
                      <TableCell>
                        {p.author_first_name || p.author || "Former user"}
                      </TableCell>
                      <TableCell>
                        <Status value={p.status} />
                      </TableCell>
                      <TableCell>{number(p.view_count)}</TableCell>
                      <TableCell>{date(p.updated_at)}</TableCell>
                      <TableCell align="right">
                        {user.role !== "author" ||
                        (p.author_id === user.user_id &&
                          p.status === "draft") ? (
                          <>
                            <IconButton
                              component={Link}
                              to={`/admin/content/${p.post_id}`}
                              size="small"
                              aria-label={`Edit ${p.title}`}
                            >
                              <EditOutlined sx={{ fontSize: 17 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              aria-label={`Delete ${p.title}`}
                              onClick={() => setRemoving(p)}
                            >
                              <DeleteOutline sx={{ fontSize: 17 }} />
                            </IconButton>
                          </>
                        ) : (
                          <Button
                            component={Link}
                            to={`/library/${p.slug}`}
                            size="small"
                          >
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <div className="pagination-row">
              <span>
                Showing {(page - 1) * 10 + 1}–
                {Math.min(page * 10, state.data.pagination.total)} of{" "}
                {state.data.pagination.total}
              </span>
              <Pagination
                size="small"
                count={Math.max(1, state.data.pagination.totalPages)}
                page={page}
                onChange={(_, v) => setPage(v)}
                color="primary"
              />
            </div>
          </>
        ) : (
          !state.error && (
            <Empty
              title="Make room for your next idea"
              description="Create content or adjust your filters to find what you need."
              action={
                <Button component={Link} to="/admin/content/new">
                  Create content
                </Button>
              }
            />
          )
        )}
      </section>
      <Confirm
        open={!!removing}
        title={`Delete “${removing?.title}”?`}
        description="This removes the content, comments, and all saved versions permanently."
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          await api(`/posts/${removing.post_id}`, { method: "DELETE" });
          setVersion((v) => v + 1);
        }}
      />
    </>
  );
}
