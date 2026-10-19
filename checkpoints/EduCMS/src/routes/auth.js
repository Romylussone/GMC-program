const router = require("express").Router();
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { rateLimit } = require("express-rate-limit");
const db = require("../config/database");
const { secret } = require("../config/env");
const { body, validate } = require("../middleware/validation");
const { authenticate, publicColumns } = require("../middleware/auth");
const { fail, success } = require("../utils/helpers");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Try again in 15 minutes.",
  },
});
const token = (user) =>
  jwt.sign({ version: user.token_version }, secret, {
    subject: String(user.user_id),
    expiresIn: process.env.JWT_EXPIRE || "1h",
    issuer: "educms",
    audience: "educms-web",
  });
router.post(
  "/register",
  limiter,
  body("username").matches(/^[a-zA-Z0-9_]{3,50}$/),
  body("email").isEmail().isLength({ max: 100 }).normalizeEmail(),
  body("password").isString().isLength({ min: 10, max: 72 }),
  body("first_name").optional().isString().trim().isLength({ max: 50 }),
  body("last_name").optional().isString().trim().isLength({ max: 50 }),
  validate,
  async (req, res) => {
    const { username, email, password, first_name, last_name } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const user = (
      await db.query(
        `INSERT INTO users(username,email,password_hash,first_name,last_name) VALUES($1,$2,$3,$4,$5) RETURNING ${publicColumns},token_version`,
        [username, email, hash, first_name || "", last_name || ""],
      )
    ).rows[0];
    const accessToken = token(user);
    delete user.token_version;
    success(res, { user, token: accessToken }, 201);
  },
);
// A real hash makes failed account lookup and failed password checks take similar time.
const dummyHash = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 12);
router.post(
  "/login",
  limiter,
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 1, max: 72 }),
  validate,
  async (req, res) => {
    const user = (
      await db.query(
        `SELECT ${publicColumns},password_hash,token_version FROM users WHERE email=$1`,
        [req.body.email],
      )
    ).rows[0];
    const valid = await bcrypt.compare(
      req.body.password,
      user?.password_hash || dummyHash,
    );
    if (!user || !valid || !user.is_active)
      fail(401, "Invalid email or password");
    await db.query("UPDATE users SET last_login=NOW() WHERE user_id=$1", [
      user.user_id,
    ]);
    const accessToken = token(user);
    delete user.password_hash;
    delete user.token_version;
    res.set("Cache-Control", "no-store");
    success(res, { user, token: accessToken });
  },
);
router.get("/me", authenticate, (req, res) => success(res, req.user));
router.post("/logout", authenticate, async (req, res) => {
  await db.query(
    "UPDATE users SET token_version=token_version+1 WHERE user_id=$1",
    [req.user.user_id],
  );
  success(res, { loggedOut: true });
});
router.patch(
  "/password",
  authenticate,
  body("current_password").isString().isLength({ min: 1, max: 72 }),
  body("password").isString().isLength({ min: 10, max: 72 }),
  validate,
  async (req, res) => {
    const user = (
      await db.query("SELECT password_hash FROM users WHERE user_id=$1", [
        req.user.user_id,
      ])
    ).rows[0];
    if (!(await bcrypt.compare(req.body.current_password, user.password_hash)))
      fail(401, "Current password is incorrect");
    await db.query(
      "UPDATE users SET password_hash=$1,token_version=token_version+1 WHERE user_id=$2",
      [await bcrypt.hash(req.body.password, 12), req.user.user_id],
    );
    success(res, { message: "Password changed. Please sign in again." });
  },
);
module.exports = router;
