// app/services/apiClient.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getUsers() {
  const res = await fetch(`${BASE_URL}/users`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener usuarios");
  return res.json();
}

