export async function request(path = '', options = {}) {
  let response;
  try {
    response = await fetch(`/api/todos${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json' },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  if (response.status === 204) return null;
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The server returned an unexpected response. Please try again.');
  }
  if (!response.ok) throw new Error(data.message || 'The request failed. Please try again.');
  return data;
}
