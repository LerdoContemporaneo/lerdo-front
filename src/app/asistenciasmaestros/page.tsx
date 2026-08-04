'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Swal from 'sweetalert2';
import AppLayout from '../components/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import {
  gradeService,
  teacherAttendanceService,
  userService,
  type TeacherAttendancePayload,
  type TeacherAttendanceStatus,
} from '../services/schoolService';

type Teacher = {
  id: number;
  uuid: string;
  name: string;
  email?: string;
  role: string;
};

type Grade = {
  id: number;
  uuid: string;
  nombre: string;
  maestroId: number | string | null;
  maestro?: Teacher | null;
};

type TeacherAttendanceRecord = {
  id: number;
  uuid: string;
  fecha: string;
  horaClase: string | null;
  estado: TeacherAttendanceStatus;
  observacion?: string | null;
  maestroId: number;
  gradoId: number | null;
  maestro?: Teacher | null;
  grado?: Grade | null;
};

type AttendanceForm = {
  maestroId: string;
  gradoId: string;
  fecha: string;
  horaClase: string;
  estado: TeacherAttendanceStatus;
  observacion: string;
};

const ITEMS_PER_PAGE = 8;
const ADMIN_ROLES = ['administrador'];

const getToday = () => {
  const date = new Date();
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  );

  return localDate.toISOString().slice(0, 10);
};

const getCurrentTime = () => {
  const date = new Date();
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
};

const createEmptyForm = (): AttendanceForm => ({
  maestroId: '',
  gradoId: '',
  fecha: getToday(),
  horaClase: getCurrentTime(),
  estado: 'Presente',
  observacion: '',
});

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatTime = (value: string | null) =>
  value ? value.slice(0, 5) : 'Registro anterior';

