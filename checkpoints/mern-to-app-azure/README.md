# Daylist · MERN todo app

A simple todo app for the **Hosting a MERN App on Microsoft Azure** checkpoint. React provides the interface, Express provides the API, and MongoDB stores tasks. In production, Express also serves the built React frontend, so you only need one Azure Web App.

## Features

- Add, edit, complete, reopen, and delete tasks.
- Filter all, active, or completed tasks; clear completed tasks together.
- See task counts and completion progress.
- Responsive layout, keyboard controls, loading states, and retryable error messages.
- MongoDB persistence, validated API requests, environment-based credentials, and a database health endpoint.

This is a shared task board with no user accounts. Everyone who can access the app can read and change the same tasks. Use it for the checkpoint with non-sensitive example tasks; add authentication before using it as a private personal service.

## Run locally

Prerequisites: Node.js **20.19+** (Node 24 LTS recommended for Azure), npm, and either a running local MongoDB server or a MongoDB Atlas cluster.

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env`:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/daylist
PORT=5000
NODE_ENV=development
```

If using Atlas, replace `MONGODB_URI` with the connection string described below. Then:

```powershell
npm run dev
```

Open **http://localhost:5173**. Vite forwards `/api` requests to Express on port 5000. If you change `PORT`, also update the proxy target in `client/vite.config.js`.

Optional local MongoDB with Docker:

```powershell
docker run --name daylist-mongo -p 127.0.0.1:27017:27017 -v daylist-data:/data/db -d mongo:8
```

The named volume persists your tasks. Restart an existing container with `docker start daylist-mongo`.

## Test and run the production build

```powershell
npm test
npm run build
npm start
```

Open **http://localhost:5000** for the production build. `npm run build` generates `client/dist`, which Express serves automatically. Do not run Vite on Azure.

The API tests use a temporary, real MongoDB instance through `mongodb-memory-server`; the first run downloads a MongoDB binary and requires internet access. Tests never connect to the database in your `.env`. React tests cover adding, editing, completing, filtering, deleting, clearing completed tasks, and retrying a failed load.

## Set up MongoDB Atlas

1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a cluster. Choose an available free tier if it fits your checkpoint.
2. Under **Database Access**, create a database user with read/write access to the `daylist` database. This user is separate from your Atlas account.
3. Under **Network Access**, add your current public IP for local development. For Azure, add your Web App's outbound IP addresses, available under its networking/properties settings. Include the possible outbound addresses if your plan can use them; revisit the list after changing plans.
4. Choose **Connect → Drivers → Node.js** and copy the URI. Specify the database name:

   ```dotenv
   MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_URL_ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/daylist?retryWrites=true&w=majority
   ```

5. Replace the placeholders, URL-encode special characters in the password, and save the URI in local `.env` or Azure app settings. Never put it in React code or commit it.

Atlas requires a database user and an IP access list entry for the connecting machine. See [connecting to Atlas](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/) and [Atlas IP access lists](https://www.mongodb.com/docs/atlas/security/ip-access-list/).

## Deploy to Azure App Service

These steps deploy the source and build React on Azure. An Azure account/subscription and your own Atlas cluster are required. No Azure resources are created by the local app setup.

### 1. Create the Web App

In the [Azure Portal](https://portal.azure.com), choose **Create a resource → Web App**:

- Publish: **Code**.
- Runtime: **Node 24 LTS**, or a currently supported Node LTS compatible with this project.
- Operating system: **Linux**.
- Choose a resource group, unique app name, region, and an appropriate App Service plan. Check the displayed cost before creating it.

### 2. Configure the application

Open the Web App's **Settings → Environment variables** (called **Configuration → Application settings** in some portal views). Add:

| Name                             | Value                                |
| -------------------------------- | ------------------------------------ |
| `MONGODB_URI`                    | Your Atlas URI, including `/daylist` |
| `NODE_ENV`                       | `production`                         |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true`                               |

Save/apply the settings. Under **Configuration → General settings / Stack settings**, set the startup command to:

```text
npm start
```

Azure supplies `PORT`; the server already listens on `process.env.PORT`. Vite and its React plugin are workspace dependencies so the frontend can build even when the host omits development dependencies. See [Azure Node.js configuration and build automation](https://learn.microsoft.com/en-us/azure/app-service/configure-language-nodejs).

### 3. Connect deployment source

The simplest option is **Deployment Center → GitHub**. Put the **contents of this directory at the root of a dedicated repository**, including both `package.json` files, `package-lock.json`, `server`, and `client`. Do not upload `.env`, `node_modules`, or `client/dist`.

This checkpoint currently lives inside a larger repository. Deploying the parent repository directly requires a workflow that builds and packages this subdirectory; a dedicated repository avoids that extra configuration.

Connect that repository and branch in Deployment Center and save. If Azure generates a GitHub Actions workflow, verify that it:

1. Uses Node 24 and runs `npm ci` at the application root.
2. Runs `npm run build` to create `client/dist`.
3. Deploys the application root with `server`, `client/dist`, the package manifests, and lockfile. Do not deploy just `client/dist`, because this app needs its Express backend.

Alternatively, use **Deployment Center → Local Git** if available for your app. Follow [Azure's Local Git deployment guide](https://learn.microsoft.com/en-us/azure/app-service/deploy-local-git). Push from the dedicated application repository to the URL Azure provides, using its configured deployment branch. Git deployment with build automation installs dependencies and runs the root `build` script.

### 4. Verify the live app

1. Open the default domain shown in the Web App's **Overview** page.
2. Visit `/api/health`; expect `{"status":"ok","database":"connected"}`.
3. Add a task, reload the page, edit it, complete/reopen it, filter tasks, and delete it.
4. Add and complete a second task, then use **Clear completed**.
5. Check the Atlas `daylist.todos` collection to confirm persistence.

If startup fails, inspect **Log stream**. Confirm the Atlas URI, password encoding, database permissions, and Azure outbound IP access. If the API works but the frontend is missing, check deployment logs for a successful `npm run build` and ensure `client/dist/index.html` is deployed. A missing URI or failed database connection stops the server with an actionable message; credentials are never printed.

## API

| Method | Path                   | Purpose                                        |
| ------ | ---------------------- | ---------------------------------------------- |
| GET    | `/api/health`          | Database readiness; HTTP 503 when disconnected |
| GET    | `/api/todos`           | List tasks, newest first                       |
| POST   | `/api/todos`           | Create: `{"title":"My task"}`                  |
| PATCH  | `/api/todos/:id`       | Edit title and/or boolean `completed`          |
| DELETE | `/api/todos/:id`       | Delete one task                                |
| DELETE | `/api/todos/completed` | Delete completed tasks only                    |

Titles are trimmed and must contain 1–200 characters. Invalid requests return HTTP 400, missing tasks return 404, and errors use `{"message":"..."}`.

## Project structure

```text
client/
  src/             React interface and UI tests
  public/          Favicon
  dist/            Generated production frontend (ignored by Git)
server/
  app.js           Express routes, validation, static hosting, error handling
  index.js         MongoDB connection, HTTP startup, graceful shutdown
  models/Todo.js   Mongoose schema
tests/api.test.js  API integration tests against temporary MongoDB
.env.example       Safe example configuration
```
