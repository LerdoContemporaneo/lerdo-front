'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

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

type Group = {
  id: number;
  uuid: string;
  nombre: string;
  maestroId: number | null;
  maestro?: Teacher | null;
};

type Homework = {
  id: number;
  uuid: string;
  titulo: string;
  descripcion: string;
  fechaAsignacion: string;
  fechaEntrega: string;
  gradoId: number;
  maestroId: number;
  grado?: Group | null;
  maestro?: Teacher | null;
};

type HomeworkPayload = {
  titulo: string;
  descripcion: string;
  fechaAsignacion: string;
  fechaEntrega: string;
  gradoId: number;
};

const formatDate = (date: string) => {
  if (!date) return 'Sin fecha';

  return new Date(`${date.slice(0, 10)}T00:00:00`)
    .toLocaleDateString('es-MX');
};

export default function TareasPage() {
  const { user } = useAuth();

  const [tareas, setTareas] = useState<Homework[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarea, setEditingTarea] =
    useState<Homework | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingUuid, setDeletingUuid] =
    useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoadingData(true);

      const [tareasData, groupsData] = await Promise.all([
        homeworkService.getAll(),
        gradeService.getAll(),
      ]);

      setTareas(
        Array.isArray(tareasData) ? tareasData : []
      );

      setGroups(
        Array.isArray(groupsData) ? groupsData : []
      );
    } catch (error) {
      console.error('Error cargando tareas y grupos:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar las tareas'
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /*
   * El administrador puede seleccionar cualquier grupo
   * que tenga maestro.
   *
   * El maestro solamente puede seleccionar sus grupos.
   */
  const availableGroups = useMemo(() => {
    const groupsWithTeacher = groups.filter(
      (group) => Number(group.maestroId) > 0
    );

    if (user?.role === 'administrador') {
      return groupsWithTeacher;
    }

    return groupsWithTeacher.filter(
      (group) =>
        Number(group.maestroId) === Number(user?.id)
    );
  }, [groups, user]);

  const handleOpenCreate = () => {
    if (availableGroups.length === 0) {
      alert(
        'No tienes grupos asignados para crear tareas.'
      );
      return;
    }

    setEditingTarea(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tarea: Homework) => {
    setEditingTarea(tarea);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;

    setEditingTarea(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const titulo = String(
      formData.get('titulo') || ''
    ).trim();

    const descripcion = String(
      formData.get('descripcion') || ''
    ).trim();

    const fechaAsignacion = String(
      formData.get('fechaAsignacion') || ''
    );

    const fechaEntrega = String(
      formData.get('fechaEntrega') || ''
    );

    const gradoId = Number(
      formData.get('gradoId')
    );

    if (
      !titulo ||
      !descripcion ||
      !fechaAsignacion ||
      !fechaEntrega ||
      !Number.isInteger(gradoId) ||
      gradoId <= 0
    ) {
      alert('Completa correctamente todos los campos.');
      return;
    }

    if (fechaEntrega < fechaAsignacion) {
      alert(
        'La fecha de entrega no puede ser anterior a la fecha de asignación.'
      );
      return;
    }

    const selectedGroup = availableGroups.find(
      (group) => Number(group.id) === gradoId
    );

    if (!selectedGroup) {
      alert(
        'El grupo seleccionado no está disponible para este maestro.'
      );
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
        await homeworkService.update(
          editingTarea.uuid,
          payload
        );

        alert('Tarea actualizada correctamente.');
      } else {
        await homeworkService.create(payload);

        alert(
          `Tarea asignada al grupo ${selectedGroup.nombre}.`
        );
      }

      setIsModalOpen(false);
      setEditingTarea(null);

      await loadData();
    } catch (error) {
      console.error('Error guardando tarea:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar la tarea'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    tarea: Homework
  ) => {
    const confirmed = confirm(
      `¿Eliminar la tarea "${tarea.titulo}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingUuid(tarea.uuid);

      await homeworkService.delete(tarea.uuid);
      await loadData();

      alert('Tarea eliminada correctamente.');
    } catch (error) {
      console.error('Error eliminando tarea:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'No fue posible eliminar la tarea'
      );
    } finally {
      setDeletingUuid(null);
    }
  };

  return (
    <ProtectedRoute
      allowedRoles={['maestro', 'administrador']}
    >
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-red-900">
                Asignación de Tareas
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Asigna una tarea a todos los alumnos de un
                grupo.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleOpenCreate}
              disabled={
                loadingData ||
                availableGroups.length === 0
              }
              className="bg-red-900 text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Nueva Tarea
            </Button>
          </div>

          {availableGroups.length === 0 &&
            !loadingData && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                No tienes grupos asignados. Primero debe
                asignarse un grupo al maestro desde Gestión
                de Grupos.
              </div>
            )}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {loadingData ? (
              <div className="p-10 text-center text-gray-500">
                Cargando tareas...
              </div>
            ) : tareas.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-medium text-gray-700">
                  No hay tareas registradas
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Crea una tarea y asígnala a uno de tus
                  grupos.
                </p>
              </div>
            ) : (
              <Table
                columns={[
                  {
                    key: 'titulo',
                    header: 'Título',
                  },
                  {
                    key: 'grupo',
                    header: 'Grupo',
                    render: (tarea: Homework) => {
                      const group =
                        tarea.grado ??
                        groups.find(
                          (item) =>
                            Number(item.id) ===
                            Number(tarea.gradoId)
                        );

                      return group?.nombre || 'Sin grupo';
                    },
                  },
                  {
                    key: 'maestro',
                    header: 'Maestro',
                    render: (tarea: Homework) =>
                      tarea.maestro?.name ||
                      tarea.grado?.maestro?.name ||
                      user?.name ||
                      'No disponible',
                  },
                  {
                    key: 'fechaAsignacion',
                    header: 'Asignada',
                    render: (tarea: Homework) =>
                      formatDate(
                        tarea.fechaAsignacion
                      ),
                  },
                  {
                    key: 'fechaEntrega',
                    header: 'Entrega',
                    render: (tarea: Homework) =>
                      formatDate(tarea.fechaEntrega),
                  },
                  {
                    key: 'actions',
                    header: 'Acciones',
                    render: (tarea: Homework) => (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          className="bg-blue-50 text-xs text-blue-700 hover:bg-blue-100"
                          onClick={() =>
                            handleOpenEdit(tarea)
                          }
                        >
                          Editar
                        </Button>

                        <Button
                          type="button"
                          variant="danger"
                          className="bg-red-50 text-xs text-red-700 hover:bg-red-100"
                          disabled={
                            deletingUuid === tarea.uuid
                          }
                          onClick={() =>
                            handleDelete(tarea)
                          }
                        >
                          {deletingUuid === tarea.uuid
                            ? 'Eliminando...'
                            : 'Eliminar'}
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={tareas}
              />
            )}
          </div>
        </div>

        <Modal
          open={isModalOpen}
          onClose={handleCloseModal}
          title={
            editingTarea
              ? 'Editar Tarea'
              : 'Asignar Nueva Tarea'
          }
        >
          <form
            key={
              editingTarea?.uuid || 'new-homework'
            }
            onSubmit={handleSubmit}
            className="space-y-4 p-4"
          >
            <Input
              label="Título de la tarea"
              name="titulo"
              defaultValue={
                editingTarea?.titulo || ''
              }
              placeholder="Ej. Ejercicios de Matemáticas"
              required
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Descripción
              </label>

              <textarea
                name="descripcion"
                defaultValue={
                  editingTarea?.descripcion || ''
                }
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
                  editingTarea?.fechaAsignacion?.slice(
                    0,
                    10
                  ) || ''
                }
                required
              />

              <Input
                label="Fecha de entrega"
                name="fechaEntrega"
                type="date"
                defaultValue={
                  editingTarea?.fechaEntrega?.slice(
                    0,
                    10
                  ) || ''
                }
                required
              />
            </div>

            <Select
              label="Grupo"
              name="gradoId"
              required
              defaultValue={String(
                editingTarea?.gradoId ??
                  editingTarea?.grado?.id ??
                  ''
              )}
              options={[
                {
                  label: 'Selecciona un grupo',
                  value: '',
                },
                ...availableGroups.map((group) => ({
                  label: group.nombre,
                  value: String(group.id),
                })),
              ]}
            />

            <Button
              type="submit"
              disabled={
                saving ||
                availableGroups.length === 0
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
      </AppLayout>
    </ProtectedRoute>
  );
}