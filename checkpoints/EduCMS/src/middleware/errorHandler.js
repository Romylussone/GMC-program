const logger = require("../utils/logger");
module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  let status = err.status || 500;
  let message = err.message;
  if (err.code === "23505") {
    status = 409;
    message = "That email, username, name, or slug is already in use";
  }
  if (err.code === "23503") {
    status = 422;
    message = "A referenced record does not exist or is still in use";
  }
  if (err.code === "22P02" || err.code === "22001" || err.code === "23514") {
    status = 422;
    message = "Invalid field value";
  }
  if (err.name === "MulterError") {
    status = err.code === "LIMIT_FILE_SIZE" ? 413 : 422;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File exceeds the upload size limit"
        : "Invalid upload request";
  }
  if (status >= 500) {
    logger.error("Request failed", { message: err.message, path: req.path });
    message = "An unexpected error occurred";
  }
  res.status(status).json({ success: false, message });
};
