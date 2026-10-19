const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const request = require("supertest");
const url = process.env.TEST_DATABASE_URL;
const enabled = Boolean(url);
if (enabled && !new URL(url).pathname.endsWith("_test"))
  throw new Error(
    "Integration tests require a dedicated database whose name ends with _test",
  );
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  "educms-integration-test-secret-at-least-32-characters";
process.env.DATABASE_URL = url || "postgres://localhost/unused_test";
process.env.UPLOAD_DIR = path.resolve(".test-artifacts/uploads");
const app = require("../src/app");
const db = require("../src/config/database");
const bcrypt = require("bcryptjs");
const migrate = require("../src/database/migrate");
const tokens = {};
const ids = {};
let postId;
let versionId;
let mediaId;
const auth = (role) => ({ Authorization: `Bearer ${tokens[role]}` });
const post = (overrides = {}) => ({
  title: "Practical React learning",
  content:
    "<h2>React lesson</h2><p>Learn with examples.</p><script>alert(1)</script>",
  status: "draft",
  content_type: "article",
  tag_ids: [],
  ...overrides,
});
before(async () => {
  if (!enabled) return;
  await migrate();
  await migrate();
  await db.query(
    "TRUNCATE users,categories,tags,posts,comments,media,activity_log,post_versions,post_views,post_likes RESTART IDENTITY CASCADE",
  );
  const hash = await bcrypt.hash("TestPassword123!", 4);
  for (const role of ["admin", "editor", "author", "subscriber"]) {
    ids[role] = (
      await db.query(
        "INSERT INTO users(username,email,password_hash,role) VALUES($1,$2,$3,$1) RETURNING user_id",
        [role, `${role}@test.edu`, hash],
      )
    ).rows[0].user_id;
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: `${role}@test.edu`, password: "TestPassword123!" });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    tokens[role] = res.body.data.token;
  }
});
after(async () => {
  await db.pool.end();
});
test(
  "PostgreSQL API integration workflows",
  {
    skip:
      !enabled &&
      "Set TEST_DATABASE_URL to a dedicated PostgreSQL database ending in _test",
  },
  async (t) => {
    await t.test(
      "health and route errors are stable JSON responses",
      async () => {
        assert.equal((await request(app).get("/api/v1/health")).status, 200);
        assert.equal((await request(app).get("/api/v1/missing")).status, 404);
        assert.equal(
          (await request(app).get("/api/v1/posts/invalid")).status,
          422,
        );
        assert.equal(
          (await request(app).get("/api/v1/posts?page=-1")).status,
          422,
        );
      },
    );
    await t.test(
      "registration cannot grant an administrative role",
      async () => {
        const res = await request(app)
          .post("/api/v1/auth/register")
          .send({
            username: "newstudent",
            email: "newstudent@test.edu",
            password: "StudentPassword123!",
            role: "admin",
          });
        assert.equal(res.status, 201);
        assert.equal(res.body.data.user.role, "subscriber");
        assert.equal(res.body.data.user.password_hash, undefined);
        assert.equal(
          (
            await request(app)
              .post("/api/v1/auth/login")
              .send({ email: "admin@test.edu", password: "wrong" })
          ).status,
          401,
        );
      },
    );
    await t.test(
      "RBAC blocks anonymous, subscriber, and author publishing access",
      async () => {
        assert.equal(
          (await request(app).post("/api/v1/posts").send(post())).status,
          401,
        );
        assert.equal(
          (
            await request(app)
              .post("/api/v1/posts")
              .set(auth("subscriber"))
              .send(post())
          ).status,
          403,
        );
        assert.equal(
          (
            await request(app)
              .post("/api/v1/posts")
              .set(auth("author"))
              .send(post({ status: "published" }))
          ).status,
          403,
        );
        assert.equal(
          (await request(app).get("/api/v1/users").set(auth("editor"))).status,
          403,
        );
      },
    );
    await t.test(
      "authors create sanitized drafts with atomic first revision",
      async () => {
        const res = await request(app)
          .post("/api/v1/posts")
          .set(auth("author"))
          .send(post());
        assert.equal(res.status, 201, JSON.stringify(res.body));
        postId = res.body.data.post_id;
        assert.doesNotMatch(res.body.data.content, /script/);
        assert.equal(res.body.data.revision, 1);
        const versions = await request(app)
          .get(`/api/v1/posts/${postId}/versions`)
          .set(auth("author"));
        versionId = versions.body.data[0].version_id;
        assert.equal(versions.body.data.length, 1);
      },
    );
    await t.test(
      "private drafts are hidden by identifier, slug, and search",
      async () => {
        assert.equal(
          (await request(app).get(`/api/v1/posts/${postId}`)).status,
          404,
        );
        assert.equal(
          (
            await request(app)
              .get("/api/v1/posts/slug/practical-react-learning")
              .set(auth("subscriber"))
          ).status,
          404,
        );
        assert.equal(
          (await request(app).get("/api/v1/posts?status=draft")).body.data.items
            .length,
          0,
        );
        const res = await request(app)
          .get(`/api/v1/posts?author_id=${ids.author}&status=draft`)
          .set(auth("author"));
        assert.equal(res.body.data.items.length, 1);
        const other = await request(app)
          .post("/api/v1/posts")
          .set(auth("editor"))
          .send(post({ title: "Private editor draft" }));
        assert.equal(
          (
            await request(app)
              .get(`/api/v1/posts/${other.body.data.post_id}`)
              .set(auth("author"))
          ).status,
          404,
        );
        assert.equal(
          (
            await request(app)
              .put(`/api/v1/posts/${other.body.data.post_id}`)
              .set(auth("author"))
              .send(post({ revision: 1 }))
          ).status,
          403,
        );
      },
    );
    await t.test(
      "invalid tags roll back the whole content update",
      async () => {
        const res = await request(app)
          .put(`/api/v1/posts/${postId}`)
          .set(auth("author"))
          .send(
            post({ revision: 1, title: "Should roll back", tag_ids: [999999] }),
          );
        assert.equal(res.status, 422);
        const current = (
          await request(app).get(`/api/v1/posts/${postId}`).set(auth("author"))
        ).body.data;
        assert.equal(current.revision, 1);
        assert.equal(current.title, "Practical React learning");
      },
    );
    await t.test(
      "editors publish, stale edits fail, authors cannot modify published content",
      async () => {
        const res = await request(app)
          .put(`/api/v1/posts/${postId}`)
          .set(auth("editor"))
          .send(post({ revision: 1, status: "published" }));
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.ok(res.body.data.published_at);
        assert.equal(res.body.data.revision, 2);
        assert.equal(
          (
            await request(app)
              .put(`/api/v1/posts/${postId}`)
              .set(auth("editor"))
              .send(post({ revision: 1 }))
          ).status,
          409,
        );
        assert.equal(
          (
            await request(app)
              .put(`/api/v1/posts/${postId}`)
              .set(auth("author"))
              .send(post({ revision: 2 }))
          ).status,
          403,
        );
        assert.equal(
          (
            await request(app)
              .delete(`/api/v1/posts/${postId}`)
              .set(auth("author"))
          ).status,
          403,
        );
      },
    );
    await t.test(
      "search supports real filters and treats SQL payloads as data",
      async () => {
        assert.equal(
          (await request(app).get("/api/v1/posts?q=React&content_type=article"))
            .body.data.pagination.total,
          1,
        );
        assert.equal(
          (await request(app).get("/api/v1/posts").query({ q: "' OR 1=1 --" }))
            .status,
          200,
        );
        assert.equal(
          (await request(app).get(`/api/v1/posts/${postId}`)).status,
          200,
        );
      },
    );
    await t.test(
      "comments wait for moderation and require matching parents",
      async () => {
        const res = await request(app)
          .post("/api/v1/comments")
          .set(auth("subscriber"))
          .send({ post_id: postId, content: "This really helped me." });
        assert.equal(res.status, 201);
        ids.comment = res.body.data.comment_id;
        assert.equal(res.body.data.status, "pending");
        assert.equal(
          (await request(app).get(`/api/v1/comments?post_id=${postId}`)).body
            .data.items.length,
          0,
        );
        assert.equal(
          (
            await request(app)
              .patch(`/api/v1/comments/${ids.comment}/status`)
              .set(auth("author"))
              .send({ status: "approved" })
          ).status,
          403,
        );
        assert.equal(
          (
            await request(app)
              .patch(`/api/v1/comments/${ids.comment}/status`)
              .set(auth("editor"))
              .send({ status: "approved" })
          ).status,
          200,
        );
        assert.equal(
          (await request(app).get(`/api/v1/comments?post_id=${postId}`)).body
            .data.items.length,
          1,
        );
        assert.equal(
          (
            await request(app)
              .post("/api/v1/comments")
              .set(auth("subscriber"))
              .send({
                post_id: postId,
                parent_id: 999999,
                content: "Invalid reply",
              })
          ).status,
          422,
        );
        assert.equal(
          (
            await request(app)
              .put(`/api/v1/comments/${ids.comment}`)
              .set(auth("subscriber"))
              .send({ content: "Edited comment" })
          ).body.data.status,
          "pending",
        );
      },
    );
    await t.test(
      "views, idempotent like toggles, and analytics reflect stored events",
      async () => {
        assert.equal(
          (await request(app).post(`/api/v1/posts/${postId}/view`)).status,
          200,
        );
        const first = await request(app)
          .post(`/api/v1/posts/${postId}/like`)
          .set(auth("subscriber"));
        assert.equal(first.body.data.like_count, 1);
        const second = await request(app)
          .post(`/api/v1/posts/${postId}/like`)
          .set(auth("subscriber"));
        assert.equal(second.body.data.like_count, 0);
        const res = await request(app)
          .get("/api/v1/analytics")
          .set(auth("admin"));
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.total_views, 1);
        assert.equal(res.body.data.daily_views.length, 30);
        const own = await request(app)
          .get("/api/v1/analytics")
          .set(auth("author"));
        assert.equal(own.status, 200, JSON.stringify(own.body));
        assert.equal(own.body.data.scope, "own");
        assert.equal(own.body.data.total_posts, 1);
        assert.equal(
          (await request(app).get("/api/v1/analytics").set(auth("subscriber")))
            .status,
          403,
        );
      },
    );
    await t.test(
      "restoring versions creates a new draft and preserves history",
      async () => {
        const res = await request(app)
          .post(`/api/v1/posts/${postId}/versions/${versionId}/restore`)
          .set(auth("editor"))
          .send({ revision: 2 });
        assert.equal(res.status, 200);
        assert.equal(res.body.data.revision, 3);
        assert.equal(res.body.data.status, "draft");
        assert.equal(
          (
            await request(app)
              .get(`/api/v1/posts/${postId}/versions`)
              .set(auth("author"))
          ).body.data.length,
          3,
        );
        assert.equal(
          (await request(app).get(`/api/v1/posts/${postId}`)).status,
          404,
        );
      },
    );
    await t.test(
      "restoring a version tolerates a deleted category",
      async () => {
        const category = (
          await request(app)
            .post("/api/v1/categories")
            .set(auth("editor"))
            .send({ name: "Temporary category" })
        ).body.data;
        const draft = (
          await request(app)
            .post("/api/v1/posts")
            .set(auth("editor"))
            .send(
              post({
                title: "Historical category example",
                category_id: category.category_id,
              }),
            )
        ).body.data;
        const history = (
          await request(app)
            .get(`/api/v1/posts/${draft.post_id}/versions`)
            .set(auth("editor"))
        ).body.data;
        assert.equal(
          (
            await request(app)
              .delete(`/api/v1/categories/${category.category_id}`)
              .set(auth("editor"))
          ).status,
          200,
        );
        const restored = await request(app)
          .post(
            `/api/v1/posts/${draft.post_id}/versions/${history[0].version_id}/restore`,
          )
          .set(auth("editor"))
          .send({ revision: 1 });
        assert.equal(restored.status, 200, JSON.stringify(restored.body));
        assert.equal(restored.body.data.category_id, null);
      },
    );
    await t.test(
      "deleting an account keeps published content like counts accurate",
      async () => {
        const person = await request(app)
          .post("/api/v1/users")
          .set(auth("admin"))
          .send({
            username: "temporary_reader",
            email: "reader@test.edu",
            password: "ReaderPassword123!",
            role: "subscriber",
          });
        assert.equal(person.status, 201);
        const session = await request(app)
          .post("/api/v1/auth/login")
          .send({ email: "reader@test.edu", password: "ReaderPassword123!" });
        const published = (
          await request(app)
            .post("/api/v1/posts")
            .set(auth("editor"))
            .send(
              post({
                title: "Counting likes consistently",
                status: "published",
              }),
            )
        ).body.data;
        assert.equal(
          (
            await request(app)
              .post(`/api/v1/posts/${published.post_id}/like`)
              .set("Authorization", `Bearer ${session.body.data.token}`)
          ).body.data.like_count,
          1,
        );
        assert.equal(
          (
            await request(app)
              .delete(`/api/v1/users/${person.body.data.user_id}`)
              .set(auth("admin"))
          ).status,
          200,
        );
        assert.equal(
          (await request(app).get(`/api/v1/posts/${published.post_id}`)).body
            .data.like_count,
          0,
        );
      },
    );
    await t.test(
      "category hierarchy cannot contain cycles and taxonomy CRUD works",
      async () => {
        const a = await request(app)
          .post("/api/v1/categories")
          .set(auth("editor"))
          .send({ name: "Science" });
        assert.equal(a.status, 201);
        ids.category = a.body.data.category_id;
        const b = await request(app)
          .post("/api/v1/categories")
          .set(auth("editor"))
          .send({ name: "Physics", parent_id: ids.category });
        assert.equal(b.status, 201);
        const cycle = await request(app)
          .put(`/api/v1/categories/${ids.category}`)
          .set(auth("editor"))
          .send({ name: "Science", parent_id: b.body.data.category_id });
        assert.equal(cycle.status, 422);
        const tag = await request(app)
          .post("/api/v1/tags")
          .set(auth("editor"))
          .send({ name: "Experiment" });
        assert.equal(tag.status, 201);
        assert.equal(
          (
            await request(app)
              .put(`/api/v1/tags/${tag.body.data.tag_id}`)
              .set(auth("editor"))
              .send({ name: "Laboratory" })
          ).status,
          200,
        );
        assert.equal(
          (
            await request(app)
              .delete(`/api/v1/tags/${tag.body.data.tag_id}`)
              .set(auth("editor"))
          ).status,
          200,
        );
        assert.equal(
          (
            await request(app)
              .delete(`/api/v1/categories/${ids.category}`)
              .set(auth("editor"))
          ).status,
          200,
        );
      },
    );
    await t.test(
      "uploads validate real signatures and enforce ownership",
      async () => {
        const fake = await request(app)
          .post("/api/v1/media")
          .set(auth("author"))
          .attach("file", Buffer.from("<script>bad</script>"), {
            filename: "image.png",
            contentType: "image/png",
          });
        assert.equal(fake.status, 415);
        const png = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jN0kAAAAASUVORK5CYII=",
          "base64",
        );
        const valid = await request(app)
          .post("/api/v1/media")
          .set(auth("author"))
          .field("alt_text", "A learning diagram")
          .attach("file", png, {
            filename: "diagram.png",
            contentType: "image/png",
          });
        assert.equal(valid.status, 201, JSON.stringify(valid.body));
        mediaId = valid.body.data.media_id;
        assert.equal(
          (await request(app).get(valid.body.data.file_path)).status,
          200,
        );
        assert.equal(
          (
            await request(app)
              .post("/api/v1/media")
              .set(auth("subscriber"))
              .attach("file", png, "diagram.png")
          ).status,
          403,
        );
        const other = await request(app)
          .post("/api/v1/media")
          .set(auth("editor"))
          .attach("file", png, "editor.png");
        assert.equal(
          (
            await request(app)
              .delete(`/api/v1/media/${other.body.data.media_id}`)
              .set(auth("author"))
          ).status,
          403,
        );
        assert.equal(
          (
            await request(app)
              .patch(`/api/v1/media/${mediaId}`)
              .set(auth("author"))
              .send({ alt_text: "Updated description", caption: "A diagram" })
          ).status,
          200,
        );
        assert.equal(
          (
            await request(app)
              .delete(`/api/v1/media/${mediaId}`)
              .set(auth("author"))
          ).status,
          200,
        );
      },
    );
    await t.test(
      "role changes and logout immediately revoke existing tokens",
      async () => {
        assert.equal(
          (
            await request(app)
              .patch(`/api/v1/users/${ids.admin}`)
              .set(auth("admin"))
              .send({ role: "subscriber", is_active: false })
          ).status,
          422,
        );
        assert.equal(
          (
            await request(app)
              .patch(`/api/v1/users/${ids.subscriber}`)
              .set(auth("admin"))
              .send({ role: "author", is_active: true })
          ).status,
          200,
        );
        assert.equal(
          (await request(app).get("/api/v1/auth/me").set(auth("subscriber")))
            .status,
          401,
        );
        assert.equal(
          (await request(app).post("/api/v1/auth/logout").set(auth("author")))
            .status,
          200,
        );
        assert.equal(
          (await request(app).get("/api/v1/auth/me").set(auth("author")))
            .status,
          401,
        );
      },
    );
    await t.test(
      "editors delete content with dependent versions and comments",
      async () => {
        assert.equal(
          (
            await request(app)
              .delete(`/api/v1/posts/${postId}`)
              .set(auth("editor"))
          ).status,
          200,
        );
        assert.equal(
          (
            await db.query("SELECT * FROM post_versions WHERE post_id=$1", [
              postId,
            ])
          ).rowCount,
          0,
        );
        assert.equal(
          (await db.query("SELECT * FROM comments WHERE post_id=$1", [postId]))
            .rowCount,
          0,
        );
        await fs.rm(process.env.UPLOAD_DIR, { recursive: true, force: true });
      },
    );
  },
);
