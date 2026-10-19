export async function api(path, options = {}) {
  const headers = new Headers(options.headers);
  const token = sessionStorage.getItem("educms.token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    options = { ...options, body: JSON.stringify(options.body) };
  }
  const response = await fetch(`/api/v1${path}`, { ...options, headers });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid response");
  }
  if (!response.ok) {
    if (
      response.status === 401 &&
      !["/auth/login", "/auth/register", "/auth/password"].includes(path)
    )
      window.dispatchEvent(new Event("educms.session-expired"));
    throw new Error(
      result.errors?.map((e) => `${e.field}: ${e.message}`).join(" · ") ||
        result.message ||
        "Request failed",
    );
  }
  return result.data;
}
