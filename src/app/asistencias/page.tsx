"use client";

import React, { useEffect, useMemo, useState } from "react";

import AppLayout from "../components/AppLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import Pagination from "../components/ui/Pagination";
import {
  attendanceService,
  gradeService,
  studentService,
} from "../services/schoolService";
import { useAuth } from "../hooks/useAuth";

type AttendanceStatus = "Presente" | "Ausente" | "Tarde" | "Justificado";

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
  uuid: string;
  fecha: string;
  estado: AttendanceStatus;
  alumnoId: number;
  gradoId?: number | null;
  comentario?: string | null;
  alumno?: Student | null;
  grado?: Grade | null;
};

type AttendanceDraft = {
  estado: AttendanceStatus;
  comentario: string;
};

type Tab = "capture" | "history";

const PAGE_SIZE = 8;

const STATUS_OPTIONS: Array<{
  value: AttendanceStatus;
  shortLabel: string;
  label: string;
  buttonClass: string;
  badgeClass: string;
}> = [
  {
    value: "Presente",
    shortLabel: "P",
    label: "Presente",
    buttonClass:
      "border-emerald-500 bg-emerald-50 text-emerald-700 ring-emerald-100",
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "Ausente",
    shortLabel: "F",
    label: "Falta",
    buttonClass: "border-rose-500 bg-rose-50 text-rose-700 ring-rose-100",
    badgeClass: "bg-rose-100 text-rose-700",
  },
  {
    value: "Tarde",
    shortLabel: "R",
    label: "Retardo",
    buttonClass: "border-amber-500 bg-amber-50 text-amber-700 ring-amber-100",
    badgeClass: "bg-amber-100 text-amber-700",
  },
  {
    value: "Justificado",
    shortLabel: "J",
    label: "Justificada",
    buttonClass: "border-sky-500 bg-sky-50 text-sky-700 ring-sky-100",
    badgeClass: "bg-sky-100 text-sky-700",
  },
];

const statusConfig = (status: AttendanceStatus) =>
  STATUS_OPTIONS.find((option) => option.value === status) ?? STATUS_OPTIONS[0];

