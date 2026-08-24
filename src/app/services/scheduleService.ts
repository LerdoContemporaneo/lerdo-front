import type {
  AcademicGroup,
  AcademicTeacher,
  EducationalLevel,
  Subject,
} from './schoolService';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Identifier = number | string;

const queryString = (filters: Record<string, string | number | undefined> = {}) => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return query.size ? `?${query.toString()}` : '';
};

const request = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      data?.msg || `La solicitud no pudo completarse (${response.status})`,
    ) as Error & { conflictos?: string[] };
    error.conflictos = Array.isArray(data?.conflictos) ? data.conflictos : [];
    throw error;
  }
  return data as T;
};

export type SchoolPeriod = {
  id: number;
  uuid: string;
  nombre: string;
  nivelId: number;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  nivel?: EducationalLevel;
};

export type ClassroomType =
  | 'aula'
  | 'computo'
  | 'laboratorio'
  | 'taller'
  | 'auditorio';

export type Classroom = {
  id: number;
  uuid: string;
  nombre: string;
  edificio?: string | null;
  capacidad: number;
  tipo: ClassroomType;
  nivelId: number;
  activo: boolean;
  nivel?: EducationalLevel;
};

export type ScheduleBlock = {
  id: number;
  uuid: string;
  periodoId: number;
  numero: number;
  horaInicio: string;
  horaFin: string;
  tipo: 'clase' | 'receso';
  activo: boolean;
};

export type TeacherAvailability = {
  id: number;
  uuid: string;
  periodoId: number;
  maestroId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  tipo: 'disponible' | 'no_disponible' | 'preferido';
  maestro?: AcademicTeacher;
};

export type AcademicLoad = {
  id: number;
  uuid: string;
  periodoId: number;
  gradoId: number;
  materiaId: number;
  maestroId: number;
  sesionesSemana: number;
  bloquesPorSesion: number;
  maximoPorDia: number;
  tipoSalon: 'cualquiera' | ClassroomType;
  periodo?: SchoolPeriod;
  grado?: AcademicGroup;
  materia?: Subject;
  maestro?: AcademicTeacher;
};

export type ScheduledClass = {
  id: number;
  uuid: string;
  sesionUuid: string;
  diaSemana: number;
  bloqueId: number;
  maestroId: number;
  salonId: number;
  materiaId: number;
  bloque: ScheduleBlock;
  salon: Classroom;
  materia: Subject;
  maestro: AcademicTeacher;
};

export type ScheduleConfiguration = {
  dias: number[];
  horaInicio: string;
  horaFin: string;
  maximoConsecutivas: number;
  evitarHuecos: boolean;
};

export type SchoolSchedule = {
  id: number;
  uuid: string;
  periodoId: number;
  gradoId: number;
  estado: 'borrador' | 'publicado' | 'archivado';
  configuracion?: ScheduleConfiguration | string | null;
  publicadoAt?: string | null;
  periodo?: SchoolPeriod;
  grado?: AcademicGroup;
  clases: ScheduledClass[];
};

export type GenerateSchedulePayload = ScheduleConfiguration & {
  periodoId: number;
  gradoId: number;
};

export const scheduleService = {
  getPeriods: (nivelId?: number) =>
    request<SchoolPeriod[]>(
      `/periodos-escolares${queryString({ nivelId })}`,
    ),
  createPeriod: (payload: Omit<SchoolPeriod, 'id' | 'uuid' | 'nivel'>) =>
    request<{ msg: string; periodo: SchoolPeriod }>('/periodos-escolares', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updatePeriod: (id: Identifier, payload: Partial<SchoolPeriod>) =>
    request<{ msg: string; periodo: SchoolPeriod }>(`/periodos-escolares/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deletePeriod: (id: Identifier) =>
    request<{ msg: string }>(`/periodos-escolares/${id}`, { method: 'DELETE' }),

  getClassrooms: (nivelId?: number) =>
    request<Classroom[]>(`/salones${queryString({ nivelId })}`),
  createClassroom: (
    payload: Omit<Classroom, 'id' | 'uuid' | 'nivel'>,
  ) =>
    request<{ msg: string; salon: Classroom }>('/salones', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateClassroom: (id: Identifier, payload: Partial<Classroom>) =>
    request<{ msg: string; salon: Classroom }>(`/salones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteClassroom: (id: Identifier) =>
    request<{ msg: string }>(`/salones/${id}`, { method: 'DELETE' }),

  getBlocks: (periodoId: number) =>
    request<ScheduleBlock[]>(`/bloques-horario${queryString({ periodoId })}`),
  generateBlocks: (payload: {
    periodoId: number;
    horaInicio: string;
    horaFin: string;
    duracionMinutos: number;
    cambioMinutos: number;
    recesoInicio?: string;
    recesoFin?: string;
  }) =>
    request<{ msg: string; bloques: ScheduleBlock[] }>('/bloques-horario/generar', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAvailability: (periodoId: number, maestroId?: number) =>
    request<TeacherAvailability[]>(
      `/disponibilidad-maestros${queryString({ periodoId, maestroId })}`,
    ),
  createAvailability: (payload: Omit<TeacherAvailability, 'id' | 'uuid' | 'maestro'>) =>
    request<{ msg: string; disponibilidad: TeacherAvailability }>(
      '/disponibilidad-maestros',
      { method: 'POST', body: JSON.stringify(payload) },
    ),
  deleteAvailability: (id: Identifier) =>
    request<{ msg: string }>(`/disponibilidad-maestros/${id}`, { method: 'DELETE' }),

  getLoads: (filters: { periodoId?: number; gradoId?: number } = {}) =>
    request<AcademicLoad[]>(`/cargas-academicas${queryString(filters)}`),
  createLoad: (payload: Omit<AcademicLoad, 'id' | 'uuid' | 'periodo' | 'grado' | 'materia' | 'maestro'>) =>
    request<{ msg: string; carga: AcademicLoad }>('/cargas-academicas', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteLoad: (id: Identifier) =>
    request<{ msg: string }>(`/cargas-academicas/${id}`, { method: 'DELETE' }),

  getSchedules: (filters: { periodoId?: number; gradoId?: number } = {}) =>
    request<SchoolSchedule[]>(`/horarios${queryString(filters)}`),
  getSchedule: (id: Identifier) => request<SchoolSchedule>(`/horarios/${id}`),
  generateSchedule: (payload: GenerateSchedulePayload) =>
    request<{
      msg: string;
      horario: SchoolSchedule;
      resumen: { sesiones: number; bloques: number; iteraciones: number };
    }>('/horarios/generar', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  publishSchedule: (id: Identifier) =>
    request<{ msg: string; horario: SchoolSchedule }>(`/horarios/${id}/publicar`, {
      method: 'POST',
    }),
  deleteSchedule: (id: Identifier) =>
    request<{ msg: string }>(`/horarios/${id}`, { method: 'DELETE' }),
};
