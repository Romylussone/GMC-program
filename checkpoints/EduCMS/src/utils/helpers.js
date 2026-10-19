const slugify = require("slugify");
const crypto = require("node:crypto");
const sanitize = require("sanitize-html");
function fail(status, message) {
  const err = new Error(message);
  err.status = status;
  throw err;
}
const generateSlug = (text) =>
  slugify(text, { lower: true, strict: true }).slice(0, 200) ||
  crypto.randomUUID();
const cleanHtml = (text) =>
  sanitize(text, {
    allowedTags: sanitize.defaults.allowedTags.concat(["img"]),
    allowedAttributes: {
      ...sanitize.defaults.allowedAttributes,
      img: ["src", "alt", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
const plainText = (text) =>
  sanitize(text || "", { allowedTags: [], allowedAttributes: {} });
const calculateReadingTime = (text) =>
  Math.max(
    1,
    Math.ceil(plainText(text).trim().split(/\s+/).filter(Boolean).length / 200),
  );
function paginate(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.max(
    1,
    Math.min(100, Number.parseInt(query.limit, 10) || 10),
  );
  return { page, limit, offset: (page - 1) * limit };
}
const success = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });
module.exports = {
  fail,
  generateSlug,
  cleanHtml,
  plainText,
  calculateReadingTime,
  paginate,
  success,
};
