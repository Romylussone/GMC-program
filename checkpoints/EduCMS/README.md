# EduCMS

A full-stack educational CMS built with Express, PostgreSQL, React, and Material UI. Courses, articles, announcements, and resources share a searchable content library and publishing workflow.

## Run locally

Requirements: **Node.js 22.12+** (Node 24 LTS recommended), npm, and PostgreSQL 13+. Docker Compose can provide PostgreSQL 16 and optional Redis 7. Redis is not required.

```powershell
npm ci
Copy-Item .env.example .env
# Edit .env: set a random JWT_SECRET of at least 32 characters.
docker compose up -d db
npm run migrate
npm run seed
npm run dev
```

Open **http://localhost:5173**. The API runs at **http://localhost:5000/api/v1**. If `.env` already exists, keep it. This workspace's prepared `.env` uses PostgreSQL port **55433** to avoid colliding with other projects; `docker compose up -d db` reads that setting automatically.

The prepared workspace uses application port **5080** because another local service occupies port 5000. The built app is available at **http://localhost:5080**. Vite reads `PORT` from the root `.env` for its API proxy. Update the Postman `baseUrl` to match your configured port.

The development seed creates `admin@educms.com`, `editor@educms.com`, `author@educms.com`, and `subscriber@educms.com`. Their initial password is the `SEED_PASSWORD` value in `.env` (example: `ChangeMe123!`). Seeding is idempotent, does not reset existing passwords, and is disabled in production. Use Settings to change your password.

For an existing PostgreSQL installation, create an empty database and set `DATABASE_URL`. Migrations are transactional, tracked, and protected against simultaneous execution. They do **not** drop existing tables. An existing schema matching the prompt needs a separately reviewed migration; the initial migration expects an empty database.

## What is implemented

- JWT sign-in, subscriber registration, profile and password changes, server-side session revocation, inactive-account checks, and login throttling.
- CRUD for educational content, categories, tags, comments, users, and media. Parent categories reject cycles; threaded comments must belong to the same post.
- Draft, published, and archived content. Atomic content and tag updates, stored revisions, revision conflict checks, and restoration as a new draft.
- HTML sanitization, SEO title/description/keywords, generated slugs, excerpts, reading times, featured images, and public previews of published content.
- Search by title, full-text content, category, tag, author, type, and status; sorting and paginated API lists.
- File uploads using Multer with size limits, type allowlists, signature checks, random filenames, ownership checks, alt text, and captions. Files in current content cannot be deleted.
- Dashboard and analytics from actual records: content counts, views, likes, comments, daily readership, category distribution, and activity history. Authors see their own analytics.
- Responsive admin workspace, public learning library, and comment moderation. Optional Redis caches the administrator's user count for 30 seconds and falls back to PostgreSQL if unavailable.

## Permissions

| Action                   | Admin | Editor | Author              | Subscriber / public   |
| ------------------------ | ----- | ------ | ------------------- | --------------------- |
| Read published content   | Yes   | Yes    | Yes                 | Yes                   |
| Create content           | Yes   | Yes    | Own drafts          | No                    |
| Read unpublished content | All   | All    | Own                 | No                    |
| Edit/delete content      | All   | All    | Own drafts          | No                    |
| Publish/archive/feature  | Yes   | Yes    | No                  | No                    |
| View/restore versions    | All   | All    | Own; restore drafts | No                    |
| Manage categories/tags   | Yes   | Yes    | No                  | Read                  |
| Upload/manage media      | All   | All    | Own                 | No                    |
| Moderate comments        | Yes   | Yes    | No                  | No                    |
| Comment/like             | Yes   | Yes    | Yes                 | Signed-in subscribers |
| Manage users             | Yes   | No     | No                  | No                    |

Authors' edits to published content require an editor. A restored version becomes a draft and is removed from public listings until republished. Content deletion permanently removes its comments, versions, views, and likes. User deletion keeps their content and comments, with the author shown as a former user.

## API

Every endpoint uses `/api/v1`. Send `Authorization: Bearer <token>` for authenticated actions. JSON responses have `{ success, data }` or `{ success: false, message, errors? }`. Lists return `{ items, pagination }`, except categories, tags, and versions which return arrays.

