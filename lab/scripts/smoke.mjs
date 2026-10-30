import assert from "node:assert/strict";
const base = process.env.SMOKE_URL || "http://localhost:3100";
async function read(path, options) {
  const response = await fetch(`${base}${path}`, options);
  assert.equal(response.status, 200, `${path} : HTTP ${response.status}`);
  return response;
}
const health = await (await read("/api/health")).json();
assert.equal(health.database, "MongoDB");
const properties = await (await read("/api/properties?limit=3")).json();
assert.ok(Array.isArray(properties.items));
for (const path of [
  "/",
  "/biens",
  "/connexion",
  "/inscription",
  "/espace",
  "/espace/annonces/nouveau",
])
  await read(path);
if (properties.items[0]) await read(`/biens/${properties.items[0]._id}`);
const login = await read("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: new URL(base).origin },
  body: JSON.stringify({
    email: process.env.SMOKE_EMAIL || "client@artparts.ci",
    password: process.env.DEMO_PASSWORD || "Artparts2026!",
  }),
});
const cookie = login.headers
  .getSetCookie()
  .map((value) => value.split(";")[0])
  .join("; ");
assert.ok(cookie.includes("artparts_session="));
const me = await (
  await read("/api/auth/me", { headers: { Cookie: cookie } })
).json();
assert.equal(me.email, process.env.SMOKE_EMAIL || "client@artparts.ci");
assert.equal(me.password, undefined);
await read("/api/me/favorites", { headers: { Cookie: cookie } });
await read("/api/me/recommendations", { headers: { Cookie: cookie } });
console.log(
  "Vérifications HTTP réussies : pages, proxy Next.js, MongoDB, connexion, cookie, favoris et recommandations.",
);
