const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const fetchConfig = {
  credentials: 'include' as RequestCredentials,
  headers: { 'Content-Type': 'application/json' },
};

// --- SERVICIO DE USUARIOS (Administradores/Maestros) ---
export const userService = {
  getAll: async () => {
    const res = await fetch(`${BASE_URL}/users`, fetchConfig);
    const result = await res.json();
    return result.data || [];
  },
};

// --- SERVICIO DE ALUMNOS ---
export const studentService = {
  getAll: async () => {
    const res = await fetch(`${BASE_URL}/alumnos`, fetchConfig);
    const result = await res.json();
    return result.data || [];
  },
};

// --- SERVICIO DE ASISTENCIAS ---
export const attendanceService = {
  // Alumnos
  createStudent: async (alumnoId: number, estado: string) => {
    const res = await fetch(`${BASE_URL}/asistencia`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify({ alumnoId, estado }),
    });
    return res.json();
  },
  // Maestros
  createTeacher: async (maestroId: number, estado: string) => {
    const res = await fetch(`${BASE_URL}/asistencia-maestro`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify({ maestroId, estado }),
    });
    return res.json();
  }
};

// --- SERVICIO DE INCIDENCIAS ---
export const incidentService = {
  create: async (data: { alumnoId: number, tipo: string, descripcion: string }) => {
    const res = await fetch(`${BASE_URL}/incidencias`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  }
};