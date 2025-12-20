const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const fetchConfig = {
  credentials: 'include' as RequestCredentials,
  headers: { 'Content-Type': 'application/json' },
};

// Función auxiliar para asegurar que siempre devolvemos un array
const ensureArray = (result: any) => {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.data)) return result.data;
  return [];
};

export const userService = {
  getAll: async () => {
    try {
      const res = await fetch(`${BASE_URL}/users`, fetchConfig);
      const result = await res.json();
      return ensureArray(result);
    } catch (e) { return []; }
  },
};

export const studentService = {
  getAll: async () => {
    try {
      const res = await fetch(`${BASE_URL}/alumnos`, fetchConfig);
      const result = await res.json();
      return ensureArray(result);
    } catch (e) { return []; }
  },
  create: async (data: any) => {
    const res = await fetch(`${BASE_URL}/alumnos`, { 
      ...fetchConfig, 
      method: 'POST', 
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

export const gradeService = {
  getAll: async () => {
    try {
      const res = await fetch(`${BASE_URL}/grados`, fetchConfig);
      const result = await res.json();
      return ensureArray(result);
    } catch (e) { return []; }
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
    const res = await fetch(`${BASE_URL}/grados/${id}`, { ...fetchConfig, method: 'DELETE' });
    return res.json();
  }
};

export const reportService = {
  getAll: async () => {
    try {
      const res = await fetch(`${BASE_URL}/reportes`, fetchConfig);
      const result = await res.json();
      return ensureArray(result);
    } catch (e) { return []; }
  }
};

export const attendanceService = {
  createStudent: async (alumnoId: number, estado: string) => {
    const res = await fetch(`${BASE_URL}/asistencia`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify({ alumnoId, estado }),
    });
    return res.json();
  }
};

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