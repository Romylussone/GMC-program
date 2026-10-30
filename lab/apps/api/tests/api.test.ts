import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";
import { randomUUID } from "node:crypto";

process.env.JWT_SECRET = "test-secret-only-not-for-production-123456789";
process.env.NODE_ENV = "test";
const { createApp } = await import("../src/app.js");
const { User, Property, Lead, Appointment } = await import("../src/models.js");
const { scoreProperty } = await import("../src/recommendations.js");
const app = createApp();
const owner = request.agent(app);
const client = request.agent(app);
const other = request.agent(app);
const database = `artparts_test_${randomUUID().replaceAll("-", "")}`;
let propertyId: string;
let draftId: string;
const listing = {
  title: "Villa de test à Cocody",
  description:
    "Une villa de test avec un jardin, située dans un quartier calme.",
  transaction: "rent",
  type: "villa",
  price: 350000,
  area: 180,
  bedrooms: 3,
  bathrooms: 2,
  city: "Abidjan",
  district: "Cocody",
  address: "Cocody, Abidjan",
  latitude: 5.35,
  longitude: -3.98,
  images: ["https://example.com/villa.jpg"],
  panorama: "",
  amenities: ["Jardin"],
  status: "published",
};
before(async () => {
  await mongoose.connect(
    process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017",
    { dbName: database, serverSelectionTimeoutMS: 10000 },
  );
  await Promise.all([
    User.init(),
    Property.init(),
    Lead.init(),
    Appointment.init(),
  ]);
  for (const [agent, email, role] of [
    [owner, "owner@test.ci", "owner"],
    [client, "client@test.ci", "seeker"],
    [other, "other@test.ci", "agency"],
  ] as const) {
    const result = await agent.post("/api/auth/register").send({
      name: "Compte Test",
      email,
      password: "TestPassword2026!",
      role,
      phone: "+2250700000000",
    });
    assert.equal(result.status, 201);
  }
  const created = await owner.post("/api/properties").send(listing);
  assert.equal(created.status, 201);
  propertyId = created.body._id;
  const draft = await owner
    .post("/api/properties")
    .send({ ...listing, title: "Brouillon secret", status: "draft" });
  assert.equal(draft.status, 201);
  draftId = draft.body._id;
});
after(async () => {
  if (
    mongoose.connection.db?.databaseName === database &&
    database.startsWith("artparts_test_")
  )
    await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
test("les sessions sont protégées et le mot de passe ne sort pas de l’API", async () => {
  assert.equal((await request(app).get("/api/auth/me")).status, 401);
  const me = await client.get("/api/auth/me");
  assert.equal(me.status, 200);
  assert.equal(me.body.password, undefined);
  const stored = await User.findOne({ email: "client@test.ci" }).select(
    "+password",
  );
  assert.ok(stored!.password.startsWith("$2"));
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: "client@test.ci", password: "TestPassword2026!" });
  assert.equal(login.status, 200);
  assert.match(login.headers["set-cookie"][0], /HttpOnly/);
  assert.match(login.headers["set-cookie"][0], /SameSite=Lax/);
  assert.equal(
    (
      await request(app)
        .post("/api/auth/login")
        .send({ email: "client@test.ci", password: "WrongPassword!" })
    ).status,
    401,
  );
});
test("les doublons et les origines étrangères sont refusés", async () => {
  assert.equal(
    (
      await request(app).post("/api/auth/register").send({
        name: "Test",
        email: "client@test.ci",
        password: "TestPassword2026!",
        role: "seeker",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await client
        .post("/api/auth/logout")
        .set("Origin", "https://evil.example")
    ).status,
    403,
  );
});
test("les clients ne peuvent pas publier et un autre professionnel ne peut pas modifier", async () => {
  assert.equal(
    (await client.post("/api/properties").send(listing)).status,
    403,
  );
  assert.equal(
    (await other.patch(`/api/properties/${propertyId}`).send({ price: 1 }))
      .status,
    404,
  );
  assert.equal(
    (await other.delete(`/api/properties/${propertyId}`)).status,
    404,
  );
});
test("les brouillons et les données privées sont absents du catalogue", async () => {
  const list = await request(app).get("/api/properties");
  assert.equal(list.body.total, 1);
  assert.equal(list.body.items[0].owner.email, undefined);
  assert.equal(list.body.items[0].owner.password, undefined);
  assert.equal(
    (await request(app).get(`/api/properties/${draftId}`)).status,
    404,
  );
  assert.equal((await owner.get("/api/me/properties")).body.length, 2);
});
test("la recherche applique les filtres, valide les nombres et échappe les expressions régulières", async () => {
  assert.equal(
    (
      await request(app).get(
        "/api/properties?q=cocody&maxPrice=400000&bedrooms=2",
      )
    ).body.total,
    1,
  );
  assert.equal(
    (await request(app).get("/api/properties?maxPrice=1000")).body.total,
    0,
  );
  assert.equal((await request(app).get("/api/properties?q=.*")).body.total, 0);
  assert.equal(
    (await request(app).get("/api/properties?maxPrice=abc")).status,
    400,
  );
  assert.equal((await request(app).get("/api/properties?page=-1")).status, 400);
});
test("les favoris sont persistants, idempotents et propres au compte", async () => {
  assert.equal(
    (await client.put(`/api/me/favorites/${propertyId}`)).status,
    204,
  );
  await client.put(`/api/me/favorites/${propertyId}`);
  assert.equal((await client.get("/api/me/favorites")).body.length, 1);
  assert.equal((await owner.get("/api/me/favorites")).body.length, 0);
  await client.delete(`/api/me/favorites/${propertyId}`);
  assert.equal((await client.get("/api/me/favorites")).body.length, 0);
});
test("la qualification et les notes restent réservées au propriétaire du prospect", async () => {
  const result = await client
    .post(`/api/properties/${propertyId}/leads`)
    .send({ message: "Bonjour, ce bien m’intéresse." });
  assert.equal(result.status, 201);
  const leadId = result.body._id;
  assert.equal(
    (await client.patch(`/api/leads/${leadId}`).send({ stage: "won" })).status,
    403,
  );
  assert.equal(
    (await other.patch(`/api/leads/${leadId}`).send({ stage: "won" })).status,
    404,
  );
  assert.equal(
    (
      await owner
        .patch(`/api/leads/${leadId}`)
        .send({ stage: "qualified", notes: "Note confidentielle" })
    ).status,
    200,
  );
  assert.equal(
    (await owner.get("/api/me/leads")).body[0].notes,
    "Note confidentielle",
  );
  assert.equal((await client.get("/api/me/leads")).body[0].notes, "");
  const repeat = await client
    .post(`/api/properties/${propertyId}/leads`)
    .send({ message: "Merci pour votre réponse." });
  assert.equal(repeat.body.notes, undefined);
  assert.equal((await owner.get("/api/me/leads")).body.length, 1);
  assert.equal(
    (
      await other
        .post(`/api/leads/${leadId}/messages`)
        .send({ message: "Intrusion" })
    ).status,
    404,
  );
  assert.equal(
    (
      await owner
        .post(`/api/leads/${leadId}/messages`)
        .send({ message: "Disponible pour une visite." })
    ).status,
    201,
  );
  assert.equal((await client.get("/api/me/leads")).body[0].messages.length, 3);
});
test("les créneaux sont uniques, contrôlés et réutilisables après annulation", async () => {
  const time = new Date(Date.now() + 2 * 86400000);
  time.setUTCHours(10, 0, 0, 0);
  const input = {
    propertyId,
    startsAt: time.toISOString(),
    message: "Visite souhaitée",
  };
  const first = await client.post("/api/appointments").send(input);
  assert.equal(first.status, 201);
  const duplicates = await Promise.all([
    client.post("/api/appointments").send(input),
    other.post("/api/appointments").send(input),
  ]);
  assert.ok(duplicates.every((r) => r.status === 409));
  assert.equal(
    (
      await client
        .patch(`/api/appointments/${first.body._id}`)
        .send({ status: "confirmed" })
    ).status,
    403,
  );
  assert.equal(
    (
      await other
        .patch(`/api/appointments/${first.body._id}`)
        .send({ status: "cancelled" })
    ).status,
    404,
  );
  assert.equal(
    (
      await owner
        .patch(`/api/appointments/${first.body._id}`)
        .send({ status: "confirmed" })
    ).status,
    200,
  );
  assert.equal(
    (
      await owner
        .patch(`/api/appointments/${first.body._id}`)
        .send({ status: "completed" })
    ).status,
    400,
  );
  assert.equal(
    (
      await client
        .patch(`/api/appointments/${first.body._id}`)
        .send({ status: "cancelled" })
    ).status,
    200,
  );
  assert.equal(
    (
      await owner
        .patch(`/api/appointments/${first.body._id}`)
        .send({ status: "confirmed" })
    ).status,
    409,
  );
  assert.equal(
    (await client.post("/api/appointments").send(input)).status,
    201,
  );
  time.setUTCMinutes(30);
  assert.equal(
    (
      await other
        .post("/api/appointments")
        .send({ ...input, startsAt: time.toISOString() })
    ).status,
    400,
  );
  assert.equal(
    (
      await other
        .post("/api/appointments")
        .send({ ...input, startsAt: "2020-01-01T10:00:00.000Z" })
    ).status,
    400,
  );
});
test("les préférences pilotent des recommandations explicables", async () => {
  const prefs = {
    city: "Abidjan",
    district: "Cocody",
    transaction: "rent",
    type: "villa",
    budget: 400000,
    bedrooms: 3,
  };
  assert.equal(
    (await client.patch("/api/me/preferences").send(prefs)).status,
    200,
  );
  const result = await client.get("/api/me/recommendations");
  assert.equal(result.body[0]._id, propertyId);
  assert.equal(result.body[0].score, 100);
  assert.ok(result.body[0].reasons.includes("Dans votre budget"));
  const poor = scoreProperty(
    {
      ...listing,
      price: 900000,
      district: "Autre",
      type: "office",
      bedrooms: 0,
    },
    prefs,
  );
  assert.ok(poor.score < 100);
});
test("les indicateurs commerciaux ne mélangent pas les propriétaires", async () => {
  const a = await owner.get("/api/me/stats");
  assert.equal(a.body.properties, 1);
  assert.equal(a.body.leads, 1);
  assert.equal(a.body.visits, 1);
  assert.equal(a.body.conversion, 0);
  assert.equal((await other.get("/api/me/stats")).body.leads, 0);
  assert.equal((await client.get("/api/me/stats")).status, 403);
});
test("les entrées invalides et les changements de propriétaire sont refusés", async () => {
  assert.equal(
    (
      await owner
        .patch(`/api/properties/${propertyId}`)
        .send({ owner: new mongoose.Types.ObjectId().toString() })
    ).status,
    400,
  );
  assert.equal(
    (await owner.patch(`/api/properties/${propertyId}`).send({ price: -1 }))
      .status,
    400,
  );
  assert.equal(
    (
      await owner
        .patch(`/api/properties/${propertyId}`)
        .send({ images: ["javascript:alert(1)"] })
    ).status,
    400,
  );
  assert.equal(
    (await request(app).get("/api/properties/invalid-id")).status,
    400,
  );
});
test("l’archivage masque l’annonce et conserve les échanges", async () => {
  assert.equal(
    (await owner.delete(`/api/properties/${propertyId}`)).status,
    204,
  );
  assert.equal(
    (await request(app).get(`/api/properties/${propertyId}`)).status,
    404,
  );
  assert.equal(
    (
      await client
        .post(`/api/properties/${propertyId}/leads`)
        .send({ message: "Nouveau message" })
    ).status,
    404,
  );
  assert.equal((await owner.get("/api/me/leads")).body.length, 1);
  assert.equal((await owner.get("/api/me/stats")).body.properties, 0);
});
test("la déconnexion invalide le cookie du navigateur", async () => {
  assert.equal((await client.post("/api/auth/logout")).status, 204);
  assert.equal((await client.get("/api/auth/me")).status, 401);
});
