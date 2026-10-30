import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
for (const [sample, destination] of [
  ["apps/api/.env.example", "apps/api/.env"],
  ["apps/web/.env.example", "apps/web/.env.local"],
]) {
  const target = new URL(destination, root);
  if (existsSync(target)) {
    console.log(`${destination} existe déjà, conservé.`);
    continue;
  }
  const content = readFileSync(new URL(sample, root), "utf8").replace(
    "replace-this-with-a-random-secret-of-at-least-32-characters",
    randomBytes(48).toString("hex"),
  );
  writeFileSync(target, content, { mode: 0o600 });
  console.log(`${fileURLToPath(target)} créé.`);
}
