export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Connexion au serveur impossible. Vérifiez que l’API est démarrée.",
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body.errors?.length
        ? `${body.message} ${body.errors.map((e: { field: string; message: string }) => `${e.field} : ${e.message}`).join(" · ")}`
        : body.message ||
            "Le service est indisponible. Vérifiez l’API et MongoDB.",
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export const body = (data: unknown, method = "POST") => ({
  method,
  body: JSON.stringify(data),
});
