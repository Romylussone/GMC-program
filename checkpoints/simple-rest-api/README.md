# Simple REST API

A commented Node.js checkpoint project using Express, Mongoose, and dotenv to create, read, update, and delete MongoDB users.

## Project structure

```text
config/
  .env                 # Local configuration; ignored by Git
  .env.example         # Configuration template
models/
  User.js              # Mongoose schema and exported User model
postman/
  users.postman_collection.json
server.js              # Express server, MongoDB connection, and four routes
package.json
package-lock.json
```

## Setup and start

Requires Node.js 20.19+ and either local MongoDB or MongoDB Atlas. The project was initialized with `npm init -y`; install dependencies with:

```sh
npm install
```

If `config/.env` does not exist, copy `config/.env.example` to `config/.env` and set:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27018/simple_rest_api
PORT=5050
```

For a local MongoDB instance using Docker:

```sh
docker run -d --name simple-rest-api-mongo -p 127.0.0.1:27018:27017 -v simple-rest-api-mongo-data:/data/db mongo:8.0
```

This command creates a persistent database volume. If the container already exists but is stopped, use `docker start simple-rest-api-mongo`. A standard local MongoDB installation usually listens on port `27017`; adjust `MONGO_URI` accordingly. For Atlas, replace `MONGO_URI` with your cluster connection string and configure its database user and network access. Keep credentials in the ignored `.env` file.

Start the server:

```sh
npm start
```

Use `npm run dev` for automatic restarts while editing. The server connects to MongoDB and initializes the unique email index before accepting requests at `http://localhost:5050`.

## Routes

| Method | Endpoint | Result | Mongoose method |
| --- | --- | --- | --- |
| GET | `/users` | `200`, array of all users | `User.find()` |
| POST | `/users` | `201`, newly created user | `User.create()` |
| PUT | `/users/:id` | `200`, updated user | `User.findByIdAndUpdate()` |
| DELETE | `/users/:id` | `200`, deleted user | `User.findByIdAndDelete()` |

For POST, send **Body → raw → JSON** with `Content-Type: application/json`:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "age": 30
}
```

Name and email are required. Email is trimmed, lowercased, and unique. Age is optional and must be an integer from 0 to 150. MongoDB generates `_id`; timestamps are added automatically. Copy the returned `_id` into the PUT and DELETE URLs.

PUT updates only the supplied fields and preserves omitted fields. For example, send `{"name":"Ada Updated","age":31}` to `/users/<returned _id>`.

Invalid input or malformed IDs return `400`, missing users return `404`, and duplicate emails return `409`. Error bodies use `{"message":"..."}`.

## Test with Postman

1. Keep MongoDB and the API running.
2. Import `postman/users.postman_collection.json` into Postman.
3. Set the collection variable `baseUrl` if you changed the API port.
4. Run the entire collection in order with the Collection Runner.

Alternatively, with Postman CLI installed:

```sh
npm test
```

For a different port:

```sh
postman collection run postman/users.postman_collection.json --env-var baseUrl=http://localhost:5051 --no-report-events
```

The collection performs 15 requests with assertions for all four routes, persisted creation/update/deletion, duplicate emails, required fields, malformed JSON, update validation, rejected MongoDB operators, invalid IDs, and missing users. It generates a unique test email, saves the created `_id` automatically, and deletes its test user before checking missing-user responses. Existing users are left untouched. If a run is interrupted, delete any remaining `checkpoint-...@example.com` test user manually.

Implementation references: [Mongoose update validation](https://mongoosejs.com/docs/validation) and [running a collection with Postman CLI](https://learning.postman.com/docs/postman-cli/postman-cli-run-collection).
