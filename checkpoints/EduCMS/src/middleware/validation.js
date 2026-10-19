const { body, param, query, validationResult } = require("express-validator");
const { fail } = require("../utils/helpers");
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res
      .status(422)
      .json({
        success: false,
        message: "Please check the submitted fields",
        errors: errors
          .array()
          .map(({ path, msg }) => ({ field: path, message: msg })),
      });
  if (!req.body) req.body = {};
  next();
}
const id = [
  param("id").isInt({ min: 1 }).withMessage("Invalid identifier"),
  validate,
];
const pagination = [
  query("page").optional().isInt({ min: 1, max: 1000000 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  validate,
];
const postRules = [
  body("title").isString().trim().isLength({ min: 3, max: 255 }),
  body("content").isString().isLength({ min: 1, max: 1000000 }),
  body("status").isIn(["draft", "published", "archived"]),
  body("content_type").isIn(["article", "course", "announcement", "resource"]),
  body("category_id").optional({ nullable: true }).isInt({ min: 1 }),
  body("tag_ids").optional().isArray({ max: 50 }),
  body("tag_ids.*").isInt({ min: 1 }),
  body("excerpt").optional().isString().isLength({ max: 1000 }),
  body("slug")
    .optional()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .isLength({ max: 255 }),
  body("meta_title").optional().isString().isLength({ max: 255 }),
  body("meta_description").optional().isString().isLength({ max: 1000 }),
  body("meta_keywords").optional().isString().isLength({ max: 1000 }),
  body("featured_image")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 255 })
    .custom((value) => {
      if (value && !/^\/uploads\/[a-f0-9-]+\.(png|jpg|gif|webp)$/.test(value))
        fail(422, "Choose an uploaded image");
      return true;
    }),
  body("is_featured").optional().isBoolean({ strict: true }),
  body("allow_comments").optional().isBoolean({ strict: true }),
  validate,
];
module.exports = { body, param, query, validate, id, pagination, postRules };
