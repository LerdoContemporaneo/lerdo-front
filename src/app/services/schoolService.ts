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
  const res = await fetch(`${BASE_URL}/users`, fetchConfig);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data?.msg || `No fue posible obtener los usuarios (${res.status})`
    );
  }
  return ensureArray(data);
},
  create: async (data: any) => {
    const payload = {
      ...data,
      confPassword: data.password
    };
    const res = await fetch(`${BASE_URL}/users`, { ...fetchConfig, method: 'POST', body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ }));
      throw new Error(errorData.msg || "Error creando usuario");
    }
    return res.json();
  },
  
update: async (uuid: string, data: any) => { 
    const payload = {
      ...data,
      confPassword: data.password || "" 
    };

    const res = await fetch(`${BASE_URL}/users/${uuid}`, { 
        ...fetchConfig, 
        method: 'PATCH', 
        body: JSON.stringify(payload) 
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.msg || "Error actualizando usuario");
    }
    return res.json();
  },
delete: async (uuid: string) => { 
    const res = await fetch(`${BASE_URL}/users/${uuid}`, { 
      ...fetchConfig, 
      method: 'DELETE' 
    });
    return res.json();
  }
};

// --- ALUMNOS ---
export const studentService = {
getAll: async () => {
  const res = await fetch(`${BASE_URL}/alumnos`, fetchConfig);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data?.msg || `No fue posible obtener los alumnos (${res.status})`
    );
  }

  return ensureArray(data);
},

  create: async (data: Record<string, unknown>) => {
    const res = await fetch(`${BASE_URL}/alumnos`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(data),
    });

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        responseData.msg || 'Error al crear el alumno'
      );
    }

    return responseData;
  },

  update: async (
    uuid: string,
    data: Record<string, unknown>
  ) => {
    const res = await fetch(
      `${BASE_URL}/alumnos/${uuid}`,
      {
        ...fetchConfig,
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        responseData.msg || 'Error al actualizar el alumno'
      );
    }

    return responseData;
  },

  delete: async (uuid: string) => {
    const res = await fetch(
      `${BASE_URL}/alumnos/${uuid}`,
      {
        ...fetchConfig,
        method: 'DELETE',
      }
    );

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        responseData.msg || 'Error al eliminar el alumno'
      );
    }

    return responseData;
  },
};

// --- GRUPOS (GRADOS) ---
export const gradeService = {
  getAll: async () => {
    const res = await fetch(`${BASE_URL}/grados`, fetchConfig);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data.msg || `Error al obtener los grupos (${res.status})`
      );
    }

    return ensureArray(data);
  },

  create: async (data: {
    nombre: string;
    maestroId: number;
  }) => {
    const res = await fetch(`${BASE_URL}/grados`, {
      ...fetchConfig,
      method: "POST",
      body: JSON.stringify(data),
    });

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        responseData.msg ||
          `Error al crear el grupo (${res.status})`
      );
    }

    return responseData;
  },

  update: async (
    uuid: string,
    data: {
      nombre: string;
      maestroId: number;
    }
  ) => {
    const res = await fetch(`${BASE_URL}/grados/${uuid}`, {
      ...fetchConfig,
      method: "PATCH",
      body: JSON.stringify(data),
    });

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        responseData.msg ||
          `Error al actualizar el grupo (${res.status})`
      );
    }

    return responseData;
  },

  replaceStudents: async (
    uuid: string,
    alumnoIds: number[]
  ) => {
    const res = await fetch(
      `${BASE_URL}/grados/${uuid}/alumnos`,
      {
        ...fetchConfig,
        method: "PUT",
        body: JSON.stringify({ alumnoIds }),
      }
    );

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        responseData.msg ||
          `No fue posible actualizar los alumnos (${res.status})`
      );
    }

    return responseData;
  },

  delete: async (uuid: string) => {
    const res = await fetch(`${BASE_URL}/grados/${uuid}`, {
      ...fetchConfig,
      method: "DELETE",
    });

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        responseData.msg ||
          `Error al eliminar el grupo (${res.status})`
      );
    }

    return responseData;
  },
};
// --- INCIDENCIAS ---
export type IncidentPayload = {
  tipo: string;
  descripcion: string;
  fecha: string;
  gradoId: number;
  alumnoId: number | null;
};

export type IncidentFilters = {
  alumnoId?: number;
  gradoId?: number;
  maestroId?: number;
  tipo?: string;
  desde?: string;
  hasta?: string;
};

