const router = require("express").Router();
const db = require("../config/database");
const {
  body,
  param,
  query,
  validate,
  id,
  pagination,
  postRules,
} = require("../middleware/validation");
const {
  authorize,
  authenticate,
  canManage,
  checkPostAccess,
} = require("../middleware/auth");
const {
  fail,
  success,
  generateSlug,
  cleanHtml,
  plainText,
  calculateReadingTime,
  paginate,
} = require("../utils/helpers");
const { record } = require("../services/activityService");
const writable = authorize("admin", "editor", "author");
const fields = [
  "title",
  "slug",
  "content",
  "excerpt",
  "category_id",
  "content_type",
  "status",
  "featured_image",
  "meta_title",
  "meta_description",
  "meta_keywords",
  "is_featured",
  "allow_comments",
  "reading_time",
];
const selectPost = `SELECT p.*,u.username AS author,u.first_name AS author_first_name,u.last_name AS author_last_name,c.name AS category_name,
 COALESCE((SELECT json_agg(json_build_object('tag_id',t.tag_id,'name',t.name,'slug',t.slug) ORDER BY t.name) FROM tags t JOIN post_tags pt ON pt.tag_id=t.tag_id WHERE pt.post_id=p.post_id),'[]'::json) AS tags,
 (SELECT COUNT(*)::INTEGER FROM comments cm WHERE cm.post_id=p.post_id AND cm.status='approved') AS comment_count
 FROM posts p LEFT JOIN users u ON u.user_id=p.author_id LEFT JOIN categories c ON c.category_id=p.category_id`;