| Routes                                                                         | Purpose                                     |
| ------------------------------------------------------------------------------ | ------------------------------------------- |
| `GET /health`                                                                  | PostgreSQL health check                     |
| `POST /auth/register`, `POST /auth/login`                                      | Create subscriber / sign in                 |
| `GET /auth/me`, `POST /auth/logout`, `PATCH /auth/password`                    | Account and sessions                        |
| `GET,POST /posts`; `GET,PUT,DELETE /posts/:id`                                 | Content CRUD                                |
| `GET /posts/slug/:slug`                                                        | Fetch readable content by slug              |
| `GET /posts/:id/versions`                                                      | Saved snapshots                             |
| `POST /posts/:id/versions/:versionId/restore`                                  | Restore a snapshot; send current `revision` |
| `POST /posts/:id/view`, `POST /posts/:id/like`                                 | Count a view / toggle authenticated like    |
| `GET,POST /categories`, `/tags`; `GET,PUT,DELETE /categories/:id`, `/tags/:id` | Taxonomy CRUD                               |
| `GET,POST /comments`; `PUT,DELETE /comments/:id`; `PATCH /comments/:id/status` | Comments and moderation                     |
| `GET,POST /media`; `PATCH,DELETE /media/:id`                                   | Media; upload multipart field `file`        |
| `GET,POST /users`; `GET,PATCH,DELETE /users/:id`; `PATCH /users/me`            | Admin accounts and own profile              |
| `GET /analytics`, `GET /analytics/activity`                                    | Dashboard and audit history                 |

`GET /posts` accepts `q`, `status`, `content_type`, `category_id`, `tag_id`, `author_id`, `mine=true`, `sort=newest|oldest|title|views`, `page`, and `limit` (1–100). Public queries always exclude unpublished content. `PUT /posts/:id` requires the current `revision` and complete content fields; stale revisions return `409`. See [the Postman collection](docs/EduCMS.postman_collection.json) for runnable examples.

## Verify

```powershell
npm run check
npm run build
npm audit
```

Unit tests run with `npm test`. For integration tests, supply a **dedicated disposable PostgreSQL database whose name ends in `_test`**. Integration tests truncate data in that database; they are explicitly skipped without `TEST_DATABASE_URL`.

```powershell
docker run --name educms-postgres-test -e POSTGRES_USER=educms -e POSTGRES_PASSWORD=educms_test -e POSTGRES_DB=educms_test -p 127.0.0.1:55432:5432 -d postgres:16-alpine
$env:TEST_DATABASE_URL='postgres://educms:educms_test@localhost:55432/educms_test'
npm test
```

The suite verifies authentication, privilege restrictions, unpublished-content visibility, transactional rollback, revision conflicts and restore, search, moderation, taxonomy cycles, file validation and ownership, analytics, and token revocation against real PostgreSQL.

## Build and deployment

```powershell
npm run build
$env:NODE_ENV='production'
npm start
```

Express serves `client/dist` and supports React route refreshes. Set a strong unique `JWT_SECRET`, production `DATABASE_URL`, and the exact `FRONTEND_URL`. Use HTTPS at your reverse proxy. The server does not implicitly trust forwarded IP headers; configure Express `trust proxy` for your actual proxy topology before relying on IP rate limiting behind a proxy. Persist and back up both PostgreSQL and `UPLOAD_DIR`.

Access tokens expire after one hour by default and are held in browser session storage. Logout revokes all sessions for that account; password and role changes do the same. No refresh-token or email-delivery flow is included. Email verification is not enforced. Static uploads are public by URL and should contain public learning materials. PDFs download as attachments; SVG and HTML uploads are rejected. Stored versions can reference older media paths, so deleting unreferenced media can remove an image used only by an old revision.

SEO fields update the browser document metadata. Search-engine-specific server rendering, sitemap generation, unique-visitor analytics, and bot filtering are not implemented. View counts record page openings, including repeat visits, rather than unique readers. The supplied database's user-statistics join inflation is corrected using independent aggregates.

## Layout

```text
client/src/       React workspace and public library
src/config/      Environment, PostgreSQL connection pool
src/database/    SQL migrations and development seed
src/middleware/  JWT authorization, validation, uploads, errors
src/routes/      REST API workflows
src/services/    Optional cache and transactional activity log
src/utils/       HTML sanitation, slugs, pagination, logging
tests/           Unit and real PostgreSQL integration tests
docs/            Postman collection
```

Routes own the small API workflows directly; database transactions keep authorization checks, writes, revisions, and activity records together. All user values are parameterized; dynamic SQL identifiers and sorting expressions come only from application-owned allowlists.