const today = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const formatDate = (date: string) => {
  if (!date) return "-";

  return new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (student?: Student | null) => {
  if (!student) return "AL";

  return `${student.nombre?.[0] ?? ""}${student.apellido?.[0] ?? ""}`
    .toUpperCase()
    .slice(0, 2);
};

const getStudentGrade = (student: Student) =>
  student.grado ?? student.Grado ?? null;

export default function StudentAttendancePage() {
  const { user } = useAuth();

  const isAdmin = user?.role === "administrador";
  const isTeacher = user?.role === "maestro";
  const currentUserId = Number(
    (user as { id?: number; userId?: number } | null)?.id ??
      (user as { id?: number; userId?: number } | null)?.userId ??
      0,
  );

  const [activeTab, setActiveTab] = useState<Tab>("capture");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [drafts, setDrafts] = useState<Record<number, AttendanceDraft>>({});

  const [selectedDate, setSelectedDate] = useState(today());
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState("todos");
  const [historyGradeId, setHistoryGradeId] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const [attendanceResult, studentsResult, gradesResult] =
        await Promise.allSettled([
          attendanceService.getAll(),
          studentService.getAll(),
          gradeService.getAll(),
        ]);

      if (attendanceResult.status === "rejected") {
        throw attendanceResult.reason;
      }

      if (studentsResult.status === "rejected") {
        throw studentsResult.reason;
      }

      if (gradesResult.status === "rejected") {
        throw gradesResult.reason;
      }

      setRecords(
        Array.isArray(attendanceResult.value)
          ? (attendanceResult.value as AttendanceRecord[])
          : [],
      );
      setStudents(
        Array.isArray(studentsResult.value)
          ? (studentsResult.value as Student[])
          : [],
      );
      setGrades(
        Array.isArray(gradesResult.value)
          ? (gradesResult.value as Grade[])
          : [],
      );
    } catch (error) {
      console.error("Error al cargar asistencia:", error);
      alert(
        error instanceof Error
          ? error.message
          : "No fue posible cargar la información de asistencia.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const availableGrades = useMemo(() => {
    const assignedGrades = grades.filter(
      (grade) => Number(grade.maestroId) > 0,
    );

    if (!isTeacher) return assignedGrades;

    return assignedGrades.filter(
      (grade) => Number(grade.maestroId) === currentUserId,
    );
  }, [grades, isTeacher, currentUserId]);

  useEffect(() => {
    if (availableGrades.length === 0) {
      setSelectedGradeId("");
      return;
    }

    const selectionStillExists = availableGrades.some(
      (grade) => String(grade.id) === selectedGradeId,
    );

    if (!selectionStillExists) {
      setSelectedGradeId(String(availableGrades[0].id));
    }
  }, [availableGrades, selectedGradeId]);

  const selectedGrade = useMemo(
    () =>
      availableGrades.find((grade) => String(grade.id) === selectedGradeId) ??
      null,
    [availableGrades, selectedGradeId],
  );

  const getStudentGradeId = (student: Student) => {
    if (student.gradoId) return Number(student.gradoId);

    const nestedGrade = getStudentGrade(student);
    if (nestedGrade?.id) return Number(nestedGrade.id);

    if (nestedGrade?.nombre) {
      return Number(
        grades.find((grade) => grade.nombre === nestedGrade.nombre)?.id ?? 0,
      );
    }

    return 0;
  };

  const groupStudents = useMemo(() => {
    if (!selectedGradeId) return [];

    return students
      .filter(
        (student) => getStudentGradeId(student) === Number(selectedGradeId),
      )
      .sort((a, b) => {
        const nameA = `${a.apellido} ${a.nombre}`;
        const nameB = `${b.apellido} ${b.nombre}`;
        return nameA.localeCompare(nameB, "es");
      });
  }, [students, selectedGradeId, grades]);

  const visibleGroupStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();

    if (!search) return groupStudents;

    return groupStudents.filter((student) => {
      const fullName = `${student.nombre} ${student.apellido}`.toLowerCase();
      return (
        fullName.includes(search) ||
        student.matricula?.toLowerCase().includes(search)
      );
    });
  }, [groupStudents, studentSearch]);

  const recordsForSelectedClass = useMemo(
    () =>
      records.filter(
        (record) =>
          record.fecha?.slice(0, 10) === selectedDate &&
          Number(record.gradoId ?? record.grado?.id) ===
            Number(selectedGradeId),
      ),
    [records, selectedDate, selectedGradeId],
  );

  useEffect(() => {
    const existingByStudent = new Map(
      recordsForSelectedClass.map((record) => [
        Number(record.alumnoId),
        record,
      ]),
    );

    const nextDrafts: Record<number, AttendanceDraft> = {};

    groupStudents.forEach((student) => {
      const existingRecord = existingByStudent.get(Number(student.id));

      nextDrafts[student.id] = {
        estado: existingRecord?.estado ?? "Presente",
        comentario: existingRecord?.comentario ?? "",
      };
    });

    setDrafts(nextDrafts);
  }, [groupStudents, recordsForSelectedClass]);

  const counters = useMemo(() => {
    const result: Record<AttendanceStatus, number> = {
      Presente: 0,
      Ausente: 0,
      Tarde: 0,
      Justificado: 0,
    };

    groupStudents.forEach((student) => {
      const status = drafts[student.id]?.estado ?? "Presente";
      result[status] += 1;
    });

    return result;
  }, [drafts, groupStudents]);

  const updateStudentStatus = (studentId: number, status: AttendanceStatus) => {
    setDrafts((current) => ({
      ...current,
      [studentId]: {
        comentario: current[studentId]?.comentario ?? "",
        estado: status,
      },
    }));
  };

  const updateStudentComment = (studentId: number, comentario: string) => {
    setDrafts((current) => ({
      ...current,
      [studentId]: {
        estado: current[studentId]?.estado ?? "Presente",
        comentario,
      },
    }));
  };

  const markAllAs = (status: AttendanceStatus) => {
    setDrafts((current) => {
      const next = { ...current };

      groupStudents.forEach((student) => {
        next[student.id] = {
          estado: status,
          comentario: current[student.id]?.comentario ?? "",
        };
      });

      return next;
    });
  };

  const saveAttendance = async () => {
    if (!selectedGrade || groupStudents.length === 0) return;

    const missingJustifications = groupStudents.filter((student) => {
      const draft = drafts[student.id];
      return draft?.estado === "Justificado" && !draft.comentario.trim();
    });

    if (missingJustifications.length > 0) {
      alert("Escribe el motivo de las faltas justificadas antes de guardar.");
      return;
    }

    const existingByStudent = new Map(
      recordsForSelectedClass.map((record) => [
        Number(record.alumnoId),
        record,
      ]),
    );

    try {
      setSaving(true);

      await Promise.all(
        groupStudents.map((student) => {
          const draft = drafts[student.id] ?? {
            estado: "Presente" as AttendanceStatus,
            comentario: "",
          };

          const payload = {
            fecha: selectedDate,
            estado: draft.estado,
            comentario: draft.comentario.trim() || null,
            alumnoId: student.id,
            gradoId: selectedGrade.id,
          };

          const existingRecord = existingByStudent.get(Number(student.id));

          if (existingRecord) {
            return attendanceService.update(existingRecord.id, payload);
          }

          return attendanceService.create(payload);
        }),
      );

      await loadData();
      alert(
        recordsForSelectedClass.length > 0
          ? "La asistencia fue actualizada correctamente."
          : "La asistencia fue guardada correctamente.",
      );
    } catch (error) {
      console.error("Error al guardar asistencia:", error);
      alert(
        error instanceof Error
          ? error.message
          : "No fue posible guardar la asistencia.",
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredHistory = useMemo(() => {
    const search = historySearch.trim().toLowerCase();

    return records.filter((record) => {
      const studentName = `${record.alumno?.nombre ?? ""} ${
        record.alumno?.apellido ?? ""
      }`.toLowerCase();
      const enrollment = record.alumno?.matricula?.toLowerCase() ?? "";

      const matchesSearch =
        !search || studentName.includes(search) || enrollment.includes(search);
      const matchesStatus =
        historyStatus === "todos" || record.estado === historyStatus;
      const matchesGrade =
        historyGradeId === "todos" ||
        String(record.gradoId ?? record.grado?.id) === historyGradeId;

      return matchesSearch && matchesStatus && matchesGrade;
    });
  }, [records, historySearch, historyStatus, historyGradeId]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));

  const currentHistory = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredHistory.slice(start, start + PAGE_SIZE);
  }, [filteredHistory, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [historySearch, historyStatus, historyGradeId]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const deleteRecord = async (record: AttendanceRecord) => {
    if (!isAdmin) return;

    const studentName = record.alumno
      ? `${record.alumno.nombre} ${record.alumno.apellido}`
      : "este alumno";

    if (!confirm(`¿Eliminar la asistencia de ${studentName}?`)) return;

    try {
      setDeletingId(record.id);
      await attendanceService.delete(record.id);
      await loadData();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el registro.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["administrador", "maestro"]}>
      <AppLayout>
        <div className="mx-auto max-w-7xl space-y-5">
          <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-red-950 via-red-900 to-red-800 text-white shadow-sm">
            <div className="flex flex-col gap-5 px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-100">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    ✓
                  </span>
                  Control escolar
                </div>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  Asistencia de alumnos
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-red-100 sm:text-base">
                  Selecciona tu clase, marca las excepciones y guarda la lista
                  en pocos segundos.
                </p>
              </div>

              <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-red-100">
                  Fecha actual
                </p>
                <p className="mt-1 font-semibold">{formatDate(today())}</p>
              </div>
            </div>
          </section>

          <div className="inline-flex w-full rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("capture")}
              className={`flex-1 rounded-lg px-5 py-2.5 text-sm font-semibold transition sm:flex-none ${
                activeTab === "capture"
                  ? "bg-red-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Tomar asistencia
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`flex-1 rounded-lg px-5 py-2.5 text-sm font-semibold transition sm:flex-none ${
                activeTab === "history"
                  ? "bg-red-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Historial
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-red-800" />
              <p className="mt-3 text-sm text-slate-500">
                Cargando alumnos y clases...
              </p>
            </div>
          ) : activeTab === "capture" ? (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    1. Selecciona la clase
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    El maestro únicamente ve los grupos que tiene asignados.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-slate-700">
                      Fecha
                    </span>
                    <input
                      type="date"
                      value={selectedDate}
                      max={today()}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-red-700 focus:ring-4 focus:ring-red-100"
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-slate-700">
                      Grupo / clase de esta hora
                    </span>
                    <select
                      value={selectedGradeId}
                      onChange={(event) =>
                        setSelectedGradeId(event.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-red-700 focus:ring-4 focus:ring-red-100"
                    >
                      {availableGrades.length === 0 && (
                        <option value="">Sin grupos asignados</option>
                      )}
                      {availableGrades.map((grade) => (
                        <option key={grade.id} value={grade.id}>
                          {grade.nombre}
                          {isAdmin && grade.maestro?.name
                            ? ` — ${grade.maestro.name}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              {selectedGrade ? (
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          2. Pasa lista — {selectedGrade.nombre}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Todos aparecen como presentes. Cambia solamente las
                          faltas, retardos o justificadas.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => markAllAs(option.value)}
                            disabled={groupStudents.length === 0}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Todos: {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {STATUS_OPTIONS.map((option) => (
                        <div
                          key={option.value}
                          className={`rounded-xl px-3 py-3 ${option.badgeClass}`}
                        >
                          <p className="text-2xl font-bold">
                            {counters[option.value]}
                          </p>
                          <p className="text-xs font-semibold">
                            {option.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="relative mt-5">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                        ⌕
                      </span>
                      <input
                        type="search"
                        value={studentSearch}
                        onChange={(event) =>
                          setStudentSearch(event.target.value)
                        }
                        placeholder="Buscar alumno o matrícula..."
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-red-700 focus:ring-4 focus:ring-red-100"
                      />
                    </div>
                  </div>

                  {groupStudents.length === 0 ? (
                    <div className="px-5 py-14 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl">
                        !
                      </div>
                      <h3 className="mt-3 font-bold text-slate-800">
                        Este grupo todavía no tiene alumnos
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Asigna alumnos al grupo antes de tomar asistencia.
                      </p>
                    </div>
                  ) : visibleGroupStudents.length === 0 ? (
                    <div className="px-5 py-12 text-center text-sm text-slate-500">
                      No hay alumnos que coincidan con la búsqueda.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {visibleGroupStudents.map((student, index) => {
                        const draft = drafts[student.id] ?? {
                          estado: "Presente" as AttendanceStatus,
                          comentario: "",
                        };

                        return (
                          <article
                            key={student.id}
                            className="grid gap-4 p-4 transition hover:bg-slate-50/70 sm:p-5 lg:grid-cols-[minmax(220px,1fr)_minmax(400px,1.6fr)] lg:items-center"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="w-6 text-center text-xs font-semibold text-slate-400">
                                {index + 1}
                              </span>
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-800">
                                {getInitials(student)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">
                                  {student.nombre} {student.apellido}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                  Matrícula:{" "}
                                  {student.matricula || "Sin matrícula"}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {STATUS_OPTIONS.map((option) => {
                                  const selected =
                                    draft.estado === option.value;

                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      aria-pressed={selected}
                                      onClick={() =>
                                        updateStudentStatus(
                                          student.id,
                                          option.value,
                                        )
                                      }
                                      className={`flex min-h-10 items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-bold transition ${
                                        selected
                                          ? `${option.buttonClass} ring-4`
                                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                      }`}
                                    >
                                      <span
                                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                                          selected
                                            ? "bg-white/80"
                                            : "bg-slate-100"
                                        }`}
                                      >
                                        {option.shortLabel}
                                      </span>
                                      {option.label}
                                    </button>
                                  );
                                })}
                              </div>

                              <input
                                type="text"
                                value={draft.comentario}
                                maxLength={500}
                                onChange={(event) =>
                                  updateStudentComment(
                                    student.id,
                                    event.target.value,
                                  )
                                }
                                placeholder={
                                  draft.estado === "Tarde"
                                    ? "Comentario opcional: llegó 10 minutos tarde..."
                                    : draft.estado === "Justificado"
                                      ? "Motivo obligatorio de la justificación..."
                                      : draft.estado === "Ausente"
                                        ? "Comentario opcional sobre la falta..."
                                        : "Comentario opcional..."
                                }
                                className={`h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none transition focus:ring-4 ${
                                  draft.estado === "Justificado" &&
                                  !draft.comentario.trim()
                                    ? "border-sky-300 focus:border-sky-500 focus:ring-sky-100"
                                    : "border-slate-200 focus:border-red-700 focus:ring-red-100"
                                }`}
                              />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}

                  <div className="sticky bottom-0 flex flex-col gap-3 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-sm text-slate-500">
                      {recordsForSelectedClass.length > 0
                        ? "Esta lista ya existe; al guardar se actualizará."
                        : `${groupStudents.length} alumnos en esta lista.`}
                    </p>
                    <button
                      type="button"
                      disabled={saving || groupStudents.length === 0}
                      onClick={() => void saveAttendance()}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-900 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving
                        ? "Guardando asistencia..."
                        : recordsForSelectedClass.length > 0
                          ? "Actualizar asistencia"
                          : "Guardar asistencia"}
                    </button>
                  </div>
                </section>
              ) : (
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
                  <h2 className="font-bold text-amber-900">
                    No tienes grupos disponibles
                  </h2>
                  <p className="mt-1 text-sm text-amber-700">
                    Un administrador debe asignarte por lo menos un grupo.
                  </p>
                </section>
              )}
            </>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5 sm:p-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Historial de asistencia
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Consulta los registros anteriores y sus observaciones.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <input
                    type="search"
                    value={historySearch}
                    onChange={(event) => setHistorySearch(event.target.value)}
                    placeholder="Buscar alumno o matrícula..."
                    className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-red-700 focus:ring-4 focus:ring-red-100"
                  />

                  <select
                    value={historyStatus}
                    onChange={(event) => setHistoryStatus(event.target.value)}
                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-red-700 focus:ring-4 focus:ring-red-100"
                  >
                    <option value="todos">Todos los estados</option>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={historyGradeId}
                    onChange={(event) => setHistoryGradeId(event.target.value)}
                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-red-700 focus:ring-4 focus:ring-red-100"
                  >
                    <option value="todos">Todos los grupos</option>
                    {availableGrades.map((grade) => (
                      <option key={grade.id} value={grade.id}>
                        {grade.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        "Fecha",
                        "Alumno",
                        "Grupo",
                        "Estado",
                        "Comentario",
                        "",
                      ].map((header) => (
                        <th
                          key={header || "actions"}
                          className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {currentHistory.map((record) => {
                      const config = statusConfig(record.estado);

                      return (
                        <tr key={record.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                            {formatDate(record.fecha)}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">
                              {record.alumno
                                ? `${record.alumno.nombre} ${record.alumno.apellido}`
                                : "Alumno no disponible"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {record.alumno?.matricula ?? "-"}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {record.grado?.nombre ?? "-"}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${config.badgeClass}`}
                            >
                              {config.label}
                            </span>
                          </td>
                          <td className="max-w-xs px-5 py-4 text-sm text-slate-500">
                            <p className="line-clamp-2">
                              {record.comentario || "Sin comentario"}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {isAdmin && (
                              <button
                                type="button"
                                disabled={deletingId === record.id}
                                onClick={() => void deleteRecord(record)}
                                className="rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                              >
                                {deletingId === record.id
                                  ? "Eliminando..."
                                  : "Eliminar"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {currentHistory.map((record) => {
                  const config = statusConfig(record.estado);

                  return (
                    <article key={record.id} className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {record.alumno
                              ? `${record.alumno.nombre} ${record.alumno.apellido}`
                              : "Alumno no disponible"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(record.fecha)} ·{" "}
                            {record.grado?.nombre ?? "Sin grupo"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${config.badgeClass}`}
                        >
                          {config.label}
                        </span>
                      </div>
                      {record.comentario && (
                        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                          {record.comentario}
                        </p>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          disabled={deletingId === record.id}
                          onClick={() => void deleteRecord(record)}
                          className="text-xs font-bold text-rose-600"
                        >
                          {deletingId === record.id
                            ? "Eliminando..."
                            : "Eliminar registro"}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>

              {filteredHistory.length === 0 && (
                <div className="px-5 py-14 text-center text-sm text-slate-500">
                  No hay registros que coincidan con los filtros.
                </div>
              )}

              {filteredHistory.length > 0 && (
                <div className="border-t border-slate-200 px-5 py-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </section>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}