'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';

import AppLayout from '../../components/AppLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';

import {
  attendanceService,
  gradeService,
  homeworkService,
  reportService,
  studentService,
} from '../../services/schoolService';

type Teacher = {
  id: number;
  uuid?: string;
  name: string;
};

type Grade = {
  id: number;
  uuid: string;
  nombre: string;
  maestroId: number | null;
  maestro?: Teacher | null;
};

type Student = {
  id: number;
  uuid: string;
  nombre: string;
  apellido: string;
  matricula: string;
  gradoId?: number | null;
  grado?: Grade | null;
  Grado?: Grade | null;
};

type AttendanceRecord = {
  id: number;
  fecha: string;
  estado: string;
  alumnoId: number;
  gradoId?: number | null;
  grado?: Grade | null;
};

type Homework = {
  id: number;
  uuid: string;
  titulo: string;
  descripcion?: string;
  fechaAsignacion: string;
  fechaEntrega: string;
  alumnoId?: number;
  gradoId?: number;
  grado?: Grade | null;
  alumno?: Student | null;
  Alumno?: Student | null;
};

type Report = {
  id: number;
  uuid: string;
  titulo: string;
  contenido?: string;
  alumnoId: number;
  maestroId: number;
  gradoId?: number;
  createdAt: string;
  alumno?: Student | null;
  grado?: Grade | null;
};

type SummaryCardProps = {
  icon: string;
  title: string;
  value: number;
  description: string;
  colorClass: string;
};

const getLocalDate = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60_000)
    .toISOString()
    .slice(0, 10);
};

const addDays = (dateString: string, days: number) => {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
};

const formatDate = (date?: string) => {
  if (!date) return 'Sin fecha';

  return new Date(`${date.slice(0, 10)}T12:00:00`)
    .toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
};

const getStudentGrade = (student: Student) =>
  student.grado ?? student.Grado ?? null;

function SummaryCard({
  icon,
  title,
  value,
  description,
  colorClass,
}: SummaryCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className={`mt-2 text-3xl font-bold ${colorClass}`}>
            {value}
          </p>
        </div>

        <span className="text-3xl" aria-hidden="true">
          {icon}
        </span>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {description}
      </p>
    </article>
  );
}

