const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const fetchConfig = {
  credentials: 'include' as RequestCredentials,
  headers: { 'Content-Type': 'application/json' },
};

const ensureArray = (result: any) => {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.data)) return result.data;
  return [];
};

// --- USUARIOS ---
export const userService = {
  getAll: async () => {
    try {
      const res = await fetch(`${BASE_URL}/users`, fetchConfig);
      return ensureArray(await res.json());
    } catch (e) { return []; }
  },
  create: async (data: any) => {
    const res = await fetch(`${BASE_URL}/users`, { ...fetchConfig, method: 'POST', body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Error creando usuario");
    return res.json();
  },
  
  update: async (id: number, data: any) => {
    const res = await fetch(`${BASE_URL}/users/${id}`, { 
        ...fetchConfig, 
        method: 'PATCH', 
        body: JSON.stringify(data) 
    });
    if (!res.ok) throw new Error("Error actualizando usuario");
    return res.json();
  },

  delete: async (id: number) => {
    const res = await fetch(`${BASE_URL}/users/${id}`, { ...fetchConfig, method: 'DELETE' });
    return res.json();
  }
};

// --- ALUMNOS ---
export const studentService = {
  getAll: async () => {
    try {
      const res = await fetch(`${BASE_URL}/alumnos`, fetchConfig);
      return ensureArray(await res.json());
    } catch (e) { return []; }
  },
  create: async (data: any) => {
    const res = await fetch(`${BASE_URL}/alumnos`, { ...fetchConfig, method: 'POST', body: JSON.stringify(data) });
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetch(`${BASE_URL}/alumnos`, { ...fetchConfig, method: 'DELETE', body: JSON.stringify({ id }) });
    return res.json();
  }
};

// --- GRUPOS (GRADOS) ---
export const gradeService = {
  getAll: async () => {
    try {
      const res = await fetch(`${BASE_URL}/grados`, fetchConfig);
      return ensureArray(await res.json());
    } catch (e) { return []; }
  },
  create: async (data: any) => {
    const res = await fetch(`${BASE_URL}/grados`, { ...fetchConfig, method: 'POST', body: JSON.stringify(data) });
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetch(`${BASE_URL}/grados`, { ...fetchConfig, method: 'DELETE', body: JSON.stringify({ id }) });
    return res.json();
  }
};

// --- INCIDENCIAS ---
export const incidentService = {
  getAll: async () => {
    try {
      const res = await fetch(`${BASE_URL}/incidencias`, fetchConfig);
      return ensureArray(await res.json());
    } catch (e) { return []; }
  },
  create: async (data: any) => {
    const res = await fetch(`${BASE_URL}/incidencias`, { ...fetchConfig, method: 'POST', body: JSON.stringify(data) });
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetch(`${BASE_URL}/incidencias`, { ...fetchConfig, method: 'DELETE', body: JSON.stringify({ id }) });
    return res.json();
  }
};

// --- ASISTENCIA ALUMNOS ---
export const attendanceService = {
  getAll: async () => {
    try {
      const res = await fetch(`${BASE_URL}/asistencia`, fetchConfig);
      return ensureArray(await res.json());
    } catch (e) { return []; }
  },
  // CORRECCIÓN AQUÍ: Renombrado de 'create' a 'createStudent'
  createStudent: async (alumnoId: number, estado: string) => {
    const res = await fetch(`${BASE_URL}/asistencia`, { 
      ...fetchConfig, 
      method: 'POST', 
      body: JSON.stringify({ alumnoId, estado }) 
    });
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetch(`${BASE_URL}/asistencia`, { ...fetchConfig, method: 'DELETE', body: JSON.stringify({ id }) });
    return res.json();
  }
};

// --- ASISTENCIA MAESTROS ---
export const teacherAttendanceService = {
  getAll: async () => {
    try {
      const res = await fetch(`${BASE_URL}/asistencia-maestro`, fetchConfig);
      return ensureArray(await res.json());
    } catch (e) { return []; }
  },
  // CORRECCIÓN AQUÍ: Renombrado de 'create' a 'createTeacher' (por si acaso)
  createTeacher: async (maestroId: number, estado: string) => {
    const res = await fetch(`${BASE_URL}/asistencia-maestro`, { 
      ...fetchConfig, 
      method: 'POST', 
      body: JSON.stringify({ maestroId, estado }) 
    });
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetch(`${BASE_URL}/asistencia-maestro/${id}`, { ...fetchConfig, method: 'DELETE' });
    return res.json();
  }
};

// --- REPORTES ---
export const reportService = {
  getAll: async () => {
    try {
      const res = await fetch(`${BASE_URL}/reportes`, fetchConfig);
      return ensureArray(await res.json());
    } catch (e) { return []; }
  },
  create: async (data: any) => {
      const res = await fetch(`${BASE_URL}/reportes`, { ...fetchConfig, method: 'POST', body: JSON.stringify(data) });
      return res.json();
  },
  delete: async (id: number) => {
      const res = await fetch(`${BASE_URL}/reportes`, { ...fetchConfig, method: 'DELETE', body: JSON.stringify({ id }) });
      return res.json();
  }
};

// --- TAREAS ---
export const homeworkService = {
  getAll: async () => {
    try {
      const res = await fetch(`${BASE_URL}/tareas`, fetchConfig);
      return ensureArray(await res.json());
    } catch (e) { return []; }
  },
  create: async (data: any) => {
      const res = await fetch(`${BASE_URL}/tareas`, { ...fetchConfig, method: 'POST', body: JSON.stringify(data) });
      return res.json();
  },
  update: async (uuid: string, data: any) => { // Tareas usa UUID o ID según tu base
      const res = await fetch(`${BASE_URL}/tareas/${uuid}`, {
          ...fetchConfig,
          method: 'PATCH',
          body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Error actualizando tarea");
      return res.json();
  },
  delete: async (id: number) => {
      const res = await fetch(`${BASE_URL}/tareas/${id}`, { ...fetchConfig, method: 'DELETE'  });
      return res.json();
  }
};