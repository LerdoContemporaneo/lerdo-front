"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import AppLayout from "../../components/AppLayout";
import Toast from "../../components/ui/Toast";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../hooks/useAuth";
import {
  attendanceService,
  homeworkService,
  reportService,
  studentService,
} from "../../services/schoolService";

type Teacher = {
  id: number;
  uuid?: string;
  name: string;
  email?: string;
};

type Grade = {
  id: number;
  uuid?: string;
  nombre: string;
  maestroId?: number | null;
  maestro?: Teacher | null;
};

type StudentProfile = {
  id: number;
  uuid: string;
  nombre: string;
  apellido: string;
  matricula: string;
  tutor?: string;
  telefonoTutor?: string | null;
  userId: number;
  gradoId: number;
  grado?: Grade | null;
  Grado?: Grade | null;
};

type Homework = {
  id: number;
  uuid: string;
  titulo: string;
  descripcion?: string;
  fechaAsignacion?: string;
  fechaEntrega: string;
  gradoId?: number;
  grado?: Grade | null;
};

type Report = {
  id: number;
  uuid: string;
  titulo: string;
  contenido?: string;
  createdAt: string;
  maestro?: Teacher | null;
  grado?: Grade | null;
};

type AttendanceStatus = "Presente" | "Ausente" | "Tarde" | "Justificado";

type AttendanceRecord = {
  id: number;
  uuid?: string;
  fecha: string;
  estado: AttendanceStatus;
  alumnoId: number;
  gradoId?: number | null;
};

type ToastState = {
  message: string;
  type: "success" | "error";
};

type SummaryCardProps = {
  icon: string;
  title: string;
  value: string | number;
  description: string;
  valueClassName: string;
};

