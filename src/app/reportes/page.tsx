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
  reportService,
} from '../services/schoolService';
import { useAuth } from '../hooks/useAuth';

type Teacher = {
  id: number;
  uuid: string;
  name: string;
  email?: string;
};

type Student = {
  id: number;
  uuid: string;
  nombre: string;
  apellido: string;
  matricula?: string;
};

type Group = {
  id: number;
  uuid: string;
  nombre: string;
  maestroId: number | null;
  maestro?: Teacher | null;
  alumnos?: Student[];
};

type Report = {
  id: number;
  uuid: string;
  titulo: string;
  contenido: string;
  alumnoId: number;
  gradoId: number;
  maestroId: number;
  createdAt: string;
  updatedAt: string;
  alumno?: Student | null;
  grado?: Group | null;
  maestro?: Teacher | null;
};

type ReportColumn = {
  key: string;
  header: string;
  render?: (report: Report) => React.ReactNode;
};

const ITEMS_PER_PAGE = 10;

const REPORT_REASONS = [
  'Uso inadecuado del celular en clase',
  'Uso inadecuado del uniforme o ausencia de este',
  'Falta de respeto a un compañero o maestro',
  'Incumplimiento de tareas',
  'Alterar el orden en el aula',
  'Llegar tarde',
  'Reporte de conducta general',
];

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const formatDate = (value?: string) => {
  if (!value) return 'Sin fecha';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const isCurrentMonth = (value: string) => {
  const date = new Date(value);
  const today = new Date();

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth()
  );
};

