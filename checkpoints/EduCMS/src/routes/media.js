const router = require("express").Router();
const fs = require("node:fs/promises");
const path = require("node:path");
const db = require("../config/database");
const { uploadDir } = require("../config/env");
const { authorize, canManage } = require("../middleware/auth");
const { body, id, validate, pagination } = require("../middleware/validation");
const { upload, saveFile } = require("../middleware/upload");
const { fail, success, paginate } = require("../utils/helpers");
const { record } = require("../services/activityService");
router.use(authorize("admin", "editor", "author"));
router.get("/", ...pagination, async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const params = canManage(req.user) ? [] : [req.user.user_id];
  const where = params.length ? "WHERE uploaded_by=$1" : "";
  const total = Number(
    (await db.query(`SELECT COUNT(*) FROM media ${where}`, params)).rows[0]
      .count,
  );
  const items = (
    await db.query(
      `SELECT * FROM media ${where} ORDER BY created_at DESC,media_id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    )
  ).rows;
  success(res, {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});
router.post(
  "/",
  upload.single("file"),
  body("alt_text").optional().isString().isLength({ max: 255 }),
  body("caption").optional().isString().isLength({ max: 2000 }),
  validate,
  async (req, res) => {
    const file = await saveFile(req.file);
    try {
      const item = await db.transaction(async (client) => {
        const media = (
          await client.query(
            "INSERT INTO media(filename,original_name,file_path,file_type,file_size,mime_type,uploaded_by,alt_text,caption) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
            [
              file.filename,
              path.basename(req.file.originalname).slice(0, 255),
              `/uploads/${file.filename}`,
              file.mime.startsWith("image/") ? "image" : "document",
              req.file.size,
              file.mime,
              req.user.user_id,
              req.body.alt_text || "",
              req.body.caption || "",
            ],
          )
        ).rows[0];
        await record(
          client,
          req,
          "uploaded",
          "media",
          media.media_id,
          media.original_name,
        );
        return media;
      });
      success(res, item, 201);
    } catch (error) {
      await fs.unlink(path.join(uploadDir, file.filename)).catch(() => {});
      throw error;
    }
  },
);
router.patch(
  "/:id",
  ...id,
  body("alt_text").isString().isLength({ max: 255 }),
  body("caption").isString().isLength({ max: 2000 }),
  validate,
  async (req, res) => {
    const result = await db.transaction(async (client) => {
      const item = (
        await client.query("SELECT * FROM media WHERE media_id=$1 FOR UPDATE", [
          req.params.id,
        ])
      ).rows[0];
      if (!item) fail(404, "Media not found");
      if (!canManage(req.user) && item.uploaded_by !== req.user.user_id)
        fail(403, "You can only edit your own uploads");
      const media = (
        await client.query(
          "UPDATE media SET alt_text=$1,caption=$2 WHERE media_id=$3 RETURNING *",
          [req.body.alt_text, req.body.caption, item.media_id],
        )
      ).rows[0];
      await record(client, req, "updated", "media", item.media_id);
      return media;
    });
    success(res, result);
  },
);
router.delete("/:id", ...id, async (req, res) => {
  await db.transaction(async (client) => {
    const item = (
      await client.query("SELECT * FROM media WHERE media_id=$1 FOR UPDATE", [
        req.params.id,
      ])
    ).rows[0];
    if (!item) fail(404, "Media not found");
    if (!canManage(req.user) && item.uploaded_by !== req.user.user_id)
      fail(403, "You can only delete your own uploads");
    if (
      (
        await client.query(
          "SELECT post_id FROM posts WHERE featured_image=$1 OR content LIKE $2 LIMIT 1",
          [item.file_path, `%${item.file_path}%`],
        )
      ).rowCount
    )
      fail(409, "This file is in use by content. Remove its references first.");
    await fs.unlink(path.join(uploadDir, item.filename)).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
    await client.query("DELETE FROM media WHERE media_id=$1", [item.media_id]);
    await record(
      client,
      req,
      "deleted",
      "media",
      item.media_id,
      item.original_name,
    );
  });
  success(res, { deleted: true });
});
module.exports = router;
