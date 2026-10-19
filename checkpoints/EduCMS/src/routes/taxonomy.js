const express = require("express");
const db = require("../config/database");
const { authorize, canManage } = require("../middleware/auth");
const { body, id, validate } = require("../middleware/validation");
const { fail, generateSlug, success } = require("../utils/helpers");
const { record } = require("../services/activityService");
function taxonomy(type) {
  const router = express.Router();
  const category = type === "categories";
  const key = category ? "category_id" : "tag_id";
  const maxLength = category ? 100 : 50;
  const rules = [
    body("name").isString().trim().isLength({ min: 1, max: maxLength }),
    body("description").optional().isString().isLength({ max: 2000 }),
    body("slug")
      .optional()
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .isLength({ max: maxLength }),
  ];
  if (category)
    rules.push(
      body("parent_id").optional({ nullable: true }).isInt({ min: 1 }),
      body("is_active").optional().isBoolean({ strict: true }),
      body("display_order").optional().isInt({ min: 0, max: 10000 }),
    );
  router.get("/", async (req, res) => {
    const filter =
      category && !canManage(req.user) ? "WHERE t.is_active=true" : "";
    success(
      res,
      (
        await db.query(
          `SELECT t.*,(SELECT COUNT(*)::INTEGER FROM ${category ? "posts p" : "post_tags pt JOIN posts p ON p.post_id=pt.post_id"} WHERE ${category ? "p.category_id" : "pt.tag_id"}=t.${key} AND p.status='published') AS post_count FROM ${type} t ${filter} ORDER BY ${category ? "t.display_order," : ""}t.name`,
        )
      ).rows,
    );
  });
  router.get("/:id", ...id, async (req, res) => {
    const item = (
      await db.query(
        `SELECT * FROM ${type} WHERE ${key}=$1 ${category && !canManage(req.user) ? "AND is_active=true" : ""}`,
        [req.params.id],
      )
    ).rows[0];
    if (!item) fail(404, "Not found");
    success(res, item);
  });
  async function write(req, res, updating) {
    const result = await db.transaction(async (client) => {
      if (category) {
        // Serialize hierarchy changes so concurrent edits cannot introduce cycles.
        await client.query("SELECT pg_advisory_xact_lock(214017)");
        if (req.body.parent_id && updating) {
          const cycle = await client.query(
            "WITH RECURSIVE ancestors AS (SELECT category_id,parent_id FROM categories WHERE category_id=$1 UNION SELECT c.category_id,c.parent_id FROM categories c JOIN ancestors a ON c.category_id=a.parent_id) SELECT 1 FROM ancestors WHERE category_id=$2",
            [req.body.parent_id, req.params.id],
          );
          if (cycle.rowCount)
            fail(422, "A category cannot be its own ancestor");
        }
      }
      const columns = [
        "name",
        "slug",
        "description",
        ...(category ? ["parent_id", "display_order", "is_active"] : []),
      ];
      const values = [
        req.body.name,
        (req.body.slug || generateSlug(req.body.name)).slice(0, maxLength),
        req.body.description || "",
        ...(category
          ? [
              req.body.parent_id || null,
              req.body.display_order ?? 0,
              req.body.is_active ?? true,
            ]
          : []),
      ];
      const sql = updating
        ? `UPDATE ${type} SET ${columns.map((c, i) => `${c}=$${i + 1}`).join(",")} WHERE ${key}=$${values.length + 1} RETURNING *`
        : `INSERT INTO ${type}(${columns.join(",")}) VALUES(${values.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`;
      const item = (
        await client.query(sql, updating ? [...values, req.params.id] : values)
      ).rows[0];
      if (!item) fail(404, "Not found");
      await record(
        client,
        req,
        updating ? "updated" : "created",
        type,
        item[key],
        item.name,
      );
      return item;
    });
    success(res, result, updating ? 200 : 201);
  }
  router.post(
    "/",
    authorize("admin", "editor"),
    ...rules,
    validate,
    (req, res) => write(req, res, false),
  );
  router.put(
    "/:id",
    authorize("admin", "editor"),
    ...id,
    ...rules,
    validate,
    (req, res) => write(req, res, true),
  );
  router.delete(
    "/:id",
    authorize("admin", "editor"),
    ...id,
    async (req, res) => {
      await db.transaction(async (client) => {
        const result = await client.query(
          `DELETE FROM ${type} WHERE ${key}=$1 RETURNING name`,
          [req.params.id],
        );
        if (!result.rowCount) fail(404, "Not found");
        await record(
          client,
          req,
          "deleted",
          type,
          Number(req.params.id),
          result.rows[0].name,
        );
      });
      success(res, { deleted: true });
    },
  );
  return router;
}
module.exports = taxonomy;
