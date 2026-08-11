const http = require('http');

const PORT = process.env.PORT || 3000;
let nextId = 1;
const tasks = [];

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(data));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
    });

    request.on('end', () => {
      if (!body) return resolve({});

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });

    request.on('error', reject);
  });
}

function getTaskId(pathname) {
  const match = pathname.match(/^\/tasks\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function validateTaskInput(input, { requireTitle = false } = {}) {
  if (requireTitle && !Object.prototype.hasOwnProperty.call(input, 'title')) {
    return 'title is required';
  }

  if (Object.prototype.hasOwnProperty.call(input, 'title')) {
    if (typeof input.title !== 'string' || !input.title.trim()) {
      return 'title must be a non-empty string';
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'completed') && typeof input.completed !== 'boolean') {
    return 'completed must be a boolean';
  }

  return null;
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const { pathname } = url;
  const { method } = request;
  const taskId = getTaskId(pathname);

  try {
    if (method === 'GET' && pathname === '/tasks') {
      return sendJson(response, 200, tasks);
    }

    if (method === 'GET' && taskId !== null) {
      const task = tasks.find((item) => item.id === taskId);
      return task
        ? sendJson(response, 200, task)
        : sendJson(response, 404, { error: 'Task not found' });
    }

    if (method === 'POST' && pathname === '/tasks') {
      const input = await readJsonBody(request);
      const validationError = validateTaskInput(input, { requireTitle: true });
      if (validationError) return sendJson(response, 400, { error: validationError });

      const task = {
        id: nextId++,
        title: input.title.trim(),
        completed: input.completed ?? false,
      };
      tasks.push(task);
      return sendJson(response, 201, task);
    }

    if ((method === 'PUT' || method === 'PATCH') && taskId !== null) {
      const task = tasks.find((item) => item.id === taskId);
      if (!task) return sendJson(response, 404, { error: 'Task not found' });

      const input = await readJsonBody(request);
      const validationError = validateTaskInput(input);
      if (validationError) return sendJson(response, 400, { error: validationError });
      if (!Object.prototype.hasOwnProperty.call(input, 'title') && !Object.prototype.hasOwnProperty.call(input, 'completed')) {
        return sendJson(response, 400, { error: 'Provide title or completed to update' });
      }

      if (Object.prototype.hasOwnProperty.call(input, 'title')) task.title = input.title.trim();
      if (Object.prototype.hasOwnProperty.call(input, 'completed')) task.completed = input.completed;
      return sendJson(response, 200, task);
    }

    if (method === 'DELETE' && taskId !== null) {
      const taskIndex = tasks.findIndex((item) => item.id === taskId);
      if (taskIndex === -1) return sendJson(response, 404, { error: 'Task not found' });

      tasks.splice(taskIndex, 1);
      response.writeHead(204);
      return response.end();
    }

    return sendJson(response, 404, { error: 'Route not found' });
  } catch (error) {
    if (error.message === 'Invalid JSON body') {
      return sendJson(response, 400, { error: error.message });
    }

    console.error(error);
    return sendJson(response, 500, { error: 'Internal server error' });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`To-do API listening on http://localhost:${PORT}`);
  });
}

module.exports = server;
