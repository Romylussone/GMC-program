const router = require("express").Router();
const db = require("../config/database");
const { authenticate, authorize, canManage } = require("../middleware/auth");
const {
  body,
  query,
  id,
  validate,
  pagination,
} = require("../middleware/validation");
const { fail, success, plainText, paginate } = require("../utils/helpers");
const { record } = require("../services/activityService");
router.get(
  "/",
  ...pagination,
  query("post_id").optional().isInt({ min: 1 }),
  query("status").optional().isIn(["pending", "approved", "spam", "trash"]),
  validate,
  async (req, res) => {
    const { page, limit, offset } = paginate(req.query);
    const params = [];
    const where = [];
    if (!canManage(req.user))
      where.push("c.status='approved' AND p.status='published'");
    for (const field of ["post_id", "status"])
      if (req.query[field]) {
        params.push(req.query[field]);
        where.push(`c.${field}=$${params.length}`);
      }
    const filter = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const total = Number(
      (
        await db.query(
          `SELECT COUNT(*) FROM comments c JOIN posts p ON p.post_id=c.post_id ${filter}`,
          params,
        )
      ).rows[0].count,
    );
    const items = (
      await db.query(
        `SELECT c.comment_id,c.post_id,c.user_id,c.parent_id,c.content,c.status,c.created_at,c.updated_at,u.username,u.first_name,u.last_name,p.title AS post_title FROM comments c JOIN posts p ON p.post_id=c.post_id LEFT JOIN users u ON u.user_id=c.user_id ${filter} ORDER BY c.created_at DESC,c.comment_id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      )
    ).rows;
    success(res, {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);
router.post(
  "/",
  authenticate,
  body("post_id").isInt({ min: 1 }),
  body("parent_id").optional({ nullable: true }).isInt({ min: 1 }),
  body("content").isString().trim().isLength({ min: 1, max: 5000 }),
  validate,
  async (req, res) => {
    const content = plainText(req.body.content).trim();
    if (!content) fail(422, "Comment cannot be empty");
    const result = await db.transaction(async (client) => {
      const post = (
        await client.query(
          "SELECT post_id,allow_comments FROM posts WHERE post_id=$1 AND status='published' FOR SHARE",
          [req.body.post_id],
        )
      ).rows[0];
      if (!post) fail(404, "Content not found");
      if (!post.allow_comments)
        fail(403, "Comments are disabled for this content");
      if (
        req.body.parent_id &&
        !(
          await client.query(
            "SELECT comment_id FROM comments WHERE comment_id=$1 AND post_id=$2 AND status=$3",
            [req.body.parent_id, post.post_id, "approved"],
          )
        ).rowCount
      )
        fail(422, "Reply must refer to an approved comment on the same post");
      const comment = (
        await client.query(
          "INSERT INTO comments(post_id,user_id,parent_id,content,status,ip_address,user_agent) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING comment_id,post_id,user_id,parent_id,content,status,created_at",
          [
            post.post_id,
            req.user.user_id,
            req.body.parent_id || null,
            content,
            canManage(req.user) ? "approved" : "pending",
            req.ip,
            req.get("user-agent"),
          ],
        )
      ).rows[0];
      await record(client, req, "created", "comment", comment.comment_id);
      return comment;
    });
    success(res, result, 201);
  },
);
router.put(
  "/:id",
  authenticate,
  ...id,
  body("content").isString().trim().isLength({ min: 1, max: 5000 }),
  validate,
  async (req, res) => {
    const content = plainText(req.body.content).trim();
    if (!content) fail(422, "Comment cannot be empty");
    const result = await db.transaction(async (client) => {
      const old = (
        await client.query(
          "SELECT * FROM comments WHERE comment_id=$1 FOR UPDATE",
          [req.params.id],
        )
      ).rows[0];
      if (!old) fail(404, "Comment not found");
      if (old.user_id !== req.user.user_id && !canManage(req.user))
        fail(403, "You can only edit your own comments");
      const item = (
        await client.query(
          "UPDATE comments SET content=$1,status=$2 WHERE comment_id=$3 RETURNING comment_id,post_id,user_id,parent_id,content,status,created_at,updated_at",
          [
            content,
            canManage(req.user) ? old.status : "pending",
            old.comment_id,
          ],
        )
      ).rows[0];
      await record(client, req, "updated", "comment", old.comment_id);
      return item;
    });
    success(res, result);
  },
);
router.patch(
  "/:id/status",
  authorize("admin", "editor"),
  ...id,
  body("status").isIn(["pending", "approved", "spam", "trash"]),
  validate,
  async (req, res) => {
    const result = await db.transaction(async (client) => {
      const comment = (
        await client.query(
          "UPDATE comments SET status=$1 WHERE comment_id=$2 RETURNING comment_id,status",
          [req.body.status, req.params.id],
        )
      ).rows[0];
      if (!comment) fail(404, "Comment not found");
      await record(client, req, req.body.status, "comment", comment.comment_id);
      return comment;
    });
    success(res, result);
  },
);
router.delete("/:id", authenticate, ...id, async (req, res) => {
  await db.transaction(async (client) => {
    const item = (
      await client.query(
        "SELECT * FROM comments WHERE comment_id=$1 FOR UPDATE",
        [req.params.id],
      )
    ).rows[0];
    if (!item) fail(404, "Comment not found");
    if (item.user_id !== req.user.user_id && !canManage(req.user))
      fail(403, "You can only delete your own comments");
    await client.query("DELETE FROM comments WHERE comment_id=$1", [
      item.comment_id,
    ]);
    await record(client, req, "deleted", "comment", item.comment_id);
  });
  success(res, { deleted: true });
});
module.exports = router;
