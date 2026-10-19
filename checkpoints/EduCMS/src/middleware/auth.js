const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { secret } = require("../config/env");
const { fail } = require("../utils/helpers");
const publicColumns =
  "user_id,username,email,first_name,last_name,role,bio,avatar,is_active,email_verified,created_at,last_login";
async function optionalAuth(req, res, next) {
  const header = req.get("authorization");
  if (!header) return next();
  if (!header.startsWith("Bearer ")) fail(401, "Invalid authorization header");
  let payload;
  try {
    payload = jwt.verify(header.slice(7), secret, {
      algorithms: ["HS256"],
      issuer: "educms",
      audience: "educms-web",
    });
  } catch {
    fail(401, "Your session has expired. Please sign in again.");
  }
  const user = (
    await db.query(
      `SELECT ${publicColumns},token_version FROM users WHERE user_id=$1`,
      [payload.sub],
    )
  ).rows[0];
  if (!user || !user.is_active || user.token_version !== payload.version)
    fail(401, "Session is no longer valid");
  delete user.token_version;
  req.user = user;
  next();
}
function authenticate(req, res, next) {
  if (!req.user) fail(401, "Please sign in");
  next();
}
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) fail(401, "Please sign in");
    if (!roles.includes(req.user.role))
      fail(403, "You do not have permission for this action");
    next();
  };
const canManage = (user) => ["admin", "editor"].includes(user?.role);
const canWrite = (user) => ["admin", "editor", "author"].includes(user?.role);
function checkPostAccess(user, post) {
  if (!canWrite(user) || (!canManage(user) && post.author_id !== user.user_id))
    fail(403, "You can only manage your own content");
}
module.exports = {
  optionalAuth,
  authenticate,
  authorize,
  canManage,
  canWrite,
  checkPostAccess,
  publicColumns,
};
