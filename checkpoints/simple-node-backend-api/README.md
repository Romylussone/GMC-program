# To-Do List API

An in-memory REST API built with Node.js core modules only.

Run it with:

```bash
npm start
```

The server listens on `http://localhost:3000` by default. Set `PORT` to use another port.

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/tasks` | Get all tasks |
| `GET` | `/tasks/:id` | Get one task |
| `POST` | `/tasks` | Create a task |
| `PUT` or `PATCH` | `/tasks/:id` | Update a task |
| `DELETE` | `/tasks/:id` | Delete a task |

Create or update requests accept JSON such as:

```json
{ "title": "Finish checkpoint", "completed": false }
```

`title` is required when creating a task and must be a non-empty string. `completed` is optional and defaults to `false`.
