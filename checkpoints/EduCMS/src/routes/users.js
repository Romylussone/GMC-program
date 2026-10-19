const router = require("express").Router();
const bcrypt = require("bcryptjs");
const db = require("../config/database");
const {
  authenticate,
  authorize,
  publicColumns,
} = require("../middleware/auth");
const { body, id, validate, pagination } = require("../middleware/validation");
const { fail, success, paginate } = require("../utils/helpers");
const { record } = require("../services/activityService");
router.patch(
  "/me",
  authenticate,
  body("first_name").isString().trim().isLength({ max: 50 }),
  body("last_name").isString().trim().isLength({ max: 50 }),
  body("bio").optional().isString().isLength({ max: 2000 }),
  validate,
  async (req, res) => {
    success(
      res,
      (
        await db.query(
          `UPDATE users SET first_name=$1,last_name=$2,bio=$3 WHERE user_id=$4 RETURNING ${publicColumns}`,
          [
            req.body.first_name,
            req.body.last_name,
            req.body.bio || "",
            req.user.user_id,
          ],
        )
      ).rows[0],
    );
  },
);
router.use(authorize("admin"));
router.get("/", ...pagination, async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const total = Number(
    (await db.query("SELECT COUNT(*) FROM users")).rows[0].count,
  );
  success(res, {
    items: (
      await db.query(
        `SELECT ${publicColumns} FROM users ORDER BY created_at DESC,user_id DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      )
    ).rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});
router.get("/:id", ...id, async (req, res) => {
  const item = (
    await db.query(`SELECT ${publicColumns} FROM users WHERE user_id=$1`, [
      req.params.id,
    ])
  ).rows[0];
  if (!item) fail(404, "User not found");
  success(res, item);
});
router.post(
  "/",
  body("username").matches(/^[a-zA-Z0-9_]{3,50}$/),
  body("email").isEmail().normalizeEmail().isLength({ max: 100 }),
  body("password").isString().isLength({ min: 10, max: 72 }),
  body("role").isIn(["admin", "editor", "author", "subscriber"]),
  body("first_name").optional().isString().isLength({ max: 50 }),
  body("last_name").optional().isString().isLength({ max: 50 }),
  validate,
  async (req, res) => {
    const hash = await bcrypt.hash(req.body.password, 12);
    const result = await db.transaction(async (client) => {
      const user = (
        await client.query(
          `INSERT INTO users(username,email,password_hash,role,first_name,last_name) VALUES($1,$2,$3,$4,$5,$6) RETURNING ${publicColumns}`,
          [
            req.body.username,
            req.body.email,
            hash,
            req.body.role,
            req.body.first_name || "",
            req.body.last_name || "",
          ],
        )
      ).rows[0];
      await record(client, req, "created", "user", user.user_id);
      return user;
    });
    success(res, result, 201);
  },
);
router.patch(
  "/:id",
  ...id,
  body("role").isIn(["admin", "editor", "author", "subscriber"]),
  body("is_active").isBoolean({ strict: true }),
  validate,
  async (req, res) => {
    const result = await db.transaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(214018)");
      const user = (
        await client.query("SELECT * FROM users WHERE user_id=$1 FOR UPDATE", [
          req.params.id,
        ])
      ).rows[0];
      if (!user) fail(404, "User not found");
      if (
        user.user_id === req.user.user_id &&
        (req.body.role !== "admin" || !req.body.is_active)
      )
        fail(422, "You cannot remove your own admin access");
      const updated = (
        await client.query(
          `UPDATE users SET role=$1,is_active=$2,token_version=token_version+1 WHERE user_id=$3 RETURNING ${publicColumns}`,
          [req.body.role, req.body.is_active, user.user_id],
        )
      ).rows[0];
      await record(
        client,
        req,
        "updated",
        "user",
        user.user_id,
        `${req.body.role}; active=${req.body.is_active}`,
      );
      return updated;
    });
    success(res, result);
  },
);
router.delete("/:id", ...id, async (req, res) => {
  if (Number(req.params.id) === req.user.user_id)
    fail(422, "You cannot delete your own account");
  await db.transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(214018)");
    // Keep the denormalized like count accurate when an account is removed.
    await client.query(
      "WITH removed AS (DELETE FROM post_likes WHERE user_id=$1 RETURNING post_id) UPDATE posts SET like_count=GREATEST(0,like_count-1) WHERE post_id IN (SELECT post_id FROM removed)",
      [req.params.id],
    );
    const result = await client.query(
      "DELETE FROM users WHERE user_id=$1 RETURNING user_id",
      [req.params.id],
    );
    if (!result.rowCount) fail(404, "User not found");
    await record(client, req, "deleted", "user", Number(req.params.id));
  });
  success(res, { deleted: true });
});
module.exports = router;