export const incidentService = {
  getAll: async (filters: IncidentFilters = {}) => {
    const query = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        query.set(key, String(value));
      }
    });

    const suffix = query.size ? `?${query.toString()}` : '';
    const res = await fetch(
      `${BASE_URL}/incidencias${suffix}`,
      fetchConfig
    );
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible obtener las incidencias (${res.status})`
      );
    }

    return ensureArray(data);
  },

  create: async (payload: IncidentPayload) => {
    const res = await fetch(`${BASE_URL}/incidencias`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible crear la incidencia (${res.status})`
      );
    }

    return data;
  },

  update: async (
    uuid: string,
    payload: Partial<IncidentPayload>
  ) => {
    const res = await fetch(`${BASE_URL}/incidencias/${uuid}`, {
      ...fetchConfig,
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible actualizar la incidencia (${res.status})`
      );
    }

    return data;
  },

  delete: async (uuid: string) => {
    const res = await fetch(`${BASE_URL}/incidencias/${uuid}`, {
      ...fetchConfig,
      method: 'DELETE',
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible eliminar la incidencia (${res.status})`
      );
    }

    return data;
  },
};




export type AttendanceStatus =
  | 'Presente'
  | 'Ausente'
  | 'Tarde'
  | 'Justificado';

type AttendancePayload = {
  alumnoId: number;
  estado: AttendanceStatus;
  fecha?: string;
  gradoId?: number;
  comentario?: string;
};

const createAttendance = async (
  payload: AttendancePayload
) => {
  const res = await fetch(`${BASE_URL}/asistencia`, {
    ...fetchConfig,
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data?.msg || 'No fue posible registrar la asistencia'
    );
  }

  return data;
};

// --- ASISTENCIA ALUMNOS ---
export const attendanceService = {
  // GET /asistencia
  getAll: async () => {
    const res = await fetch(`${BASE_URL}/asistencia`, {
      ...fetchConfig,
      method: 'GET',
    });

    const data = await res.json().catch(() => []);

    if (!res.ok) {
      throw new Error(
        data?.msg || 'No fue posible obtener la asistencia'
      );
    }

    return ensureArray(data);
  },

  // GET /asistencia/:id
  getById: async (id: number) => {
    const res = await fetch(`${BASE_URL}/asistencia/${id}`, {
      ...fetchConfig,
      method: 'GET',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || 'No fue posible obtener el registro'
      );
    }

    return data;
  },

  // POST /asistencia
  create: async (payload: AttendancePayload) => {
    return createAttendance(payload);
  },

  // Compatibilidad con componentes anteriores
  createStudent: async (
    alumnoId: number,
    estado: AttendanceStatus
  ) => {
    return createAttendance({
      alumnoId,
      estado,
    });
  },

  // PATCH /asistencia/:id
  update: async (
    id: number,
    payload: Partial<AttendancePayload>
  ) => {
    const res = await fetch(`${BASE_URL}/asistencia/${id}`, {
      ...fetchConfig,
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || 'No fue posible actualizar la asistencia'
      );
    }

    return data;
  },

  // DELETE /asistencia/:id
  delete: async (id: number) => {
    const res = await fetch(`${BASE_URL}/asistencia/${id}`, {
      ...fetchConfig,
      method: 'DELETE',
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));

      throw new Error(
        data?.msg || 'No fue posible eliminar la asistencia'
      );
    }

    return true;
  },
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

type HomeworkPayload = {
  titulo: string;
  descripcion: string;
  fechaAsignacion: string;
  fechaEntrega: string;
  gradoId: number;
};

export const homeworkService = {
  getAll: async () => {
    const res = await fetch(
      `${BASE_URL}/tareas`,
      fetchConfig
    );

    const data = await res.json().catch(() => []);

    if (!res.ok) {
      throw new Error(
        data?.msg || 'Error al obtener las tareas'
      );
    }

    return ensureArray(data);
  },

  create: async (payload: HomeworkPayload) => {
    const res = await fetch(`${BASE_URL}/tareas`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || 'Error al crear la tarea'
      );
    }

    return data;
  },

  update: async (
    uuid: string,
    payload: HomeworkPayload
  ) => {
    const res = await fetch(
      `${BASE_URL}/tareas/${uuid}`,
      {
        ...fetchConfig,
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || 'Error al actualizar la tarea'
      );
    }

    return data;
  },

  delete: async (uuid: string) => {
    const res = await fetch(
      `${BASE_URL}/tareas/${uuid}`,
      {
        ...fetchConfig,
        method: 'DELETE',
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || 'Error al eliminar la tarea'
      );
    }

    return data;
  },
};