// app/services/authService.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface LoginResponse {
  uuid: string;
  name: string;
  email: string;
  role: string;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  // Usamos 'fetch' (como en el código de referencia) ya que Axios no está en uso
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // CLAVE: Esto asegura que las cookies de sesión se envíen y reciban
    credentials: "include", 
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    // Si hay error (400, 404, etc.), leemos el mensaje de error del backend
    const errorData = await res.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(errorData.msg || 'Error al iniciar sesión');
  }

  const data: LoginResponse = await res.json();
  return data;
}

export async function checkMeApi(): Promise<LoginResponse | null> {
  const res = await fetch(`${BASE_URL}/me`, {
    method: "GET",
    credentials: "include",
  });
  
  if (res.ok) {
    const data: LoginResponse = await res.json();
    return data;
  }
  return null; // No hay sesión activa
}