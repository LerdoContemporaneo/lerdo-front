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
import {
  gradeService,
  homeworkService,
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

type Homework = {
  id: number;
  uuid: string;
  titulo: string;
  descripcion: string;
  fechaAsignacion: string;
  fechaEntrega: string;
  gradoId: number;
  grado?: Group | null;
};

type HomeworkPayload = {
  titulo: string;
  descripcion: string;
  fechaAsignacion: string;
  fechaEntrega: string;
  gradoId: number;
};

type HomeworkStatus = 'todas' | 'pendientes' | 'hoy' | 'vencidas';

type HomeworkColumn = {
  key: string;
  header: string;
  render?: (tarea: Homework) => React.ReactNode;
};

const PAGE_SIZE = 10;

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getDateOnly = (date: string) => date?.slice(0, 10) || '';

const formatDate = (date: string) => {
  const dateOnly = getDateOnly(date);

  if (!dateOnly) return 'Sin fecha';

  return new Date(`${dateOnly}T00:00:00`).toLocaleDateString(
    'es-MX',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
};

const getHomeworkStatus = (tarea: Homework) => {
  const deliveryDate = getDateOnly(tarea.fechaEntrega);
  const today = getToday();

  if (deliveryDate < today) {
    return {
      key: 'vencidas' as const,
      label: 'Vencida',
      className: 'bg-red-100 text-red-700',
    };
  }

  if (deliveryDate === today) {
    return {
      key: 'hoy' as const,
      label: 'Entrega hoy',
      className: 'bg-amber-100 text-amber-800',
    };
  }

  return {
    key: 'pendientes' as const,
    label: 'Pendiente',
    className: 'bg-emerald-100 text-emerald-700',
  };
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function TareasPage() {
  const { user } = useAuth();

  const [tareas, setTareas] = useState<Homework[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarea, setEditingTarea] =
    useState<Homework | null>(null);
  const [selectedFormGroupId, setSelectedFormGroupId] =
    useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingUuid, setDeletingUuid] =
    useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('todos');
  const [statusFilter, setStatusFilter] =
    useState<HomeworkStatus>('todas');
  const [currentPage, setCurrentPage] = useState(1);

  const isAdmin = user?.role === 'administrador';
  const isTeacher = user?.role === 'maestro';
  const isStudent = user?.role === 'alumno';
  const canManage = isTeacher;

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoadingData(true);

      const [tareasData, groupsData] = await Promise.all([
        homeworkService.getAll(),
        gradeService.getAll(),
      ]);

      setTareas(Array.isArray(tareasData) ? tareasData : []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (error) {
      console.error('Error cargando tareas y grupos:', error);

      await Swal.fire({
        icon: 'error',
        title: 'No fue posible cargar las tareas',
        text: getErrorMessage(
          error,
          'Verifica la conexión con el servidor.'
        ),
      });
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /*
   * GET /grados ya filtra los grupos por rol en el backend.
   * Esta validación adicional evita mostrar por accidente otro grupo
   * al maestro si una respuesta antigua queda en memoria.
   */
  const availableGroups = useMemo(() => {
    if (!isTeacher) return groups;

    return groups.filter(
      (group) => Number(group.maestroId) === Number(user?.id)
    );
  }, [groups, isTeacher, user?.id]);

  const resolveGroup = useCallback(
    (tarea: Homework): Group | undefined => {
      const groupFromList = groups.find(
        (group) => Number(group.id) === Number(tarea.gradoId)
      );

      if (!tarea.grado) return groupFromList;

      return {
        ...groupFromList,
        ...tarea.grado,
        maestro:
          tarea.grado.maestro ?? groupFromList?.maestro ?? null,
        alumnos:
          tarea.grado.alumnos ?? groupFromList?.alumnos ?? [],
      };
    },
    [groups]
  );

  const selectedFormGroup = useMemo(
    () =>
      availableGroups.find(
        (group) => String(group.id) === selectedFormGroupId
      ),
    [availableGroups, selectedFormGroupId]
  );

  const filteredTareas = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tareas.filter((tarea) => {
      const group = resolveGroup(tarea);
      const teacherName = group?.maestro?.name || '';
      const status = getHomeworkStatus(tarea);

      const matchesSearch =
        !normalizedSearch ||
        tarea.titulo.toLowerCase().includes(normalizedSearch) ||
        tarea.descripcion.toLowerCase().includes(normalizedSearch) ||
        (group?.nombre || '').toLowerCase().includes(normalizedSearch) ||
        teacherName.toLowerCase().includes(normalizedSearch);

      const matchesGroup =
        groupFilter === 'todos' ||
        String(tarea.gradoId) === groupFilter;

      const matchesStatus =
        statusFilter === 'todas' || status.key === statusFilter;

      return matchesSearch && matchesGroup && matchesStatus;
    });
  }, [tareas, searchTerm, groupFilter, statusFilter, resolveGroup]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, groupFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTareas.length / PAGE_SIZE)
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedTareas = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTareas.slice(start, start + PAGE_SIZE);
  }, [filteredTareas, currentPage]);

  const metrics = useMemo(() => {
    const today = getToday();

    return {
      total: tareas.length,
      pending: tareas.filter(
        (tarea) => getDateOnly(tarea.fechaEntrega) > today
      ).length,
      today: tareas.filter(
        (tarea) => getDateOnly(tarea.fechaEntrega) === today
      ).length,
      expired: tareas.filter(
        (tarea) => getDateOnly(tarea.fechaEntrega) < today
      ).length,
    };
  }, [tareas]);

  const handleOpenCreate = async () => {
    if (!canManage) return;

    if (availableGroups.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'No tienes grupos asignados',
        text: 'Un administrador debe asignarte un grupo antes de crear tareas.',
      });
      return;
    }

    setEditingTarea(null);
    setSelectedFormGroupId('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (tarea: Homework) => {
    if (!canManage) return;

    const isOwnGroup = availableGroups.some(
      (group) => Number(group.id) === Number(tarea.gradoId)
    );

    if (!isOwnGroup) {
      await Swal.fire({
        icon: 'error',
        title: 'Tarea no disponible',
        text: 'Sólo puedes modificar tareas de tus grupos.',
      });
      return;
    }

    setEditingTarea(tarea);
    setSelectedFormGroupId(String(tarea.gradoId));
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;

    setEditingTarea(null);
    setSelectedFormGroupId('');
    setIsModalOpen(false);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!canManage) return;

    const formData = new FormData(event.currentTarget);
    const titulo = String(formData.get('titulo') || '').trim();
    const descripcion = String(
      formData.get('descripcion') || ''
    ).trim();
    const fechaAsignacion = String(
      formData.get('fechaAsignacion') || ''
    );
    const fechaEntrega = String(
      formData.get('fechaEntrega') || ''
    );
    const gradoId = Number(formData.get('gradoId'));

    if (
      !titulo ||
      !descripcion ||
      !fechaAsignacion ||
      !fechaEntrega ||
      !Number.isInteger(gradoId) ||
      gradoId <= 0
    ) {
      await Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Completa correctamente todos los campos.',
      });
      return;
    }

    if (fechaEntrega < fechaAsignacion) {
      await Swal.fire({
        icon: 'warning',
        title: 'Fechas incorrectas',
        text: 'La fecha de entrega no puede ser anterior a la fecha de asignación.',
      });
      return;
    }

    const selectedGroup = availableGroups.find(
      (group) => Number(group.id) === gradoId
    );

    if (!selectedGroup) {
      await Swal.fire({
        icon: 'error',
        title: 'Grupo no disponible',
        text: 'Sólo puedes asignar tareas a tus grupos.',
      });
      return;
    }

    const payload: HomeworkPayload = {
      titulo,
      descripcion,
      fechaAsignacion,
      fechaEntrega,
      gradoId,
    };

    try {
      setSaving(true);

      if (editingTarea) {
        await homeworkService.update(editingTarea.uuid, payload);
      } else {
        await homeworkService.create(payload);
      }

      setIsModalOpen(false);
      setEditingTarea(null);
      setSelectedFormGroupId('');
      await loadData();

      await Swal.fire({
        icon: 'success',
        title: editingTarea
          ? 'Tarea actualizada'
          : 'Tarea asignada',
        text: editingTarea
          ? 'Los cambios se guardaron correctamente.'
          : `La tarea ya está visible para los alumnos de ${selectedGroup.nombre}.`,
        timer: 2300,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error guardando tarea:', error);

      await Swal.fire({
        icon: 'error',
        title: 'No fue posible guardar la tarea',
        text: getErrorMessage(
          error,
          'Intenta nuevamente en unos momentos.'
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tarea: Homework) => {
    if (!canManage) return;

    const confirmation = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar esta tarea?',
      text: `Se eliminará "${tarea.titulo}" para todo el grupo.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#991b1b',
    });

    if (!confirmation.isConfirmed) return;

    try {
      setDeletingUuid(tarea.uuid);
      await homeworkService.delete(tarea.uuid);
      await loadData();

      await Swal.fire({
        icon: 'success',
        title: 'Tarea eliminada',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error eliminando tarea:', error);

      await Swal.fire({
        icon: 'error',
        title: 'No fue posible eliminar la tarea',
        text: getErrorMessage(
          error,
          'Intenta nuevamente en unos momentos.'
        ),
      });
    } finally {
      setDeletingUuid(null);
    }
  };

  const columns = useMemo<HomeworkColumn[]>(() => {
    const baseColumns: HomeworkColumn[] = [
      {
        key: 'titulo',
        header: 'Tarea',
        render: (tarea) => (
          <div className="min-w-56">
            <p className="font-semibold text-gray-900">
              {tarea.titulo}
            </p>
            <p className="mt-1 max-w-md text-xs leading-5 text-gray-500">
              {tarea.descripcion}
            </p>
          </div>
        ),
      },
      {
        key: 'grupo',
        header: 'Grupo',
        render: (tarea) => {
          const group = resolveGroup(tarea);

          return (
            <div>
              <p className="font-medium text-gray-800">
                {group?.nombre || 'Sin grupo'}
              </p>
              {(isAdmin || isTeacher) && (
                <p className="mt-1 text-xs text-gray-500">
                  {group?.alumnos?.length ?? 0} alumnos
                </p>
              )}
            </div>
          );
        },
      },
      {
        key: 'maestro',
        header: 'Maestro',
        render: (tarea) =>
          resolveGroup(tarea)?.maestro?.name ||
          (isTeacher ? user?.name : 'No disponible'),
      },
      {
        key: 'fechaAsignacion',
        header: 'Asignada',
        render: (tarea) => formatDate(tarea.fechaAsignacion),
      },
      {
        key: 'fechaEntrega',
        header: 'Entrega',
        render: (tarea) => {
          const status = getHomeworkStatus(tarea);

          return (
            <div className="space-y-2">
              <p className="whitespace-nowrap">
                {formatDate(tarea.fechaEntrega)}
              </p>
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${status.className}`}
              >
                {status.label}
              </span>
            </div>
          );
        },
      },
    ];

    if (canManage) {
      baseColumns.push({
        key: 'actions',
        header: 'Acciones',
        render: (tarea) => (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              className="border-blue-200 bg-blue-50 text-xs text-blue-700 hover:bg-blue-100"
              onClick={() => void handleOpenEdit(tarea)}
            >
              Editar
            </Button>
            <Button
              type="button"
              variant="danger"
              className="bg-red-50 text-xs text-red-700 hover:bg-red-100"
              disabled={deletingUuid === tarea.uuid}
              onClick={() => void handleDelete(tarea)}
            >
              {deletingUuid === tarea.uuid
                ? 'Eliminando...'
                : 'Eliminar'}
            </Button>
          </div>
        ),
      });
    }

    return baseColumns;
  }, [
    canManage,
    deletingUuid,
    isAdmin,
    isTeacher,
    resolveGroup,
    user?.name,
  ]);

  const pageTitle = isAdmin
    ? 'Control de Tareas'
    : isStudent
      ? 'Mis Tareas'
      : 'Tareas de mis Grupos';

  const pageDescription = isAdmin
    ? 'Consulta todas las tareas asignadas por los maestros.'
    : isStudent
      ? 'Consulta las tareas correspondientes a los grupos de tu horario escolar.'
      : 'Asigna tareas únicamente a los grupos y alumnos que tienes a tu cargo.';

  const emptyMessage =
    tareas.length === 0
      ? isStudent
        ? 'Tus maestros todavía no han asignado tareas.'
        : isAdmin
          ? 'Los maestros todavía no han asignado tareas.'
          : 'Todavía no has asignado tareas a tus grupos.'
      : 'No hay tareas que coincidan con los filtros seleccionados.';

  return (
    <ProtectedRoute
      allowedRoles={['administrador', 'coordinador', 'maestro', 'alumno']}
    >
      <AppLayout>
        <div className="space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-red-900">
                {pageTitle}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {pageDescription}
              </p>
            </div>

            {canManage && (
              <Button
                type="button"
                onClick={() => void handleOpenCreate()}
                disabled={loadingData || availableGroups.length === 0}
                className="bg-red-900 text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Nueva Tarea
              </Button>
            )}
          </header>

          {isTeacher && availableGroups.length === 0 && !loadingData && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No tienes grupos asignados. Un administrador debe asignarte
              un grupo y alumnos antes de que puedas crear tareas.
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Total de tareas',
                value: metrics.total,
                style: 'border-slate-200 bg-white text-slate-900',
              },
              {
                label: 'Pendientes',
                value: metrics.pending,
                style: 'border-emerald-200 bg-emerald-50 text-emerald-800',
              },
              {
                label: 'Entregan hoy',
                value: metrics.today,
                style: 'border-amber-200 bg-amber-50 text-amber-800',
              },
              {
                label: 'Vencidas',
                value: metrics.expired,
                style: 'border-red-200 bg-red-50 text-red-800',
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className={`rounded-xl border p-4 shadow-sm ${metric.style}`}
              >
                <p className="text-sm font-medium">{metric.label}</p>
                <p className="mt-2 text-3xl font-bold">{metric.value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-3">
              <Input
                label="Buscar tarea"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Título, descripción, grupo o maestro"
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
                label="Estado de entrega"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as HomeworkStatus)
                }
                options={[
                  { label: 'Todos los estados', value: 'todas' },
                  { label: 'Pendientes', value: 'pendientes' },
                  { label: 'Entregan hoy', value: 'hoy' },
                  { label: 'Vencidas', value: 'vencidas' },
                ]}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {loadingData ? (
              <div className="p-12 text-center text-gray-500">
                Cargando tareas...
              </div>
            ) : filteredTareas.length === 0 ? (
              <div className="p-12 text-center">
                <p className="font-semibold text-gray-700">
                  No hay tareas para mostrar
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {emptyMessage}
                </p>
              </div>
            ) : (
              <>
                <Table columns={columns} data={paginatedTareas} />

                {totalPages > 1 && (
                  <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-500">
                      Página {currentPage} de {totalPages} ·{' '}
                      {filteredTareas.length} tareas
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((page) => Math.max(1, page - 1))
                        }
                      >
                        Anterior
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                          setCurrentPage((page) =>
                            Math.min(totalPages, page + 1)
                          )
                        }
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {canManage && (
          <Modal
            open={isModalOpen}
            onClose={handleCloseModal}
            title={editingTarea ? 'Editar Tarea' : 'Asignar Nueva Tarea'}
          >
            <form
              key={editingTarea?.uuid || 'new-homework'}
              onSubmit={handleSubmit}
              className="space-y-4 p-4"
            >
              <Input
                label="Título de la tarea"
                name="titulo"
                defaultValue={editingTarea?.titulo || ''}
                placeholder="Ej. Ejercicios de Matemáticas"
                required
              />

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="descripcion"
                  className="text-sm font-medium text-gray-700"
                >
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  defaultValue={editingTarea?.descripcion || ''}
                  className="rounded-md border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Fecha de asignación"
                  name="fechaAsignacion"
                  type="date"
                  defaultValue={
                    getDateOnly(editingTarea?.fechaAsignacion || '') ||
                    getToday()
                  }
                  required
                />
                <Input
                  label="Fecha de entrega"
                  name="fechaEntrega"
                  type="date"
                  min={getToday()}
                  defaultValue={getDateOnly(
                    editingTarea?.fechaEntrega || ''
                  )}
                  required
                />
              </div>

              <Select
                label="Grupo"
                name="gradoId"
                required
                value={selectedFormGroupId}
                onChange={(event) =>
                  setSelectedFormGroupId(event.target.value)
                }
                options={[
                  { label: 'Selecciona uno de tus grupos', value: '' },
                  ...availableGroups.map((group) => ({
                    label: `${group.nombre} (${group.alumnos?.length ?? 0} alumnos)`,
                    value: String(group.id),
                  })),
                ]}
              />

              {selectedFormGroup && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <p className="text-sm font-semibold text-blue-900">
                    Alumnos que recibirán la tarea
                  </p>
                  {selectedFormGroup.alumnos?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedFormGroup.alumnos.slice(0, 8).map((student) => (
                        <span
                          key={student.id}
                          className="rounded-full bg-white px-2 py-1 text-xs text-blue-800 shadow-sm"
                        >
                          {student.nombre} {student.apellido}
                        </span>
                      ))}
                      {selectedFormGroup.alumnos.length > 8 && (
                        <span className="px-2 py-1 text-xs font-medium text-blue-800">
                          +{selectedFormGroup.alumnos.length - 8} más
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-amber-700">
                      Este grupo todavía no tiene alumnos inscritos.
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  saving ||
                  availableGroups.length === 0 ||
                  !selectedFormGroupId
                }
                className="w-full bg-red-900 text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? 'Guardando...'
                  : editingTarea
                    ? 'Actualizar Tarea'
                    : 'Asignar Tarea al Grupo'}
              </Button>
            </form>
          </Modal>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
