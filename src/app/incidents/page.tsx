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
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import {
  gradeService,
  incidentService,
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

type Incident = {
  id: number;
  uuid: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  alumnoId: number | null;
  gradoId: number;
  maestroId: number;
  alumno?: Student | null;
  grado?: Group | null;
  maestro?: Teacher | null;
};

type IncidentScope = 'alumno' | 'grupo';
type ScopeFilter = 'todos' | IncidentScope;

type IncidentColumn = {
  key: string;
  header: string;
  render?: (incident: Incident) => React.ReactNode;
};

const ITEMS_PER_PAGE = 10;

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatDate = (value: string) => {
  const date = value?.slice(0, 10);

  if (!date) return 'Sin fecha';

  return new Date(`${date}T00:00:00`).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const getSeverityClass = (type: string) => {
  const normalized = type.trim().toLowerCase();

  if (normalized === 'grave') {
    return 'bg-red-100 text-red-700';
  }

  if (normalized === 'moderada') {
    return 'bg-amber-100 text-amber-800';
  }

  return 'bg-emerald-100 text-emerald-700';
};

export default function IncidentsPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'administrador';
  const isTeacher = user?.role === 'maestro';
  const isStudent = user?.role === 'alumno';

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formScope, setFormScope] =
    useState<IncidentScope>('alumno');
  const [formGroupId, setFormGroupId] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('todos');
  const [scopeFilter, setScopeFilter] =
    useState<ScopeFilter>('todos');
  const [severityFilter, setSeverityFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoadingData(true);

      const [incidentData, groupData] = await Promise.all([
        incidentService.getAll(),
        gradeService.getAll(),
      ]);

      setIncidents(Array.isArray(incidentData) ? incidentData : []);
      setGroups(Array.isArray(groupData) ? groupData : []);
    } catch (error) {
      console.error('Error al cargar incidencias:', error);

      await Swal.fire({
        icon: 'error',
        title: 'No fue posible cargar las incidencias',
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
   * GET /grados ya aplica los permisos por rol. Esta segunda
   * validación evita que un maestro use datos antiguos de otro grupo.
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

  const filteredIncidents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return incidents.filter((incident) => {
      const studentName = incident.alumno
        ? `${incident.alumno.nombre} ${incident.alumno.apellido}`
        : 'grupo completo';
      const groupName = incident.grado?.nombre || '';
      const teacherName = incident.maestro?.name || '';
      const scope: IncidentScope =
        incident.alumnoId === null ? 'grupo' : 'alumno';

      const matchesSearch =
        !search ||
        studentName.toLowerCase().includes(search) ||
        groupName.toLowerCase().includes(search) ||
        teacherName.toLowerCase().includes(search) ||
        incident.tipo.toLowerCase().includes(search) ||
        incident.descripcion.toLowerCase().includes(search);

      const matchesGroup =
        groupFilter === 'todos' ||
        String(incident.gradoId) === groupFilter;

      const matchesScope =
        scopeFilter === 'todos' || scope === scopeFilter;

      const matchesSeverity =
        severityFilter === 'todos' ||
        incident.tipo.toLowerCase() === severityFilter;

      return (
        matchesSearch &&
        matchesGroup &&
        matchesScope &&
        matchesSeverity
      );
    });
  }, [
    incidents,
    searchTerm,
    groupFilter,
    scopeFilter,
    severityFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, groupFilter, scopeFilter, severityFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE)
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredIncidents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredIncidents, currentPage]);

  const metrics = useMemo(
    () => ({
      total: incidents.length,
      individual: incidents.filter(
        (incident) => incident.alumnoId !== null
      ).length,
      group: incidents.filter(
        (incident) => incident.alumnoId === null
      ).length,
      serious: incidents.filter(
        (incident) => incident.tipo.toLowerCase() === 'grave'
      ).length,
    }),
    [incidents]
  );

  const handleOpenCreate = async () => {
    if (!isTeacher) return;

    if (availableGroups.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'No tienes grupos asignados',
        text: 'Un administrador debe asignarte un grupo antes de registrar incidencias.',
        confirmButtonColor: '#7f1d1d',
      });
      return;
    }

    setFormScope('alumno');
    setFormGroupId(String(availableGroups[0].id));
    setIsModalOpen(true);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!isTeacher) return;

    const formData = new FormData(event.currentTarget);
    const gradoId = Number(formData.get('gradoId'));
    const alumnoId =
      formScope === 'grupo'
        ? null
        : Number(formData.get('alumnoId'));

    if (!gradoId) {
      await Swal.fire({
        icon: 'warning',
        title: 'Selecciona un grupo',
        confirmButtonColor: '#7f1d1d',
      });
      return;
    }

    if (formScope === 'alumno' && !alumnoId) {
      await Swal.fire({
        icon: 'warning',
        title: 'Selecciona un alumno',
        text: 'Para una incidencia individual debes elegir un alumno del grupo.',
        confirmButtonColor: '#7f1d1d',
      });
      return;
    }

    try {
      setSaving(true);

      await incidentService.create({
        tipo: String(formData.get('tipo') || '').trim(),
        descripcion: String(
          formData.get('descripcion') || ''
        ).trim(),
        fecha: String(formData.get('fecha') || ''),
        gradoId,
        alumnoId,
      });

      setIsModalOpen(false);
      await loadData();

      await Swal.fire({
        icon: 'success',
        title: 'Incidencia registrada',
        text:
          formScope === 'grupo'
            ? 'La incidencia se asignó al grupo completo.'
            : 'La incidencia se asignó al alumno seleccionado.',
        confirmButtonColor: '#7f1d1d',
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'No fue posible registrar la incidencia',
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

  const handleDelete = async (incident: Incident) => {
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar incidencia?',
      text: 'Esta acción no se puede deshacer.',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#7f1d1d',
      cancelButtonColor: '#6b7280',
    });

    if (!confirmation.isConfirmed) return;

    try {
      setDeletingUuid(incident.uuid);
      await incidentService.delete(incident.uuid);
      await loadData();

      await Swal.fire({
        icon: 'success',
        title: 'Incidencia eliminada',
        confirmButtonColor: '#7f1d1d',
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'No fue posible eliminarla',
        text: getErrorMessage(
          error,
          'Intenta nuevamente.'
        ),
        confirmButtonColor: '#7f1d1d',
      });
    } finally {
      setDeletingUuid(null);
    }
  };

  const columns = useMemo<IncidentColumn[]>(() => {
    const baseColumns: IncidentColumn[] = [
      {
        key: 'fecha',
        header: 'Fecha',
        render: (incident) => formatDate(incident.fecha),
      },
      {
        key: 'grado',
        header: 'Grupo',
        render: (incident) =>
          incident.grado?.nombre || 'Grupo no disponible',
      },
      {
        key: 'alumno',
        header: 'Alcance',
        render: (incident) =>
          incident.alumnoId === null ? (
            <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
              Grupo completo
            </span>
          ) : (
            <div>
              <p className="font-medium text-gray-900">
                {incident.alumno
                  ? `${incident.alumno.nombre} ${incident.alumno.apellido}`
                  : 'Alumno no disponible'}
              </p>
              {incident.alumno?.matricula && (
                <p className="text-xs text-gray-500">
                  {incident.alumno.matricula}
                </p>
              )}
            </div>
          ),
      },
      {
        key: 'tipo',
        header: 'Gravedad',
        render: (incident) => (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getSeverityClass(
              incident.tipo
            )}`}
          >
            {incident.tipo}
          </span>
        ),
      },
      {
        key: 'maestro',
        header: 'Registró',
        render: (incident) =>
          incident.maestro?.name || 'Usuario no disponible',
      },
      {
        key: 'descripcion',
        header: 'Detalles',
        render: (incident) => (
          <p className="min-w-64 whitespace-pre-wrap text-gray-700">
            {incident.descripcion}
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
        render: (incident) => {
          const canDelete =
            isAdmin ||
            (isTeacher &&
              Number(incident.maestroId) === Number(user?.id));

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
              disabled={deletingUuid === incident.uuid}
              onClick={() => void handleDelete(incident)}
            >
              {deletingUuid === incident.uuid
                ? 'Eliminando...'
                : 'Eliminar'}
            </Button>
          );
        },
      },
    ];
  }, [isAdmin, isTeacher, isStudent, user?.id, deletingUuid]);

  const pageDescription = isAdmin
    ? 'Consulta todas las incidencias registradas por los maestros.'
    : isTeacher
      ? 'Registra incidencias individuales o para uno de tus grupos.'
      : 'Consulta las incidencias individuales y grupales que te corresponden.';

  return (
    <ProtectedRoute
      allowedRoles={['administrador', 'coordinador', 'maestro', 'alumno']}
    >
      <AppLayout>
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-red-900">
                  Bitácora de incidencias
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
                  + Nueva incidencia
                </Button>
              )}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Total', metrics.total, 'text-gray-900'],
              ['Individuales', metrics.individual, 'text-blue-700'],
              ['Grupales', metrics.group, 'text-purple-700'],
              ['Graves', metrics.serious, 'text-red-700'],
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
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Input
                label="Buscar"
                placeholder="Alumno, grupo, maestro o detalle"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              <Select
                label="Grupo"
                value={groupFilter}
                onChange={(event) => setGroupFilter(event.target.value)}
                options={[
                  { label: 'Todos los grupos', value: 'todos' },
                  ...groups.map((group) => ({
                    label: group.nombre,
                    value: String(group.id),
                  })),
                ]}
              />

              <Select
                label="Alcance"
                value={scopeFilter}
                onChange={(event) =>
                  setScopeFilter(event.target.value as ScopeFilter)
                }
                options={[
                  { label: 'Todos', value: 'todos' },
                  { label: 'Por alumno', value: 'alumno' },
                  { label: 'Grupo completo', value: 'grupo' },
                ]}
              />

              <Select
                label="Gravedad"
                value={severityFilter}
                onChange={(event) =>
                  setSeverityFilter(event.target.value)
                }
                options={[
                  { label: 'Todas', value: 'todos' },
                  { label: 'Leve', value: 'leve' },
                  { label: 'Moderada', value: 'moderada' },
                  { label: 'Grave', value: 'grave' },
                ]}
              />
            </div>

            {loadingData ? (
              <div className="py-12 text-center text-sm text-gray-500">
                Cargando incidencias...
              </div>
            ) : (
              <Table columns={columns} data={currentData} />
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {currentData.length} de{' '}
                {filteredIncidents.length} incidencias
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
          title="Registrar incidencia"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Grupo"
                name="gradoId"
                required
                value={formGroupId}
                onChange={(event) => {
                  setFormGroupId(event.target.value);
                }}
                options={availableGroups.map((group) => ({
                  label: group.nombre,
                  value: String(group.id),
                }))}
              />

              <Select
                label="Aplicar incidencia a"
                name="alcance"
                required
                value={formScope}
                onChange={(event) =>
                  setFormScope(event.target.value as IncidentScope)
                }
                options={[
                  { label: 'Un alumno', value: 'alumno' },
                  { label: 'Grupo completo', value: 'grupo' },
                ]}
              />
            </div>

            {formScope === 'alumno' && (
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
            )}

            {formScope === 'grupo' && selectedFormGroup && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800">
                La incidencia se mostrará a los{' '}
                <strong>
                  {selectedFormGroup.alumnos?.length || 0} alumnos
                </strong>{' '}
                inscritos en {selectedFormGroup.nombre}.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Gravedad"
                name="tipo"
                required
                defaultValue="Leve"
                options={[
                  { label: 'Leve', value: 'Leve' },
                  { label: 'Moderada', value: 'Moderada' },
                  { label: 'Grave', value: 'Grave' },
                ]}
              />

              <Input
                label="Fecha"
                name="fecha"
                type="date"
                required
                defaultValue={getToday()}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="incident-description"
                className="text-sm text-gray-700"
              >
                Descripción
              </label>
              <textarea
                id="incident-description"
                name="descripcion"
                required
                minLength={5}
                rows={4}
                placeholder="Describe claramente qué ocurrió y cualquier acción tomada."
                className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>

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
                disabled={saving}
              >
                {saving ? 'Registrando...' : 'Registrar incidencia'}
              </Button>
            </div>
          </form>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}