type TaskStatus = {
  label: string;
  className: string;
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

const getDateOnly = (value?: string) => (value ? value.slice(0, 10) : "");

const getLocalToday = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const formatDate = (value?: string) => {
  const dateOnly = getDateOnly(value);

  if (!dateOnly) return "Sin fecha";

  return new Date(`${dateOnly}T12:00:00`).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getTaskStatus = (deliveryDate: string, today: string): TaskStatus => {
  const date = getDateOnly(deliveryDate);

  if (date === today) {
    return {
      label: "Vence hoy",
      className: "bg-orange-100 text-orange-700",
    };
  }

  if (date < today) {
    return {
      label: "Vencida",
      className: "bg-red-100 text-red-700",
    };
  }

  return {
    label: "Vigente",
    className: "bg-emerald-100 text-emerald-700",
  };
};

const getAttendanceStyle = (status: AttendanceStatus) => {
  const styles: Record<AttendanceStatus, string> = {
    Presente: "bg-emerald-100 text-emerald-700",
    Ausente: "bg-red-100 text-red-700",
    Tarde: "bg-amber-100 text-amber-700",
    Justificado: "bg-blue-100 text-blue-700",
  };

  return styles[status];
};

function SummaryCard({
  icon,
  title,
  value,
  description,
  valueClassName,
}: SummaryCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className={`mt-2 text-3xl font-bold ${valueClassName}`}>{value}</p>
        </div>

        <span className="text-3xl" aria-hidden="true">
          {icon}
        </span>
      </div>

      <p className="mt-2 text-xs text-gray-500">{description}</p>
    </article>
  );
}

export default function AlumnoDashboard() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);

  const today = useMemo(() => getLocalToday(), []);

  const loadMyData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [studentsData, homeworkData, reportsData, attendanceData] =
        await Promise.all([
          studentService.getAll(),
          homeworkService.getAll(),
          reportService.getAll(),
          attendanceService.getAll(),
        ]);

      /*
       * GET /alumnos ya debe devolver únicamente el perfil
       * relacionado con la sesión del alumno.
       */
      const currentProfile = asArray<StudentProfile>(studentsData)[0] ?? null;

      setProfile(currentProfile);

      /*
       * El backend es responsable de devolver únicamente las
       * tareas y reportes autorizados para el alumno.
       * No se compara por nombre ni por UUID.
       */
      setHomework(asArray<Homework>(homeworkData));
      setReports(asArray<Report>(reportsData));

      /*
       * Esta validación mantiene la vista personal incluso
       * mientras se termina de asegurar GET /asistencia.
       */
      const personalAttendance = currentProfile
        ? asArray<AttendanceRecord>(attendanceData).filter(
            (record) => Number(record.alumnoId) === Number(currentProfile.id),
          )
        : [];

      setAttendance(personalAttendance);

      if (!currentProfile) {
        setError(
          "Tu usuario todavía no está vinculado con un perfil de alumno. Solicita apoyo al administrador.",
        );
      }
    } catch (loadError) {
      console.error("Error cargando el panel del alumno:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "No fue posible cargar tu información.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void loadMyData();
    }
  }, [user, loadMyData]);

  const grade = profile?.grado ?? profile?.Grado ?? null;
  const teacher = grade?.maestro ?? null;

  const studentName = profile
    ? `${profile.nombre} ${profile.apellido}`.trim()
    : user?.name || "Alumno";

  const sortedHomework = useMemo(
    () =>
      [...homework].sort((a, b) =>
        getDateOnly(a.fechaEntrega).localeCompare(getDateOnly(b.fechaEntrega)),
      ),
    [homework],
  );

  const activeHomework = useMemo(
    () =>
      sortedHomework.filter((task) => getDateOnly(task.fechaEntrega) >= today),
    [sortedHomework, today],
  );

  const overdueHomework = useMemo(
    () =>
      sortedHomework.filter((task) => getDateOnly(task.fechaEntrega) < today),
    [sortedHomework, today],
  );

  const visibleHomework = useMemo(
    () => [...activeHomework, ...[...overdueHomework].reverse()].slice(0, 6),
    [activeHomework, overdueHomework],
  );

  const recentReports = useMemo(
    () =>
      [...reports]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5),
    [reports],
  );

  const recentAttendance = useMemo(
    () =>
      [...attendance]
        .sort((a, b) =>
          getDateOnly(b.fecha).localeCompare(getDateOnly(a.fecha)),
        )
        .slice(0, 5),
    [attendance],
  );

  const attendanceSummary = useMemo(() => {
    const present = attendance.filter(
      (record) => record.estado === "Presente",
    ).length;
    const absent = attendance.filter(
      (record) => record.estado === "Ausente",
    ).length;
    const late = attendance.filter(
      (record) => record.estado === "Tarde",
    ).length;
    const justified = attendance.filter(
      (record) => record.estado === "Justificado",
    ).length;
    const total = attendance.length;

    /*
     * "Tarde" cuenta como asistencia. Las faltas justificadas
     * se muestran aparte y no elevan el porcentaje.
     */
    const percentage =
      total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      late,
      justified,
      percentage,
    };
  }, [attendance]);

  const greetingDate = useMemo(
    () =>
      new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date()),
    [],
  );

  const downloadPDF = () => {
    if (reports.length === 0) {
      setToast({
        message: "No tienes reportes para descargar.",
        type: "error",
      });
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(99, 3, 48);
    doc.text("Historial de Reportes - Control CELC", 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Alumno: ${studentName}`, 14, 32);
    doc.text(`Matrícula: ${profile?.matricula || "Sin matrícula"}`, 14, 39);
    doc.text(`Grupo: ${grade?.nombre || "Sin grupo asignado"}`, 14, 46);

    autoTable(doc, {
      startY: 54,
      headStyles: {
        fillColor: [99, 3, 48],
      },
      head: [["Fecha", "Motivo", "Descripción", "Maestro"]],
      body: reports.map((report) => [
        formatDate(report.createdAt),
        report.titulo || "Sin título",
        report.contenido || "Sin descripción",
        report.maestro?.name || "No disponible",
      ]),
    });

    const safeName = studentName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    doc.save(`Reportes_${safeName || "Alumno"}.pdf`);

    setToast({
      message: "PDF descargado correctamente.",
      type: "success",
    });
  };

  return (
    <ProtectedRoute allowedRoles={["alumno"]}>
      <AppLayout>
        <div className="space-y-7">
          <section className="rounded-2xl bg-gradient-to-r from-[#630330] to-red-800 p-7 text-white shadow-lg">
            <p className="text-sm capitalize text-red-200">{greetingDate}</p>

            <div className="mt-2 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">¡Hola, {studentName}! 👋</h1>

                <p className="mt-2 text-red-100">
                  Consulta tus tareas, asistencia y reportes escolares.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-white/15 px-4 py-2">
                  Matrícula:{" "}
                  <strong>{profile?.matricula || "Pendiente"}</strong>
                </span>

                <span className="rounded-full bg-white/15 px-4 py-2">
                  Grupo: <strong>{grade?.nombre || "Sin asignar"}</strong>
                </span>
              </div>
            </div>
          </section>

          {loading ? (
            <section className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
              Cargando tu información...
            </section>
          ) : (
            <>
              {error && (
                <section className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm">{error}</p>

                  <button
                    type="button"
                    onClick={() => void loadMyData()}
                    className="text-sm font-semibold underline"
                  >
                    Reintentar
                  </button>
                </section>
              )}

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  icon="📚"
                  title="Tareas vigentes"
                  value={activeHomework.length}
                  description="Con fecha de entrega pendiente"
                  valueClassName="text-blue-700"
                />

                <SummaryCard
                  icon="⏰"
                  title="Tareas vencidas"
                  value={overdueHomework.length}
                  description="Calculadas por la fecha de entrega"
                  valueClassName={
                    overdueHomework.length > 0
                      ? "text-red-700"
                      : "text-emerald-700"
                  }
                />

                <SummaryCard
                  icon="✅"
                  title="Asistencia"
                  value={`${attendanceSummary.percentage}%`}
                  description={
                    attendanceSummary.total > 0
                      ? `${attendanceSummary.present} presentes y ${attendanceSummary.late} retardos`
                      : "Todavía no hay registros"
                  }
                  valueClassName="text-emerald-700"
                />

                <SummaryCard
                  icon="⚠️"
                  title="Mis reportes"
                  value={reports.length}
                  description="Reportes asociados a tu perfil"
                  valueClassName={
                    reports.length > 0 ? "text-amber-700" : "text-gray-700"
                  }
                />
              </section>

              <section className="grid gap-6 lg:grid-cols-3">
                <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Mis tareas
                      </h2>

                      <p className="text-sm text-gray-500">
                        Primero aparecen las entregas más próximas.
                      </p>
                    </div>

                    <span className="text-sm font-medium text-gray-500">
                      {homework.length}{" "}
                      {homework.length === 1 ? "tarea" : "tareas"}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {visibleHomework.length === 0 ? (
                      <div className="rounded-lg bg-gray-50 p-8 text-center">
                        <p className="text-3xl">🎉</p>
                        <p className="mt-2 font-semibold text-gray-700">
                          No tienes tareas asignadas.
                        </p>
                      </div>
                    ) : (
                      visibleHomework.map((task) => {
                        const status = getTaskStatus(task.fechaEntrega, today);

                        return (
                          <div
                            key={task.uuid || task.id}
                            className="rounded-lg border border-gray-100 p-4 transition hover:border-red-200 hover:bg-red-50/30"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-gray-900">
                                  {task.titulo}
                                </h3>

                                {task.descripcion && (
                                  <p className="mt-1 text-sm text-gray-600">
                                    {task.descripcion}
                                  </p>
                                )}

                                <p className="mt-2 text-xs text-gray-500">
                                  Entrega: {formatDate(task.fechaEntrega)}
                                </p>
                              </div>

                              <span
                                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {homework.length > visibleHomework.length && (
                    <p className="mt-4 text-center text-xs text-gray-500">
                      Se muestran las primeras {visibleHomework.length} tareas.
                    </p>
                  )}
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900">
                    Mi información
                  </h2>

                  <div className="mt-5 space-y-4 text-sm">
                    <div>
                      <p className="text-gray-500">Matrícula</p>
                      <p className="font-semibold text-gray-900">
                        {profile?.matricula || "No disponible"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Grupo</p>
                      <p className="font-semibold text-gray-900">
                        {grade?.nombre || "Sin grupo asignado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Maestro responsable</p>
                      <p className="font-semibold text-gray-900">
                        {teacher?.name || "Sin asignar"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Tutor</p>
                      <p className="font-semibold text-gray-900">
                        {profile?.tutor || "No disponible"}
                      </p>
                    </div>

                    {profile?.telefonoTutor && (
                      <div>
                        <p className="text-gray-500">Teléfono del tutor</p>
                        <p className="font-semibold text-gray-900">
                          {profile.telefonoTutor}
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              </section>

              <section className="grid gap-6 lg:grid-cols-2">
                <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Asistencia reciente
                      </h2>

                      <p className="text-sm text-gray-500">
                        Tus últimos registros escolares.
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-gray-600">
                      {attendanceSummary.total} registros
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {recentAttendance.length === 0 ? (
                      <p className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
                        Todavía no hay asistencias registradas.
                      </p>
                    ) : (
                      recentAttendance.map((record) => (
                        <div
                          key={record.uuid || record.id}
                          className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                        >
                          <span className="text-sm text-gray-700">
                            {formatDate(record.fecha)}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getAttendanceStyle(
                              record.estado,
                            )}`}
                          >
                            {record.estado}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {attendanceSummary.total > 0 && (
                    <div className="mt-5 grid grid-cols-2 gap-3 text-center text-xs sm:grid-cols-4">
                      <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                        <p className="text-lg font-bold">
                          {attendanceSummary.present}
                        </p>
                        <p>Presentes</p>
                      </div>

                      <div className="rounded-lg bg-red-50 p-3 text-red-700">
                        <p className="text-lg font-bold">
                          {attendanceSummary.absent}
                        </p>
                        <p>Ausencias</p>
                      </div>

                      <div className="rounded-lg bg-amber-50 p-3 text-amber-700">
                        <p className="text-lg font-bold">
                          {attendanceSummary.late}
                        </p>
                        <p>Retardos</p>
                      </div>

                      <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
                        <p className="text-lg font-bold">
                          {attendanceSummary.justified}
                        </p>
                        <p>Justificadas</p>
                      </div>
                    </div>
                  )}
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Mis reportes
                      </h2>

                      <p className="text-sm text-gray-500">
                        Historial asociado a tu perfil.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={downloadPDF}
                      disabled={reports.length === 0}
                      className="rounded-md bg-[#630330] px-4 py-2 text-sm font-medium text-white transition hover:bg-red-950 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Descargar PDF
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {recentReports.length === 0 ? (
                      <p className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
                        No tienes reportes registrados.
                      </p>
                    ) : (
                      recentReports.map((report) => (
                        <div
                          key={report.uuid || report.id}
                          className="rounded-lg border border-gray-100 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900">
                                {report.titulo}
                              </h3>

                              {report.contenido && (
                                <p className="mt-1 text-sm text-gray-600">
                                  {report.contenido}
                                </p>
                              )}

                              <p className="mt-2 text-xs text-gray-500">
                                Maestro:{" "}
                                {report.maestro?.name ||
                                  teacher?.name ||
                                  "No disponible"}
                              </p>
                            </div>

                            <span className="whitespace-nowrap text-xs text-gray-500">
                              {formatDate(report.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              </section>
            </>
          )}
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}