export default function MaestroDashboard() {
  const { user } = useAuth();

  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] =
    useState<AttendanceRecord[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'administrador';
  const currentUserId = Number(user?.id ?? 0);

  const today = useMemo(() => getLocalDate(), []);
  const nextWeek = useMemo(() => addDays(today, 7), [today]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [
        gradesData,
        studentsData,
        attendanceData,
        homeworkData,
        reportsData,
      ] = await Promise.all([
        gradeService.getAll(),
        studentService.getAll(),
        attendanceService.getAll(),
        homeworkService.getAll(),
        reportService.getAll(),
      ]);

      setGrades(
        Array.isArray(gradesData) ? gradesData : []
      );

      setStudents(
        Array.isArray(studentsData) ? studentsData : []
      );

      setAttendance(
        Array.isArray(attendanceData)
          ? attendanceData
          : []
      );

      setHomework(
        Array.isArray(homeworkData) ? homeworkData : []
      );

      setReports(
        Array.isArray(reportsData) ? reportsData : []
      );
    } catch (dashboardError) {
      console.error(
        'Error cargando el panel del maestro:',
        dashboardError
      );

      setError(
        dashboardError instanceof Error
          ? dashboardError.message
          : 'No fue posible cargar el panel.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void loadDashboard();
    }
  }, [user, loadDashboard]);

  const availableGrades = useMemo(() => {
    if (isAdmin) {
      return grades;
    }

    return grades.filter((grade) => {
      const sameId =
        Number(grade.maestroId) === currentUserId;

      const sameUuid =
        Boolean(user?.uuid) &&
        grade.maestro?.uuid === user?.uuid;

      return sameId || sameUuid;
    });
  }, [
    grades,
    isAdmin,
    currentUserId,
    user?.uuid,
  ]);

  const availableGradeIds = useMemo(
    () =>
      new Set(
        availableGrades.map((grade) =>
          Number(grade.id)
        )
      ),
    [availableGrades]
  );

  const getStudentGradeId = useCallback(
    (student: Student) =>
      Number(
        student.gradoId ??
          getStudentGrade(student)?.id ??
          0
      ),
    []
  );

  const visibleStudents = useMemo(() => {
    if (isAdmin) {
      return students;
    }

    return students.filter((student) =>
      availableGradeIds.has(
        getStudentGradeId(student)
      )
    );
  }, [
    students,
    isAdmin,
    availableGradeIds,
    getStudentGradeId,
  ]);

  const studentById = useMemo(
    () =>
      new Map(
        visibleStudents.map((student) => [
          Number(student.id),
          student,
        ])
      ),
    [visibleStudents]
  );

  const todayAttendance = useMemo(
    () =>
      attendance.filter(
        (record) =>
          record.fecha?.slice(0, 10) === today
      ),
    [attendance, today]
  );

  const groupSummaries = useMemo(() => {
    return availableGrades.map((grade) => {
      const groupStudents = visibleStudents.filter(
        (student) =>
          getStudentGradeId(student) ===
          Number(grade.id)
      );

      const registeredStudents = new Set<number>();

      todayAttendance.forEach((record) => {
        const student = studentById.get(
          Number(record.alumnoId)
        );

        const recordGradeId = Number(
          record.gradoId ??
            record.grado?.id ??
            (student
              ? getStudentGradeId(student)
              : 0)
        );

        if (recordGradeId === Number(grade.id)) {
          registeredStudents.add(
            Number(record.alumnoId)
          );
        }
      });

      const totalStudents = groupStudents.length;
      const attendanceRegistered =
        registeredStudents.size;

      return {
        grade,
        totalStudents,
        attendanceRegistered,
        pendingStudents: Math.max(
          totalStudents - attendanceRegistered,
          0
        ),
        completed:
          totalStudents > 0 &&
          attendanceRegistered >= totalStudents,
      };
    });
  }, [
    availableGrades,
    visibleStudents,
    todayAttendance,
    studentById,
    getStudentGradeId,
  ]);

  const pendingAttendanceGroups = useMemo(
    () =>
      groupSummaries.filter(
        (summary) =>
          summary.totalStudents > 0 &&
          !summary.completed
      ).length,
    [groupSummaries]
  );

  /*
   * Permite calcular el grupo incluso mientras el backend
   * todavía maneja tareas relacionadas con alumnoId.
   */
  const getHomeworkGradeId = useCallback(
    (task: Homework) => {
      if (task.gradoId) {
        return Number(task.gradoId);
      }

      if (task.grado?.id) {
        return Number(task.grado.id);
      }

      const nestedStudent =
        task.alumno ?? task.Alumno;

      if (nestedStudent) {
        return getStudentGradeId(nestedStudent);
      }

      if (task.alumnoId) {
        const student = studentById.get(
          Number(task.alumnoId)
        );

        if (student) {
          return getStudentGradeId(student);
        }
      }

      return 0;
    },
    [
      studentById,
      getStudentGradeId,
    ]
  );

  /*
   * Si el modelo anterior creó una copia de la misma tarea
   * por alumno, se muestra una sola vez por grupo.
   */
  const uniqueHomework = useMemo(() => {
    const taskMap = new Map<string, Homework>();

    homework.forEach((task) => {
      const gradeId = getHomeworkGradeId(task);

      if (
        !isAdmin &&
        (!gradeId ||
          !availableGradeIds.has(gradeId))
      ) {
        return;
      }

      const key = [
        gradeId,
        task.titulo.trim().toLowerCase(),
        task.descripcion?.trim().toLowerCase() ?? '',
        task.fechaAsignacion?.slice(0, 10),
        task.fechaEntrega?.slice(0, 10),
      ].join('|');

      if (!taskMap.has(key)) {
        taskMap.set(key, task);
      }
    });

    return Array.from(taskMap.values());
  }, [
    homework,
    isAdmin,
    availableGradeIds,
    getHomeworkGradeId,
  ]);

  const activeHomework = useMemo(
    () =>
      uniqueHomework
        .filter(
          (task) =>
            task.fechaEntrega?.slice(0, 10) >= today
        )
        .sort((a, b) =>
          a.fechaEntrega.localeCompare(
            b.fechaEntrega
          )
        ),
    [uniqueHomework, today]
  );

  const homeworkDueSoon = useMemo(
    () =>
      activeHomework.filter((task) => {
        const deadline =
          task.fechaEntrega.slice(0, 10);

        return (
          deadline >= today &&
          deadline <= nextWeek
        );
      }),
    [activeHomework, today, nextWeek]
  );

  const recentReports = useMemo(() => {
    return reports
      .filter((report) => {
        if (isAdmin) return true;

        const gradeId = Number(
          report.gradoId ??
            report.grado?.id ??
            0
        );

        return (
          !gradeId ||
          availableGradeIds.has(gradeId)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [
    reports,
    isAdmin,
    availableGradeIds,
  ]);

  const greetingDate = useMemo(
    () =>
      new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date()),
    []
  );

  return (
    <ProtectedRoute
      allowedRoles={['maestro', 'administrador']}
    >
      <AppLayout>
        <div className="space-y-7">
          <section className="rounded-2xl bg-gradient-to-r from-red-950 to-red-800 p-7 text-white shadow-lg">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm capitalize text-red-200">
                  {greetingDate}
                </p>

                <h1 className="mt-1 text-3xl font-bold">
                  Bienvenido, {user?.name}
                </h1>

                <p className="mt-2 text-red-100">
                  {isAdmin
                    ? 'Vista general de la actividad docente.'
                    : 'Consulta tus grupos y actividades pendientes.'}
                </p>
              </div>

              <Link
                href="/asistencias"
                className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 font-semibold text-red-900 shadow transition hover:bg-red-50"
              >
                📋 Pasar lista
              </Link>
            </div>
          </section>

          {error && (
            <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="font-semibold underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
              Cargando información del maestro...
            </div>
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <SummaryCard
                  icon="🏫"
                  title="Mis grupos"
                  value={availableGrades.length}
                  description="Grupos asignados al maestro"
                  colorClass="text-red-900"
                />

                <SummaryCard
                  icon="🎓"
                  title="Mis alumnos"
                  value={visibleStudents.length}
                  description="Alumnos de todos tus grupos"
                  colorClass="text-blue-700"
                />

                <SummaryCard
                  icon="📋"
                  title="Listas pendientes"
                  value={pendingAttendanceGroups}
                  description="Grupos sin asistencia completa hoy"
                  colorClass={
                    pendingAttendanceGroups > 0
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }
                />

                <SummaryCard
                  icon="📝"
                  title="Tareas activas"
                  value={activeHomework.length}
                  description="Tareas cuya entrega no ha vencido"
                  colorClass="text-purple-700"
                />

                <SummaryCard
                  icon="⏰"
                  title="Próximas a vencer"
                  value={homeworkDueSoon.length}
                  description="Entregas durante los próximos 7 días"
                  colorClass="text-orange-600"
                />
              </section>

              {availableGrades.length === 0 ? (
                <section className="rounded-xl border border-amber-300 bg-amber-50 p-6">
                  <h2 className="font-bold text-amber-900">
                    No tienes grupos asignados
                  </h2>

                  <p className="mt-2 text-sm text-amber-800">
                    Solicita al administrador que te
                    asigne uno o más grupos antes de
                    registrar asistencia, tareas o
                    reportes.
                  </p>

                  {isAdmin && (
                    <Link
                      href="/grupos"
                      className="mt-4 inline-flex rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
                    >
                      Administrar grupos
                    </Link>
                  )}
                </section>
              ) : (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Grupos asignados
                      </h2>

                      <p className="text-sm text-gray-500">
                        Avance del pase de lista de hoy
                      </p>
                    </div>

                    <Link
                      href="/alumnos"
                      className="text-sm font-semibold text-red-900 hover:underline"
                    >
                      Ver alumnos
                    </Link>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {groupSummaries.map((summary) => {
                      const progress =
                        summary.totalStudents > 0
                          ? Math.round(
                              (summary.attendanceRegistered /
                                summary.totalStudents) *
                                100
                            )
                          : 0;

                      return (
                        <article
                          key={summary.grade.uuid}
                          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">
                                {summary.grade.nombre}
                              </h3>

                              <p className="mt-1 text-sm text-gray-500">
                                {summary.totalStudents}{' '}
                                {summary.totalStudents === 1
                                  ? 'alumno'
                                  : 'alumnos'}
                              </p>
                            </div>

                            {summary.totalStudents === 0 ? (
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                Sin alumnos
                              </span>
                            ) : summary.completed ? (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Lista completa
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                {summary.pendingStudents}{' '}
                                pendientes
                              </span>
                            )}
                          </div>

                          <div className="mt-5">
                            <div className="mb-2 flex justify-between text-xs text-gray-500">
                              <span>
                                Asistencia registrada
                              </span>

                              <span>
                                {
                                  summary.attendanceRegistered
                                }
                                /{summary.totalStudents}
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className={
                                  summary.completed
                                    ? 'h-full rounded-full bg-emerald-500'
                                    : 'h-full rounded-full bg-red-800'
                                }
                                style={{
                                  width: `${progress}%`,
                                }}
                              />
                            </div>
                          </div>

                          <Link
                            href="/asistencias"
                            className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-red-900 px-4 py-2 text-sm font-semibold text-red-900 transition hover:bg-red-50"
                          >
                            {summary.completed
                              ? 'Consultar asistencia'
                              : 'Pasar lista'}
                          </Link>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="grid gap-6 lg:grid-cols-2">
                <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Próximas entregas
                      </h2>

                      <p className="text-sm text-gray-500">
                        Tareas activas más cercanas
                      </p>
                    </div>

                    <Link
                      href="/tareas"
                      className="text-sm font-semibold text-red-900 hover:underline"
                    >
                      Administrar
                    </Link>
                  </div>

                  <div className="mt-5 space-y-3">
                    {activeHomework.length === 0 ? (
                      <p className="rounded-lg bg-gray-50 p-5 text-center text-sm text-gray-500">
                        No hay tareas activas.
                      </p>
                    ) : (
                      activeHomework
                        .slice(0, 5)
                        .map((task) => {
                          const gradeId =
                            getHomeworkGradeId(task);

                          const grade =
                            availableGrades.find(
                              (item) =>
                                Number(item.id) ===
                                gradeId
                            );

                          return (
                            <div
                              key={task.uuid}
                              className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 p-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-gray-800">
                                  {task.titulo}
                                </p>

                                <p className="text-xs text-gray-500">
                                  {grade?.nombre ||
                                    'Grupo no disponible'}
                                </p>
                              </div>

                              <span className="whitespace-nowrap text-sm font-medium text-red-800">
                                {formatDate(
                                  task.fechaEntrega
                                )}
                              </span>
                            </div>
                          );
                        })
                    )}
                  </div>
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Reportes recientes
                      </h2>

                      <p className="text-sm text-gray-500">
                        Últimos reportes registrados
                      </p>
                    </div>

                    <Link
                      href="/reportes"
                      className="text-sm font-semibold text-red-900 hover:underline"
                    >
                      Ver todos
                    </Link>
                  </div>

                  <div className="mt-5 space-y-3">
                    {recentReports.length === 0 ? (
                      <p className="rounded-lg bg-gray-50 p-5 text-center text-sm text-gray-500">
                        No hay reportes recientes.
                      </p>
                    ) : (
                      recentReports.map((report) => (
                        <div
                          key={report.uuid}
                          className="rounded-lg border border-gray-100 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-800">
                                {report.titulo}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {report.alumno
                                  ? `${report.alumno.nombre} ${report.alumno.apellido}`
                                  : 'Alumno no disponible'}
                              </p>
                            </div>

                            <span className="whitespace-nowrap text-xs text-gray-500">
                              {formatDate(
                                report.createdAt
                              )}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link
                  href="/asistencias"
                  className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm transition hover:border-red-300 hover:shadow-md"
                >
                  <span className="text-3xl">📋</span>
                  <p className="mt-2 font-bold text-gray-800">
                    Pasar lista
                  </p>
                </Link>

                <Link
                  href="/tareas"
                  className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm transition hover:border-red-300 hover:shadow-md"
                >
                  <span className="text-3xl">📝</span>
                  <p className="mt-2 font-bold text-gray-800">
                    Asignar tarea
                  </p>
                </Link>

                <Link
                  href="/reportes"
                  className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm transition hover:border-red-300 hover:shadow-md"
                >
                  <span className="text-3xl">⚠️</span>
                  <p className="mt-2 font-bold text-gray-800">
                    Crear reporte
                  </p>
                </Link>

                <Link
                  href="/configuracion"
                  className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm transition hover:border-red-300 hover:shadow-md"
                >
                  <span className="text-3xl">🔒</span>
                  <p className="mt-2 font-bold text-gray-800">
                    Configuración
                  </p>
                </Link>
              </section>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}