// app/services/authService.ts
import type { AuthUser } from '../types/auth';

type LoginResponse = AuthUser;

const getBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL;

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${getBaseUrl()}/login`, {
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
  const res = await fetch(`${getBaseUrl()}/me`, {
    method: "GET",
    credentials: "include",
  });
  
  if (res.ok) {
    const data: LoginResponse = await res.json();
    return data;
  }
  return null; 
}


export async function logoutApi(): Promise<void> {
  await fetch(`${getBaseUrl()}/logout`, {
    method: "DELETE", // En tu rest.rest dice que el logout es DELETE
    credentials: "include", // Importante para enviar la cookie a destruir
  });
}
