// app/services/userService.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getAllUsers() {
  const res = await fetch(`${BASE_URL}/users`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Error al obtener usuarios');
  const result = await res.json();
  return result.data; // Tu backend devuelve { data: [...] }
}

// Opcional: Si quieres estadísticas para el Dashboard
export async function getDashboardStats() {
  // Si aún no tienes este endpoint en el backend, usaremos datos simulados
  // pero ya dejamos la función lista.
  try {
    const res = await fetch(`${BASE_URL}/stats`, { credentials: 'include' });
    if (res.ok) return await res.json();
  } catch (e) {
    return null;
  }
}