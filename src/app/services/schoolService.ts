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
    return result.data || result || [];
  },
};

// --- SERVICIO DE ALUMNOS ---
export const studentService = {
  getAll: async () => {
    const res = await fetch(`${BASE_URL}/alumnos`, fetchConfig);
    const result = await res.json();
    return result.data || result || [];
  },
  create: async (data: any) => {
    const res = await fetch(`${BASE_URL}/alumnos`, { 
      ...fetchConfig, 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
    return res.json();
  },
  update: async (data: any) => {
    const res = await fetch(`${BASE_URL}/alumnos`, { 
      ...fetchConfig, 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    });
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetch(`${BASE_URL}/alumnos`, { 
      ...fetchConfig, 
      method: 'DELETE', 
      body: JSON.stringify({ id }) 
    });
    return res.json();
  }
};

// --- SERVICIO DE GRADOS (GRUPOS) ---
export const gradeService = {
  getAll: async () => {
    const res = await fetch(`${BASE_URL}/grados`, fetchConfig);
    const result = await res.json();
    return result.data || result || [];
  },
  create: async (data: any) => {
    const res = await fetch(`${BASE_URL}/grados`, { 
      ...fetchConfig, 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetch(`${BASE_URL}/grados/${id}`, { 
      ...fetchConfig, 
      method: 'DELETE' 
    });
    return res.json();
  }
};

// --- SERVICIO DE REPORTES ---
export const reportService = {
  getAll: async () => {
    const res = await fetch(`${BASE_URL}/reportes`, fetchConfig);
    const result = await res.json();
    return result.data || result || [];
  }
};

// --- SERVICIO DE ASISTENCIAS ---
export const attendanceService = {
  createStudent: async (alumnoId: number, estado: string) => {
    const res = await fetch(`${BASE_URL}/asistencia`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify({ alumnoId, estado }),
    });
    return res.json();
  },
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
  create: async (data: any) => {
    const res = await fetch(`${BASE_URL}/incidencias`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  }
};