export default function ReportsPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'administrador';
  const isTeacher = user?.role === 'maestro';
  const isStudent = user?.role === 'alumno';

  const [reports, setReports] = useState<Report[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formGroupId, setFormGroupId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('todos');
  const [reasonFilter, setReasonFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoadingData(true);

      const [reportData, groupData] = await Promise.all([
        reportService.getAll(),
        gradeService.getAll(),
      ]);

      setReports(Array.isArray(reportData) ? reportData : []);
      setGroups(Array.isArray(groupData) ? groupData : []);
    } catch (error) {
      console.error('Error al cargar reportes:', error);

      await Swal.fire({
        icon: 'error',
        title: 'No fue posible cargar los reportes',
        text: getErrorMessage(
          error,
          'Verifica la conexión con el servidor.'
        ),
        confirmButtonColor: '#7f1d1d',
      });
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /*
   * GET /grados ya filtra por sesión. Esta comprobación adicional
   * evita mostrar al maestro un grupo que no le pertenece si conserva
   * datos anteriores en el navegador.
   */
  const availableGroups = useMemo(() => {
    if (!isTeacher) return groups;

    return groups.filter(
      (group) => Number(group.maestroId) === Number(user?.id)
    );
  }, [groups, isTeacher, user?.id]);

  const selectedFormGroup = useMemo(
    () =>
      availableGroups.find(
        (group) => String(group.id) === formGroupId
      ),
    [availableGroups, formGroupId]
  );

  const formStudents = useMemo(
    () =>
      [...(selectedFormGroup?.alumnos || [])].sort((a, b) =>
        `${a.apellido} ${a.nombre}`.localeCompare(
          `${b.apellido} ${b.nombre}`,
          'es'
        )
      ),
    [selectedFormGroup]
  );

  const groupOptions = useMemo(() => {
    const byId = new Map<number, Group>();

    groups.forEach((group) => byId.set(group.id, group));
    reports.forEach((report) => {
      if (report.grado) byId.set(report.grado.id, report.grado);
    });

    return [...byId.values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es')
    );
  }, [groups, reports]);

  const reasonOptions = useMemo(
    () =>
      [...new Set(reports.map((report) => report.titulo))].sort(
        (a, b) => a.localeCompare(b, 'es')
      ),
    [reports]
  );

  const filteredReports = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return reports.filter((report) => {
      const studentName = report.alumno
        ? `${report.alumno.nombre} ${report.alumno.apellido}`
        : '';
      const groupName = report.grado?.nombre || '';
      const teacherName = report.maestro?.name || '';

      const matchesSearch =
        !search ||
        studentName.toLowerCase().includes(search) ||
        groupName.toLowerCase().includes(search) ||
        teacherName.toLowerCase().includes(search) ||
        report.titulo.toLowerCase().includes(search) ||
        report.contenido.toLowerCase().includes(search);

      const matchesGroup =
        groupFilter === 'todos' ||
        String(report.gradoId) === groupFilter;

      const matchesReason =
        reasonFilter === 'todos' ||
        report.titulo === reasonFilter;

      return matchesSearch && matchesGroup && matchesReason;
    });
  }, [reports, searchTerm, groupFilter, reasonFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, groupFilter, reasonFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReports.length / ITEMS_PER_PAGE)
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  const metrics = useMemo(
    () => ({
      total: reports.length,
      thisMonth: reports.filter((report) =>
        isCurrentMonth(report.createdAt)
      ).length,
      students: new Set(reports.map((report) => report.alumnoId)).size,
      groups: new Set(reports.map((report) => report.gradoId)).size,
    }),
    [reports]
  );

  const handleOpenCreate = async () => {
    if (!isTeacher) return;

    if (availableGroups.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'No tienes grupos asignados',
        text: 'Un administrador debe asignarte un grupo antes de registrar reportes.',
        confirmButtonColor: '#7f1d1d',
      });
      return;
    }

    const firstGroupWithStudents =
      availableGroups.find((group) => (group.alumnos?.length || 0) > 0) ||
      availableGroups[0];

    setFormGroupId(String(firstGroupWithStudents.id));
    setIsModalOpen(true);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!isTeacher) return;

    const formData = new FormData(event.currentTarget);
    const gradoId = Number(formData.get('gradoId'));
    const alumnoId = Number(formData.get('alumnoId'));
    const titulo = String(formData.get('titulo') || '').trim();
    const contenido = String(
      formData.get('contenido') || ''
    ).trim();

    if (!gradoId) {
      await Swal.fire({
        icon: 'warning',
        title: 'Selecciona un grupo',
        confirmButtonColor: '#7f1d1d',
      });
      return;
    }

    if (!alumnoId) {
      await Swal.fire({
        icon: 'warning',
        title: 'Selecciona un alumno',
        text: 'El reporte debe quedar relacionado con un alumno del grupo.',
        confirmButtonColor: '#7f1d1d',
      });
      return;
    }

    try {
      setSaving(true);

      await reportService.create({
        titulo,
        contenido,
        alumnoId,
        gradoId,
      });

      setIsModalOpen(false);
      await loadData();

      await Swal.fire({
        icon: 'success',
        title: 'Reporte registrado',
        text: 'El reporte se asignó al alumno seleccionado.',
        confirmButtonColor: '#7f1d1d',
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'No fue posible registrar el reporte',
        text: getErrorMessage(
          error,
          'Revisa los datos e intenta nuevamente.'
        ),
        confirmButtonColor: '#7f1d1d',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (report: Report) => {
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar reporte?',
      text: 'Esta acción no se puede deshacer.',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#7f1d1d',
      cancelButtonColor: '#6b7280',
    });

    if (!confirmation.isConfirmed) return;

    try {
      setDeletingUuid(report.uuid);
      await reportService.delete(report.uuid);
      await loadData();

      await Swal.fire({
        icon: 'success',
        title: 'Reporte eliminado',
        confirmButtonColor: '#7f1d1d',
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'No fue posible eliminarlo',
        text: getErrorMessage(error, 'Intenta nuevamente.'),
        confirmButtonColor: '#7f1d1d',
      });
    } finally {
      setDeletingUuid(null);
    }
  };

  const columns = useMemo<ReportColumn[]>(() => {
    const baseColumns: ReportColumn[] = [
      {
        key: 'createdAt',
        header: 'Fecha',
        render: (report) => formatDate(report.createdAt),
      },
      {
        key: 'grado',
        header: 'Grupo',
        render: (report) =>
          report.grado?.nombre || 'Grupo no disponible',
      },
      {
        key: 'alumno',
        header: 'Alumno',
        render: (report) => (
          <div>
            <p className="font-medium text-gray-900">
              {report.alumno
                ? `${report.alumno.nombre} ${report.alumno.apellido}`
                : 'Alumno no disponible'}
            </p>
            {report.alumno?.matricula && (
              <p className="text-xs text-gray-500">
                {report.alumno.matricula}
              </p>
            )}
          </div>
        ),
      },
      {
        key: 'titulo',
        header: 'Motivo',
        render: (report) => (
          <span className="inline-flex min-w-48 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
            {report.titulo}
          </span>
        ),
      },
      {
        key: 'maestro',
        header: 'Registró',
        render: (report) =>
          report.maestro?.name || 'Usuario no disponible',
      },
      {
        key: 'contenido',
        header: 'Descripción',
        render: (report) => (
          <p className="min-w-64 whitespace-pre-wrap text-gray-700">
            {report.contenido}
          </p>
        ),
      },
    ];

    if (isStudent) return baseColumns;

    return [
      ...baseColumns,
      {
        key: 'acciones',
        header: 'Acciones',
        render: (report) => {
          const canDelete =
            isAdmin ||
            (isTeacher &&
              Number(report.maestroId) === Number(user?.id));

          if (!canDelete) {
            return (
              <span className="text-xs text-gray-400">
                Sólo lectura
              </span>
            );
          }

          return (
            <Button
              type="button"
              variant="ghost"
              className="text-xs text-red-700"
              disabled={deletingUuid === report.uuid}
              onClick={() => void handleDelete(report)}
            >
              {deletingUuid === report.uuid
                ? 'Eliminando...'
                : 'Eliminar'}
            </Button>
          );
        },
      },
    ];
  }, [isAdmin, isTeacher, isStudent, user?.id, deletingUuid]);

  const pageDescription = isAdmin
    ? 'Consulta todos los reportes registrados por los maestros.'
    : isTeacher
      ? 'Registra reportes para los alumnos de tus grupos asignados.'
      : 'Consulta los reportes relacionados con tu perfil escolar.';

  return (
    <ProtectedRoute
      allowedRoles={['administrador', 'maestro', 'alumno']}
    >
      <AppLayout>
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-red-900">
                  Reportes de alumnos
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {pageDescription}
                </p>
              </div>

              {isTeacher && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => void handleOpenCreate()}
                >
                  + Nuevo reporte
                </Button>
              )}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Total', metrics.total, 'text-gray-900'],
              ['Este mes', metrics.thisMonth, 'text-amber-700'],
              ['Alumnos', metrics.students, 'text-blue-700'],
              ['Grupos', metrics.groups, 'text-purple-700'],
            ].map(([label, value, color]) => (
              <div
                key={String(label)}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${color}`}>
                  {value}
                </p>
              </div>
            ))}
          </section>

          <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                label="Buscar"
                placeholder="Alumno, grupo, maestro, motivo o descripción"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />

              <Select
                label="Grupo"
                value={groupFilter}
                onChange={(event) =>
                  setGroupFilter(event.target.value)
                }
                options={[
                  { label: 'Todos los grupos', value: 'todos' },
                  ...groupOptions.map((group) => ({
                    label: group.nombre,
                    value: String(group.id),
                  })),
                ]}
              />

              <Select
                label="Motivo"
                value={reasonFilter}
                onChange={(event) =>
                  setReasonFilter(event.target.value)
                }
                options={[
                  { label: 'Todos los motivos', value: 'todos' },
                  ...reasonOptions.map((reason) => ({
                    label: reason,
                    value: reason,
                  })),
                ]}
              />
            </div>

            {loadingData ? (
              <div className="py-12 text-center text-sm text-gray-500">
                Cargando reportes...
              </div>
            ) : (
              <Table columns={columns} data={currentData} />
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {currentData.length} de{' '}
                {filteredReports.length} reportes
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </section>
        </div>

        <Modal
          open={isModalOpen && isTeacher}
          onClose={() => !saving && setIsModalOpen(false)}
          title="Registrar reporte"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Grupo"
                name="gradoId"
                required
                value={formGroupId}
                onChange={(event) =>
                  setFormGroupId(event.target.value)
                }
                options={availableGroups.map((group) => ({
                  label: group.nombre,
                  value: String(group.id),
                }))}
              />

              <Select
                key={formGroupId}
                label="Alumno"
                name="alumnoId"
                required
                defaultValue=""
                options={[
                  {
                    label:
                      formStudents.length > 0
                        ? 'Selecciona un alumno'
                        : 'Este grupo no tiene alumnos',
                    value: '',
                  },
                  ...formStudents.map((student) => ({
                    label: `${student.apellido} ${student.nombre}${
                      student.matricula
                        ? ` · ${student.matricula}`
                        : ''
                    }`,
                    value: String(student.id),
                  })),
                ]}
              />
            </div>

            <Select
              label="Motivo del reporte"
              name="titulo"
              required
              defaultValue={REPORT_REASONS[0]}
              options={REPORT_REASONS.map((reason) => ({
                label: reason,
                value: reason,
              }))}
            />

            <div className="flex flex-col gap-1">
              <label
                htmlFor="report-content"
                className="text-sm font-medium text-gray-700"
              >
                Descripción
              </label>
              <textarea
                id="report-content"
                name="contenido"
                required
                minLength={5}
                rows={4}
                placeholder="Describe qué ocurrió, el contexto y las acciones tomadas."
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>

            {selectedFormGroup && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                Sólo aparecen los alumnos inscritos en{' '}
                <strong>{selectedFormGroup.nombre}</strong>.
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={saving || formStudents.length === 0}
              >
                {saving ? 'Guardando...' : 'Registrar reporte'}
              </Button>
            </div>
          </form>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}