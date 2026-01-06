import { getUserToken } from "./authStore";

const BASE = import.meta.env.VITE_API_BASE;

export async function api(path, { method="GET", body } = {}) {
  const token = getUserToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
