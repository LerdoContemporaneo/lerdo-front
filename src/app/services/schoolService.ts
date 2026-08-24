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

export type EducationalLevel = {
  id: number;
  uuid: string;
  nombre: string;
  clave: string;
  orden: number;
  activo: boolean;
};

export type EducationalLevelPayload = {
  nombre: string;
  clave: string;
  orden: number;
  activo: boolean;
};

export type EducationalLevelUpdate =
  Partial<EducationalLevelPayload>;

type UserLevelsResponse = {
  usuario: unknown;
  niveles: EducationalLevel[];
};

export type UserPayload = {
  name: string;
  email: string;
  role: 'administrador' | 'coordinador' | 'maestro' | 'alumno';
  password?: string;
  confPassword?: string;
  nivelIds: number[];
};

// --- NIVELES EDUCATIVOS ---
export const levelService = {
  getAll: async (): Promise<EducationalLevel[]> => {
    const res = await fetch(`${BASE_URL}/niveles`, fetchConfig);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible obtener los niveles (${res.status})`,
      );
    }

    return ensureArray(data) as EducationalLevel[];
  },

  create: async (
    payload: EducationalLevelPayload,
  ): Promise<EducationalLevel> => {
    const res = await fetch(`${BASE_URL}/niveles`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible crear el nivel (${res.status})`,
      );
    }

    return (data.nivel ?? data) as EducationalLevel;
  },

  update: async (
    uuid: string,
    payload: EducationalLevelUpdate,
  ): Promise<EducationalLevel> => {
    const res = await fetch(`${BASE_URL}/niveles/${uuid}`, {
      ...fetchConfig,
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible actualizar el nivel (${res.status})`,
      );
    }

    return (data.nivel ?? data) as EducationalLevel;
  },

  delete: async (uuid: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/niveles/${uuid}`, {
      ...fetchConfig,
      method: 'DELETE',
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible eliminar el nivel (${res.status})`,
      );
    }
  },

  getForUser: async (uuid: string): Promise<UserLevelsResponse> => {
    const res = await fetch(
      `${BASE_URL}/usuarios/${uuid}/niveles`,
      fetchConfig,
    );
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible obtener los niveles del usuario (${res.status})`,
      );
    }

    return {
      usuario: data.usuario,
      niveles: ensureArray(data.niveles) as EducationalLevel[],
    };
  },

  replaceForUser: async (
    uuid: string,
    nivelIds: number[],
  ): Promise<UserLevelsResponse> => {
    const res = await fetch(
      `${BASE_URL}/usuarios/${uuid}/niveles`,
      {
        ...fetchConfig,
        method: 'PUT',
        body: JSON.stringify({ nivelIds }),
      },
    );
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible asignar los niveles (${res.status})`,
      );
    }

    return {
      usuario: data.usuario,
      niveles: ensureArray(data.niveles) as EducationalLevel[],
    };
  },
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
  create: async (data: UserPayload) => {
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
  
update: async (uuid: string, data: UserPayload) => {
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
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.msg || `No fue posible eliminar el usuario (${res.status})`);
    }
    return data;
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
    nivelId: number;
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
      nivelId: number;
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
export type TeacherAttendanceStatus = AttendanceStatus;

export type TeacherAttendancePayload = {
  maestroId: number;
  gradoId: number;
  fecha: string;
  horaClase: string;
  estado: TeacherAttendanceStatus;
  observacion?: string;
};

export type TeacherAttendanceFilters = {
  fecha?: string;
  desde?: string;
  hasta?: string;
  maestroId?: number;
  gradoId?: number;
  estado?: TeacherAttendanceStatus;
};

export const teacherAttendanceService = {
  getAll: async (filters: TeacherAttendanceFilters = {}) => {
    const query = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        query.set(key, String(value));
      }
    });

    const suffix = query.size ? `?${query.toString()}` : '';
    const res = await fetch(
      `${BASE_URL}/asistencia-maestro${suffix}`,
      fetchConfig
    );
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg ||
          `No fue posible obtener la asistencia docente (${res.status})`
      );
    }

    return ensureArray(data);
  },

  create: async (payload: TeacherAttendancePayload) => {
    const res = await fetch(`${BASE_URL}/asistencia-maestro`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg ||
          `No fue posible registrar la asistencia docente (${res.status})`
      );
    }

    return data;
  },

  update: async (
    uuid: string,
    payload: TeacherAttendancePayload
  ) => {
    const res = await fetch(
      `${BASE_URL}/asistencia-maestro/${uuid}`,
      {
        ...fetchConfig,
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg ||
          `No fue posible actualizar la asistencia docente (${res.status})`
      );
    }

    return data;
  },

  delete: async (uuid: string) => {
    const res = await fetch(
      `${BASE_URL}/asistencia-maestro/${uuid}`,
      {
        ...fetchConfig,
        method: 'DELETE',
      }
    );
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg ||
          `No fue posible eliminar la asistencia docente (${res.status})`
      );
    }

    return data;
  },
};

// --- REPORTES ---
export type ReportPayload = {
  titulo: string;
  contenido: string;
  alumnoId: number;
  gradoId: number;
};

export type ReportFilters = {
  alumnoId?: number;
  gradoId?: number;
  desde?: string;
  hasta?: string;
};

export const reportService = {
  getAll: async (filters: ReportFilters = {}) => {
    const query = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        query.set(key, String(value));
      }
    });

    const suffix = query.size ? `?${query.toString()}` : '';
    const res = await fetch(
      `${BASE_URL}/reportes${suffix}`,
      fetchConfig
    );
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg ||
          `No fue posible obtener los reportes (${res.status})`
      );
    }

    return ensureArray(data);
  },

  create: async (payload: ReportPayload) => {
    const res = await fetch(`${BASE_URL}/reportes`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg ||
          `No fue posible crear el reporte (${res.status})`
      );
    }

    return data;
  },

  update: async (
    uuid: string,
    payload: Partial<ReportPayload>
  ) => {
    const res = await fetch(`${BASE_URL}/reportes/${uuid}`, {
      ...fetchConfig,
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg ||
          `No fue posible actualizar el reporte (${res.status})`
      );
    }

    return data;
  },

  delete: async (uuid: string) => {
    const res = await fetch(`${BASE_URL}/reportes/${uuid}`, {
      ...fetchConfig,
      method: 'DELETE',
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg ||
          `No fue posible eliminar el reporte (${res.status})`
      );
    }

    return data;
  },
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

// --- MATERIAS Y RECURSOS ACADEMICOS ---
export type AcademicTeacher = {
  id: number;
  uuid: string;
  name: string;
  email?: string;
  role?: string;
};

export type AcademicGroup = {
  id: number;
  uuid: string;
  nombre: string;
  nivelId: number | null;
  maestroId?: number | null;
  nivel?: EducationalLevel | null;
};

export type Subject = {
  id: number;
  uuid: string;
  nombre: string;
  gradoId: number;
  maestroId: number;
  grado?: AcademicGroup | null;
  maestro?: AcademicTeacher | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SubjectPayload = {
  nombre: string;
  gradoId: number;
  maestroId: number;
};

export type AcademicResource = {
  id: number;
  uuid: string;
  titulo: string;
  descripcion?: string | null;
  tipo: 'enlace' | 'pdf';
  enlace?: string | null;
  archivoNombre?: string | null;
  archivoMime?: string | null;
  archivoTamano?: number | null;
  tieneArchivo: boolean;
  materiaId: number;
  creadoPorId?: number | null;
  materia?: Subject | null;
  creadoPor?: AcademicTeacher | null;
  createdAt: string;
  updatedAt: string;
};

export type AcademicResourcePayload = {
  titulo: string;
  descripcion?: string;
  tipo: 'enlace' | 'pdf';
  materiaId: number;
  enlace?: string;
  archivoBase64?: string;
  archivoNombre?: string;
};

export const subjectService = {
  getAll: async (filters: { gradoId?: number; maestroId?: number } = {}) => {
    const query = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, String(value));
    });

    const suffix = query.size ? `?${query.toString()}` : '';
    const res = await fetch(`${BASE_URL}/materias${suffix}`, fetchConfig);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible obtener las materias (${res.status})`
      );
    }

    return ensureArray(data) as Subject[];
  },

  create: async (payload: SubjectPayload) => {
    const res = await fetch(`${BASE_URL}/materias`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible crear la materia (${res.status})`
      );
    }

    return (data.materia ?? data) as Subject;
  },

  update: async (uuid: string, payload: SubjectPayload) => {
    const res = await fetch(`${BASE_URL}/materias/${uuid}`, {
      ...fetchConfig,
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible actualizar la materia (${res.status})`
      );
    }

    return (data.materia ?? data) as Subject;
  },

  delete: async (uuid: string) => {
    const res = await fetch(`${BASE_URL}/materias/${uuid}`, {
      ...fetchConfig,
      method: 'DELETE',
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible eliminar la materia (${res.status})`
      );
    }

    return data;
  },
};

export const academicResourceService = {
  getAll: async (filters: { materiaId?: number; gradoId?: number } = {}) => {
    const query = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, String(value));
    });

    const suffix = query.size ? `?${query.toString()}` : '';
    const res = await fetch(
      `${BASE_URL}/recursos-academicos${suffix}`,
      fetchConfig
    );
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg ||
          `No fue posible obtener los recursos (${res.status})`
      );
    }

    return ensureArray(data) as AcademicResource[];
  },

  create: async (payload: AcademicResourcePayload) => {
    const res = await fetch(`${BASE_URL}/recursos-academicos`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible publicar el recurso (${res.status})`
      );
    }

    return (data.recurso ?? data) as AcademicResource;
  },

  update: async (
    uuid: string,
    payload: AcademicResourcePayload
  ) => {
    const res = await fetch(`${BASE_URL}/recursos-academicos/${uuid}`, {
      ...fetchConfig,
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible actualizar el recurso (${res.status})`
      );
    }

    return (data.recurso ?? data) as AcademicResource;
  },

  delete: async (uuid: string) => {
    const res = await fetch(`${BASE_URL}/recursos-academicos/${uuid}`, {
      ...fetchConfig,
      method: 'DELETE',
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.msg || `No fue posible eliminar el recurso (${res.status})`
      );
    }

    return data;
  },

  downloadPdf: async (uuid: string) => {
    const res = await fetch(
      `${BASE_URL}/recursos-academicos/${uuid}/archivo`,
      {
        credentials: 'include',
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(
        data?.msg || `No fue posible descargar el PDF (${res.status})`
      );
    }

    return res.blob();
  },
};