const statusClasses: Record<TeacherAttendanceStatus, string> = {
  Presente: 'bg-emerald-100 text-emerald-700',
  Ausente: 'bg-red-100 text-red-700',
  Tarde: 'bg-amber-100 text-amber-800',
  Justificado: 'bg-blue-100 text-blue-700',
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado';

export default function TeacherAttendancePage() {
  const [records, setRecords] = useState<TeacherAttendanceRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);
  const [pageError, setPageError] = useState('');

  const [search, setSearch] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<TeacherAttendanceRecord | null>(null);
  const [form, setForm] = useState<AttendanceForm>(createEmptyForm);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setPageError('');

    try {
      const [attendanceData, usersData, gradesData] = await Promise.all([
        teacherAttendanceService.getAll(),
        userService.getAll(),
        gradeService.getAll(),
      ]);

      setRecords(
        Array.isArray(attendanceData)
          ? (attendanceData as TeacherAttendanceRecord[])
          : []
      );
      setTeachers(
        Array.isArray(usersData)
          ? (usersData as Teacher[]).filter(
              (candidate) => candidate.role === 'maestro'
            )
          : []
      );
      setGrades(
        Array.isArray(gradesData) ? (gradesData as Grade[]) : []
      );
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const availableFormGrades = useMemo(() => {
    if (!form.maestroId) return [];

    return grades.filter(
      (grade) =>
        Number(grade.maestroId ?? grade.maestro?.id) ===
        Number(form.maestroId)
    );
  }, [form.maestroId, grades]);

  const filteredGrades = useMemo(() => {
    if (!teacherFilter) return grades;

    return grades.filter(
      (grade) =>
        Number(grade.maestroId ?? grade.maestro?.id) ===
        Number(teacherFilter)
    );
  }, [grades, teacherFilter]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !normalizedSearch ||
        record.maestro?.name?.toLowerCase().includes(normalizedSearch) ||
        record.maestro?.email?.toLowerCase().includes(normalizedSearch) ||
        record.grado?.nombre?.toLowerCase().includes(normalizedSearch) ||
        record.observacion?.toLowerCase().includes(normalizedSearch);
      const matchesTeacher =
        !teacherFilter ||
        Number(record.maestroId) === Number(teacherFilter);
      const matchesGrade =
        !gradeFilter || Number(record.gradoId) === Number(gradeFilter);
      const matchesStatus =
        !statusFilter || record.estado === statusFilter;
      const matchesDate = !dateFilter || record.fecha === dateFilter;

      return (
        matchesSearch &&
        matchesTeacher &&
        matchesGrade &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    records,
    search,
    teacherFilter,
    gradeFilter,
    statusFilter,
    dateFilter,
  ]);

  const todayRecords = useMemo(
    () => records.filter((record) => record.fecha === getToday()),
    [records]
  );

  const metrics = useMemo(
    () => [
      {
        label: 'Clases registradas hoy',
        value: todayRecords.length,
        style: 'border-red-100 text-red-900',
      },
      {
        label: 'Presentes',
        value: todayRecords.filter(
          (record) => record.estado === 'Presente'
        ).length,
        style: 'border-emerald-100 text-emerald-700',
      },
      {
        label: 'Llegadas tarde',
        value: todayRecords.filter((record) => record.estado === 'Tarde')
          .length,
        style: 'border-amber-100 text-amber-700',
      },
      {
        label: 'Ausencias',
        value: todayRecords.filter(
          (record) => record.estado === 'Ausente'
        ).length,
        style: 'border-red-100 text-red-700',
      },
    ],
    [todayRecords]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / ITEMS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const currentData = filteredRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const openCreateModal = () => {
    setEditingRecord(null);
    setForm(createEmptyForm());
    setIsModalOpen(true);
  };

  const openEditModal = (record: TeacherAttendanceRecord) => {
    setEditingRecord(record);
    setForm({
      maestroId: String(record.maestroId ?? ''),
      gradoId: String(record.gradoId ?? ''),
      fecha: record.fecha,
      horaClase: record.horaClase?.slice(0, 5) ?? '',
      estado: record.estado,
      observacion: record.observacion ?? '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleTeacherChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const maestroId = event.target.value;
    const selectedGrade = grades.find(
      (grade) => Number(grade.id) === Number(form.gradoId)
    );
    const gradeBelongsToTeacher =
      selectedGrade &&
      Number(selectedGrade.maestroId ?? selectedGrade.maestro?.id) ===
        Number(maestroId);

    setForm((previous) => ({
      ...previous,
      maestroId,
      gradoId: gradeBelongsToTeacher ? previous.gradoId : '',
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const maestroId = Number(form.maestroId);
    const gradoId = Number(form.gradoId);

    if (!maestroId || !gradoId || !form.fecha || !form.horaClase) {
      await Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Selecciona maestro, grupo, fecha y hora de clase.',
      });
      return;
    }

    const payload: TeacherAttendancePayload = {
      maestroId,
      gradoId,
      fecha: form.fecha,
      horaClase: form.horaClase,
      estado: form.estado,
      observacion: form.observacion.trim(),
    };

    setSaving(true);

    try {
      if (editingRecord) {
        await teacherAttendanceService.update(
          editingRecord.uuid,
          payload
        );
      } else {
        await teacherAttendanceService.create(payload);
      }

      setIsModalOpen(false);
      setEditingRecord(null);
      await loadData();
      await Swal.fire({
        icon: 'success',
        title: editingRecord
          ? 'Asistencia actualizada'
          : 'Asistencia registrada',
        text: 'El registro de la clase se guardó correctamente.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'No fue posible guardar',
        text: getErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: TeacherAttendanceRecord) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar este registro?',
      text: `${record.maestro?.name ?? 'Docente'} · ${formatDate(
        record.fecha
      )} · ${formatTime(record.horaClase)}`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#991b1b',
    });

    if (!result.isConfirmed) return;

    setDeletingUuid(record.uuid);

    try {
      await teacherAttendanceService.delete(record.uuid);
      await loadData();
      await Swal.fire({
        icon: 'success',
        title: 'Registro eliminado',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'No fue posible eliminar',
        text: getErrorMessage(error),
      });
    } finally {
      setDeletingUuid(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setTeacherFilter('');
    setGradeFilter('');
    setStatusFilter('');
    setDateFilter('');
    setCurrentPage(1);
  };

  return (
    <ProtectedRoute allowedRoles={ADMIN_ROLES}>
      <AppLayout>
        <div className="space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-red-900">
                Asistencia docente por clase
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Registra la presencia del maestro en cada grupo, fecha y
                hora de clase.
              </p>
            </div>

            <Button
              type="button"
              onClick={openCreateModal}
              className="bg-red-900 text-white hover:bg-red-800"
            >
              + Registrar asistencia
            </Button>
          </header>

          {pageError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">No se pudieron cargar los datos.</p>
              <p className="mt-1">{pageError}</p>
              <Button
                type="button"
                variant="ghost"
                className="mt-3 border-red-200 text-red-700"
                onClick={() => void loadData()}
              >
                Reintentar
              </Button>
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <article
                key={metric.label}
                className={`rounded-xl border bg-white p-5 shadow-sm ${metric.style}`}
              >
                <p className="text-sm font-medium text-gray-500">
                  {metric.label}
                </p>
                <p className="mt-2 text-3xl font-bold">{metric.value}</p>
              </article>
            ))}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Input
                label="Buscar"
                placeholder="Maestro, grupo u observación..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
              />

              <Select
                label="Maestro"
                value={teacherFilter}
                onChange={(event) => {
                  setTeacherFilter(event.target.value);
                  setGradeFilter('');
                  setCurrentPage(1);
                }}
                options={[
                  { label: 'Todos los maestros', value: '' },
                  ...teachers.map((teacher) => ({
                    label: teacher.name,
                    value: String(teacher.id),
                  })),
                ]}
              />

              <Select
                label="Grupo / clase"
                value={gradeFilter}
                onChange={(event) => {
                  setGradeFilter(event.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { label: 'Todos los grupos', value: '' },
                  ...filteredGrades.map((grade) => ({
                    label: grade.nombre,
                    value: String(grade.id),
                  })),
                ]}
              />

              <Select
                label="Estado"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { label: 'Todos los estados', value: '' },
                  { label: 'Presente', value: 'Presente' },
                  { label: 'Ausente', value: 'Ausente' },
                  { label: 'Tarde', value: 'Tarde' },
                  { label: 'Justificado', value: 'Justificado' },
                ]}
              />

              <Input
                label="Fecha"
                type="date"
                value={dateFilter}
                onChange={(event) => {
                  setDateFilter(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                {filteredRecords.length} registro
                {filteredRecords.length === 1 ? '' : 's'} encontrado
                {filteredRecords.length === 1 ? '' : 's'}
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={clearFilters}
              >
                Limpiar filtros
              </Button>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {loadingData ? (
              <div className="p-12 text-center text-gray-500">
                Cargando asistencia docente...
              </div>
            ) : (
              <>
                <Table<TeacherAttendanceRecord>
                  columns={[
                    {
                      key: 'fecha',
                      header: 'Fecha y hora',
                      render: (record) => (
                        <div className="min-w-28">
                          <p className="font-semibold text-gray-900">
                            {formatDate(record.fecha)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatTime(record.horaClase)}
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: 'maestro',
                      header: 'Docente',
                      render: (record) => (
                        <div className="min-w-44">
                          <p className="font-semibold text-gray-900">
                            {record.maestro?.name ?? 'Docente no disponible'}
                          </p>
                          {record.maestro?.email && (
                            <p className="mt-1 text-xs text-gray-500">
                              {record.maestro.email}
                            </p>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: 'grado',
                      header: 'Grupo / clase',
                      render: (record) =>
                        record.grado?.nombre ?? 'Registro anterior',
                    },
                    {
                      key: 'estado',
                      header: 'Estado',
                      render: (record) => (
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[record.estado]}`}
                        >
                          {record.estado}
                        </span>
                      ),
                    },
                    {
                      key: 'observacion',
                      header: 'Observación',
                      render: (record) => (
                        <p className="max-w-xs whitespace-pre-wrap text-gray-600">
                          {record.observacion || 'Sin observaciones'}
                        </p>
                      ),
                    },
                    {
                      key: 'actions',
                      header: 'Acciones',
                      render: (record) => (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            className="px-2 py-1 text-xs text-blue-700"
                            onClick={() => openEditModal(record)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="px-2 py-1 text-xs text-red-700"
                            disabled={deletingUuid === record.uuid}
                            onClick={() => void handleDelete(record)}
                          >
                            {deletingUuid === record.uuid
                              ? 'Eliminando...'
                              : 'Eliminar'}
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                  data={currentData}
                />

                <div className="border-t border-gray-200 p-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </section>
        </div>

        <Modal
          open={isModalOpen}
          onClose={closeModal}
          title={
            editingRecord
              ? 'Editar asistencia docente'
              : 'Registrar asistencia docente'
          }
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Maestro"
                required
                value={form.maestroId}
                onChange={handleTeacherChange}
                options={[
                  { label: 'Selecciona un maestro', value: '' },
                  ...teachers.map((teacher) => ({
                    label: teacher.name,
                    value: String(teacher.id),
                  })),
                ]}
              />

              <Select
                label="Grupo / clase"
                required
                disabled={!form.maestroId}
                value={form.gradoId}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    gradoId: event.target.value,
                  }))
                }
                options={[
                  {
                    label: form.maestroId
                      ? 'Selecciona el grupo'
                      : 'Primero selecciona un maestro',
                    value: '',
                  },
                  ...availableFormGrades.map((grade) => ({
                    label: grade.nombre,
                    value: String(grade.id),
                  })),
                ]}
              />
            </div>

            {form.maestroId && availableFormGrades.length === 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Este maestro no tiene grupos asignados. Asigna primero un
                grupo desde el módulo Grupos.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Fecha"
                type="date"
                required
                value={form.fecha}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    fecha: event.target.value,
                  }))
                }
              />

              <Input
                label="Hora de clase"
                type="time"
                required
                value={form.horaClase}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    horaClase: event.target.value,
                  }))
                }
              />

              <Select
                label="Estado"
                required
                value={form.estado}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    estado: event.target.value as TeacherAttendanceStatus,
                  }))
                }
                options={[
                  { label: 'Presente', value: 'Presente' },
                  { label: 'Ausente', value: 'Ausente' },
                  { label: 'Tarde', value: 'Tarde' },
                  { label: 'Justificado', value: 'Justificado' },
                ]}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="teacher-attendance-observation"
                className="text-sm text-gray-700"
              >
                Observación (opcional)
              </label>
              <textarea
                id="teacher-attendance-observation"
                rows={3}
                maxLength={500}
                value={form.observacion}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    observacion: event.target.value,
                  }))
                }
                placeholder="Ejemplo: llegó 10 minutos tarde o presentó justificante."
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
              />
              <p className="text-right text-xs text-gray-400">
                {form.observacion.length}/500
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={closeModal}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  saving ||
                  !form.maestroId ||
                  !form.gradoId ||
                  !form.fecha ||
                  !form.horaClase
                }
                className="bg-red-900 text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? 'Guardando...'
                  : editingRecord
                    ? 'Guardar cambios'
                    : 'Registrar asistencia'}
              </Button>
            </div>
          </form>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}