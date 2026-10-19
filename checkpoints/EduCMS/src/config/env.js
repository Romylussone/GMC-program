require("dotenv").config();
const path = require("node:path");
const secret = process.env.JWT_SECRET;
if (
  !secret ||
  secret.length < 32 ||
  (process.env.NODE_ENV === "production" && secret.startsWith("replace-"))
) {
  throw new Error(
    "Set JWT_SECRET to a random secret of at least 32 characters.",
  );
}
module.exports = {
  port: Number(process.env.PORT || 5000),
  secret,
  uploadDir: path.resolve(process.env.UPLOAD_DIR || "./uploads"),
  maxFileSize: Number(process.env.MAX_FILE_SIZE || 5242880),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
