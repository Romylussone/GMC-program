const multer = require("multer");
const fs = require("node:fs/promises");
const crypto = require("node:crypto");
const path = require("node:path");
const { uploadDir, maxFileSize } = require("../config/env");
const { fail } = require("../utils/helpers");
const mimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSize,
    files: 1,
    fields: 3,
    fieldSize: 10000,
    parts: 4,
  },
  fileFilter(req, file, cb) {
    if (!mimeTypes.includes(file.mimetype))
      return cb(
        Object.assign(new Error("Upload a JPEG, PNG, GIF, WebP, or PDF file"), {
          status: 415,
        }),
      );
    cb(null, true);
  },
});
async function saveFile(file) {
  if (!file) fail(422, "Choose a file to upload");
  const b = file.buffer;
  let type;
  if (
    b.length > 8 &&
    b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    type = ["png", "image/png"];
  else if (b.length > 3 && b[0] === 255 && b[1] === 216 && b[2] === 255)
    type = ["jpg", "image/jpeg"];
  else if (["GIF87a", "GIF89a"].includes(b.subarray(0, 6).toString()))
    type = ["gif", "image/gif"];
  else if (
    b.subarray(0, 4).toString() === "RIFF" &&
    b.subarray(8, 12).toString() === "WEBP"
  )
    type = ["webp", "image/webp"];
  else if (b.subarray(0, 5).toString() === "%PDF-")
    type = ["pdf", "application/pdf"];
  if (!type || type[1] !== file.mimetype)
    fail(415, "File contents do not match the declared type");
  await fs.mkdir(uploadDir, { recursive: true });
  const filename = `${crypto.randomUUID()}.${type[0]}`;
  await fs.writeFile(path.join(uploadDir, filename), b, { flag: "wx" });
  return { filename, mime: type[1] };
}
module.exports = { upload, saveFile };