function normalize(data) {
  const content = cleanHtml(data.content);
  if (!plainText(content).trim() && !content.includes("<img"))
    fail(422, "Content cannot be empty");
  return {
    title: data.title.trim(),
    slug: data.slug || generateSlug(data.title),
    content,
    excerpt: data.excerpt || plainText(content).slice(0, 200),
    category_id: data.category_id || null,
    content_type: data.content_type,
    status: data.status,
    featured_image: data.featured_image || null,
    meta_title: data.meta_title || "",
    meta_description: data.meta_description || "",
    meta_keywords: data.meta_keywords || "",
    is_featured: data.is_featured ?? false,
    allow_comments: data.allow_comments ?? true,
    reading_time: calculateReadingTime(content),
  };
}
async function setTags(client, postId, ids = []) {
  await client.query("DELETE FROM post_tags WHERE post_id=$1", [postId]);
  for (const tagId of [...new Set(ids.map(Number))])
    await client.query("INSERT INTO post_tags(post_id,tag_id) VALUES($1,$2)", [
      postId,
      tagId,
    ]);
}
async function snapshot(client, post, ids, userId) {
  await client.query(
    "INSERT INTO post_versions(post_id,revision,snapshot,created_by) VALUES($1,$2,$3,$4)",
    [
      post.post_id,
      post.revision,
      JSON.stringify({ ...post, tag_ids: ids }),
      userId,
    ],
  );
}
async function locked(client, id) {
  const post = (
    await client.query("SELECT * FROM posts WHERE post_id=$1 FOR UPDATE", [id])
  ).rows[0];
  if (!post) fail(404, "Content not found");
  return post;
}
function visibility(req, post) {
  if (
    post.status !== "published" &&
    !canManage(req.user) &&
    post.author_id !== req.user?.user_id
  )
    fail(404, "Content not found");
}
router.get(
  "/",
  ...pagination,
  query("q").optional().isString().isLength({ max: 200 }),
  query("status").optional().isIn(["draft", "published", "archived"]),
  query("content_type")
    .optional()
    .isIn(["article", "course", "announcement", "resource"]),
  query("category_id").optional().isInt({ min: 1 }),
  query("tag_id").optional().isInt({ min: 1 }),
  query("author_id").optional().isInt({ min: 1 }),
  query("sort").optional().isIn(["newest", "oldest", "title", "views"]),
  query("mine").optional().isIn(["true", "false"]),
  validate,
  async (req, res) => {
    const { page, limit, offset } = paginate(req.query);
    const params = [];
    const where = [];
    const add = (condition, value) => {
      params.push(value);
      where.push(condition.replace("?", `$${params.length}`));
    };
    if (!canManage(req.user)) {
      if (req.user?.role === "author") {
        params.push(req.user.user_id);
        where.push(`(p.status='published' OR p.author_id=$${params.length})`);
      } else where.push("p.status='published'");
    }
    if (req.query.mine === "true") {
      if (!req.user) fail(401, "Please sign in");
      add("p.author_id=?", req.user.user_id);
    }
    for (const field of ["status", "content_type", "category_id", "author_id"])
      if (req.query[field]) add(`p.${field}=?`, req.query[field]);
    if (req.query.tag_id)
      add(
        "EXISTS(SELECT 1 FROM post_tags pt WHERE pt.post_id=p.post_id AND pt.tag_id=?)",
        req.query.tag_id,
      );
    if (req.query.q) {
      params.push(req.query.q);
      const p = `$${params.length}`;
      where.push(
        `(to_tsvector('english',p.title || ' ' || COALESCE(p.excerpt,'') || ' ' || p.content) @@ plainto_tsquery('english',${p}) OR p.title ILIKE '%' || ${p} || '%')`,
      );
    }
    const filter = where.length ? ` WHERE ${where.join(" AND ")}` : "";
    const total = Number(
      (await db.query(`SELECT COUNT(*) FROM posts p${filter}`, params)).rows[0]
        .count,
    );
    const sort = {
      newest: "p.created_at DESC",
      oldest: "p.created_at ASC",
      title: "p.title ASC",
      views: "p.view_count DESC",
    }[req.query.sort || "newest"];
    const items = (
      await db.query(
        `${selectPost}${filter} ORDER BY ${sort},p.post_id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      )
    ).rows;
    success(res, {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);
router.get(
  "/slug/:slug",
  param("slug").isString().isLength({ max: 255 }),
  validate,
  async (req, res) => {
    const post = (
      await db.query(`${selectPost} WHERE p.slug=$1`, [req.params.slug])
    ).rows[0];
    if (!post) fail(404, "Content not found");
    visibility(req, post);
    success(res, post);
  },
);
router.get("/:id", ...id, async (req, res) => {
  const post = (
    await db.query(`${selectPost} WHERE p.post_id=$1`, [req.params.id])
  ).rows[0];
  if (!post) fail(404, "Content not found");
  visibility(req, post);
  success(res, post);
});
router.post("/", writable, ...postRules, async (req, res) => {
  const data = normalize(req.body);
  if (req.user.role === "author" && data.status !== "draft")
    fail(403, "Authors save drafts; editors publish content");
  if (!canManage(req.user)) data.is_featured = false;
  const result = await db.transaction(async (client) => {
    const values = fields.map((field) => data[field]);
    const post = (
      await client.query(
        `INSERT INTO posts(${fields.join(",")},author_id,published_at) VALUES(${values.map((_, i) => `$${i + 1}`).join(",")},$${values.length + 1},$${values.length + 2}) RETURNING *`,
        [
          ...values,
          req.user.user_id,
          data.status === "published" ? new Date() : null,
        ],
      )
    ).rows[0];
    await setTags(client, post.post_id, req.body.tag_ids);
    await snapshot(client, post, req.body.tag_ids || [], req.user.user_id);
    await record(client, req, "created", "post", post.post_id, post.title);
    return post;
  });
  success(res, result, 201);
});
router.put(
  "/:id",
  writable,
  ...id,
  body("revision").isInt({ min: 1 }),
  ...postRules,
  async (req, res) => {
    const result = await db.transaction(async (client) => {
      const old = await locked(client, req.params.id);
      checkPostAccess(req.user, old);
      if (old.revision !== Number(req.body.revision))
        fail(409, "This content has changed. Reload before saving.");
      const data = normalize(req.body);
      if (
        req.user.role === "author" &&
        (old.status !== "draft" || data.status !== "draft")
      )
        fail(403, "Ask an editor to update or publish this content");
      if (!canManage(req.user)) data.is_featured = old.is_featured;
      const values = fields.map((field) => data[field]);
      const post = (
        await client.query(
          `UPDATE posts SET ${fields.map((field, i) => `${field}=$${i + 1}`).join(",")},revision=revision+1,published_at=COALESCE(published_at,$${values.length + 2}::timestamptz) WHERE post_id=$${values.length + 1} RETURNING *`,
          [
            ...values,
            old.post_id,
            data.status === "published" ? new Date() : null,
          ],
        )
      ).rows[0];
      await setTags(client, post.post_id, req.body.tag_ids);
      await snapshot(client, post, req.body.tag_ids || [], req.user.user_id);
      await record(client, req, "updated", "post", post.post_id, post.title);
      return post;
    });
    success(res, result);
  },
);
router.delete("/:id", writable, ...id, async (req, res) => {
  await db.transaction(async (client) => {
    const post = await locked(client, req.params.id);
    checkPostAccess(req.user, post);
    if (req.user.role === "author" && post.status !== "draft")
      fail(403, "Only editors can delete published or archived content");
    await client.query("DELETE FROM posts WHERE post_id=$1", [post.post_id]);
    await record(client, req, "deleted", "post", post.post_id, post.title);
  });
  success(res, { deleted: true });
});
router.get("/:id/versions", writable, ...id, async (req, res) => {
  const post = (
    await db.query("SELECT * FROM posts WHERE post_id=$1", [req.params.id])
  ).rows[0];
  if (!post) fail(404, "Content not found");
  checkPostAccess(req.user, post);
  success(
    res,
    (
      await db.query(
        "SELECT v.*,u.username AS created_by_name FROM post_versions v LEFT JOIN users u ON u.user_id=v.created_by WHERE post_id=$1 ORDER BY revision DESC",
        [post.post_id],
      )
    ).rows,
  );
});
router.post(
  "/:id/versions/:versionId/restore",
  writable,
  ...id,
  param("versionId").isInt({ min: 1 }),
  body("revision").isInt({ min: 1 }),
  validate,
  async (req, res) => {
    const result = await db.transaction(async (client) => {
      const old = await locked(client, req.params.id);
      checkPostAccess(req.user, old);
      if (old.revision !== Number(req.body.revision))
        fail(409, "This content has changed. Reload before restoring.");
      if (req.user.role === "author" && old.status !== "draft")
        fail(403, "Only editors can restore published or archived content");
      const version = (
        await client.query(
          "SELECT snapshot FROM post_versions WHERE post_id=$1 AND version_id=$2",
          [old.post_id, req.params.versionId],
        )
      ).rows[0];
      if (!version) fail(404, "Version not found");
      // Restoring always creates a new draft, preserving the full history.
      const data = normalize({ ...version.snapshot, status: "draft" });
      if (
        data.category_id &&
        !(
          await client.query("SELECT 1 FROM categories WHERE category_id=$1", [
            data.category_id,
          ])
        ).rowCount
      )
        data.category_id = null;
      const values = fields.map((field) => data[field]);
      const post = (
        await client.query(
          `UPDATE posts SET ${fields.map((field, i) => `${field}=$${i + 1}`).join(",")},revision=revision+1 WHERE post_id=$${values.length + 1} RETURNING *`,
          [...values, old.post_id],
        )
      ).rows[0];
      // A tag may have been deleted since this version was saved.
      const ids = (
        await client.query(
          "SELECT tag_id FROM tags WHERE tag_id=ANY($1::int[])",
          [version.snapshot.tag_ids || []],
        )
      ).rows.map((t) => t.tag_id);
      await setTags(client, post.post_id, ids);
      await snapshot(client, post, ids, req.user.user_id);
      await record(
        client,
        req,
        "restored",
        "post",
        post.post_id,
        `Restored revision ${version.snapshot.revision}`,
      );
      return post;
    });
    success(res, result);
  },
);
router.post("/:id/view", ...id, async (req, res) => {
  await db.transaction(async (client) => {
    const post = (
      await client.query(
        "UPDATE posts SET view_count=view_count+1 WHERE post_id=$1 AND status='published' RETURNING post_id",
        [req.params.id],
      )
    ).rows[0];
    if (!post) fail(404, "Content not found");
    await client.query("INSERT INTO post_views(post_id) VALUES($1)", [
      post.post_id,
    ]);
  });
  success(res, { counted: true });
});
router.post("/:id/like", authenticate, ...id, async (req, res) => {
  const result = await db.transaction(async (client) => {
    const post = await locked(client, req.params.id);
    if (post.status !== "published") fail(404, "Content not found");
    const removed = await client.query(
      "DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2",
      [post.post_id, req.user.user_id],
    );
    if (!removed.rowCount)
      await client.query(
        "INSERT INTO post_likes(post_id,user_id) VALUES($1,$2)",
        [post.post_id, req.user.user_id],
      );
    const updated = (
      await client.query(
        "UPDATE posts SET like_count=GREATEST(0,like_count+$1) WHERE post_id=$2 RETURNING like_count",
        [removed.rowCount ? -1 : 1, post.post_id],
      )
    ).rows[0];
    return { liked: !removed.rowCount, like_count: updated.like_count };
  });
  success(res, result);
});
module.exports = router;
