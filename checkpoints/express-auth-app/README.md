# Task Manager REST API

Secure Express + MongoDB API with JWT cookie authentication and optional Google OAuth.

## Setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI` and a strong `JWT_SECRET`.
2. Run `npm install`.
3. Run `npm start`.

## Endpoints

- `POST /auth/signup` — `{ name, email, password }`
- `POST /auth/login` — `{ email, password }` (rate limited)
- `POST /auth/logout`
- `GET /auth/google` and `/auth/google/callback` (configure Google variables)
- `POST /tasks` — `{ title, description?, completed? }` (authenticated)
- `GET /tasks` (authenticated)
- `DELETE /tasks/:id` (authenticated, owner only)

JWTs are issued only in the HTTP-only `jwt` cookie; protected routes also accept a `Bearer` token to support API clients. Set `NODE_ENV=production` behind HTTPS so the cookie gains the `Secure` attribute.

All routes are also available under the `/api` prefix.
