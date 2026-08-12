'use client';

import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '../components/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Table } from '../components/ui/Table';
import {
  levelService,
  userService,
  type EducationalLevel,
} from '../services/schoolService';

type StaffUser = {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role: 'coordinador' | 'maestro';
  niveles?: EducationalLevel[];
};

const Alert = Swal.mixin({
  confirmButtonColor: '#7f1d1d',
  cancelButtonColor: '#6b7280',
  buttonsStyling: true,
});

const createKey = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function EducationalLevelsPage() {
  const [levels, setLevels] = useState<EducationalLevel[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [levelModalOpen, setLevelModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] =
    useState<EducationalLevel | null>(null);

  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignmentUser, setAssignmentUser] = useState<StaffUser | null>(null);
  const [selectedLevelIds, setSelectedLevelIds] = useState<number[]>([]);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [levelsData, usersData] = await Promise.all([
        levelService.getAll(),
        userService.getAll(),
      ]);

      setLevels(
        [...levelsData].sort(
          (a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre)
        )
      );

      setStaff(
        (Array.isArray(usersData) ? usersData : [])
          .filter(
            (user: StaffUser) =>
              user.role === 'coordinador' || user.role === 'maestro'
          )
          .sort((a: StaffUser, b: StaffUser) =>
            a.name.localeCompare(b.name, 'es')
          )
      );
    } catch (error) {
      console.error('Error al cargar niveles:', error);
      setLevels([]);
      setStaff([]);

      await Alert.fire({
        title: 'No se pudo cargar la información',
        text:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al consultar niveles y personal.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const activeLevels = useMemo(
    () => levels.filter((level) => level.activo),
    [levels]
  );

  const coordinators = useMemo(
    () => staff.filter((user) => user.role === 'coordinador').length,
    [staff]
  );

  const openCreateLevel = () => {
    setEditingLevel(null);
    setLevelModalOpen(true);
  };

  const openEditLevel = (level: EducationalLevel) => {
    setEditingLevel(level);
    setLevelModalOpen(true);
  };

  const saveLevel = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nombre = String(formData.get('nombre') || '').trim();
    const claveInput = String(formData.get('clave') || '').trim();
    const orden = Number(formData.get('orden'));
    const activo = String(formData.get('activo')) === 'true';

    if (!nombre || !Number.isInteger(orden) || orden <= 0) {
      await Alert.fire({
        title: 'Datos incompletos',
        text: 'Escribe un nombre y un orden válido.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    const payload = {
      nombre,
      clave: createKey(claveInput || nombre),
      orden,
      activo,
    };

    try {
      setSaving(true);

      if (editingLevel) {
        await levelService.update(editingLevel.uuid, payload);
      } else {
        await levelService.create(payload);
      }

      setLevelModalOpen(false);
      setEditingLevel(null);
      await loadData();

      await Alert.fire({
        title: editingLevel ? 'Nivel actualizado' : 'Nivel creado',
        text: 'La información se guardó correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        timer: 1800,
      });
    } catch (error) {
      await Alert.fire({
        title: 'No se pudo guardar',
        text:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al guardar el nivel.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleLevel = async (level: EducationalLevel) => {
    try {
      await levelService.update(level.uuid, { activo: !level.activo });
      await loadData();
    } catch (error) {
      await Alert.fire({
        title: 'No se pudo cambiar el estado',
        text: error instanceof Error ? error.message : 'Intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    }
  };

  const deleteLevel = async (level: EducationalLevel) => {
    const result = await Alert.fire({
      title: `¿Eliminar ${level.nombre}?`,
      text: 'Si ya tiene personal o datos relacionados, deberás desactivarlo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    try {
      await levelService.delete(level.uuid);
      await loadData();
    } catch (error) {
      await Alert.fire({
        title: 'No se pudo eliminar',
        text: error instanceof Error ? error.message : 'Intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    }
  };

  const openAssignment = async (user: StaffUser) => {
    setAssignmentUser(user);
    setSelectedLevelIds([]);
    setAssignmentModalOpen(true);

    try {
      setLoadingAssignment(true);
      const result = await levelService.getForUser(user.uuid);
      setSelectedLevelIds(result.niveles.map((level) => Number(level.id)));
    } catch (error) {
      setAssignmentModalOpen(false);
      setAssignmentUser(null);
      await Alert.fire({
        title: 'No se pudieron cargar las asignaciones',
        text: error instanceof Error ? error.message : 'Intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      setLoadingAssignment(false);
    }
  };

  const toggleSelectedLevel = (levelId: number) => {
    setSelectedLevelIds((current) =>
      current.includes(levelId)
        ? current.filter((id) => id !== levelId)
        : [...current, levelId]
    );
  };

  const saveAssignment = async () => {
    if (!assignmentUser) return;

    try {
      setSaving(true);
      await levelService.replaceForUser(
        assignmentUser.uuid,
        selectedLevelIds
      );
      setAssignmentModalOpen(false);
      setAssignmentUser(null);
      await loadData();

      await Alert.fire({
        title: 'Asignación actualizada',
        text: 'Los niveles del usuario se guardaron correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        timer: 1800,
      });
    } catch (error) {
      await Alert.fire({
        title: 'No se pudo guardar la asignación',
        text: error instanceof Error ? error.message : 'Intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['administrador']}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-red-900">
                Niveles educativos
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Administra los niveles y asigna coordinadores o maestros.
              </p>
            </div>
            <Button
              onClick={openCreateLevel}
              className="bg-red-900 text-white hover:bg-red-800"
            >
              + Nuevo nivel
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Niveles registrados</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {levels.length}
              </p>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">Niveles activos</p>
              <p className="mt-1 text-3xl font-bold text-green-800">
                {activeLevels.length}
              </p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-700">Coordinadores</p>
              <p className="mt-1 text-3xl font-bold text-blue-800">
                {coordinators}
              </p>
            </div>
          </div>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="font-semibold text-gray-900">Catálogo de niveles</h2>
            </div>
            {loading ? (
              <div className="p-10 text-center text-gray-500">Cargando...</div>
            ) : (
              <Table
                columns={[
                  { key: 'orden', header: 'Orden' },
                  { key: 'nombre', header: 'Nombre' },
                  { key: 'clave', header: 'Clave' },
                  {
                    key: 'activo',
                    header: 'Estado',
                    render: (level: EducationalLevel) => (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          level.activo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {level.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Acciones',
                    render: (level: EducationalLevel) => (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          className="px-2 py-1 text-xs"
                          onClick={() => openEditLevel(level)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          className="px-2 py-1 text-xs"
                          onClick={() => void toggleLevel(level)}
                        >
                          {level.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          variant="danger"
                          className="px-2 py-1 text-xs"
                          onClick={() => void deleteLevel(level)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={levels}
              />
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="font-semibold text-gray-900">
                Asignación de personal por nivel
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Un usuario puede pertenecer a uno o varios niveles.
              </p>
            </div>
            {loading ? (
              <div className="p-10 text-center text-gray-500">Cargando...</div>
            ) : staff.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                Todavía no hay coordinadores o maestros registrados.
              </div>
            ) : (
              <Table
                columns={[
                  { key: 'name', header: 'Nombre' },
                  { key: 'email', header: 'Correo' },
                  {
                    key: 'role',
                    header: 'Rol',
                    render: (user: StaffUser) => (
                      <span className="capitalize">{user.role}</span>
                    ),
                  },
                  {
                    key: 'niveles',
                    header: 'Niveles asignados',
                    render: (user: StaffUser) =>
                      user.niveles?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {user.niveles.map((level) => (
                            <span
                              key={level.uuid}
                              className="rounded-full bg-red-50 px-2 py-1 text-xs text-red-700"
                            >
                              {level.nombre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin asignar</span>
                      ),
                  },
                  {
                    key: 'actions',
                    header: 'Acciones',
                    render: (user: StaffUser) => (
                      <Button
                        className="bg-red-900 px-3 py-1.5 text-xs text-white hover:bg-red-800"
                        onClick={() => void openAssignment(user)}
                      >
                        Asignar niveles
                      </Button>
                    ),
                  },
                ]}
                data={staff}
              />
            )}
          </section>
        </div>

        <Modal
          open={levelModalOpen}
          onClose={() => !saving && setLevelModalOpen(false)}
          title={editingLevel ? 'Editar nivel educativo' : 'Crear nivel educativo'}
          size="sm"
        >
          <form
            key={editingLevel?.uuid || 'new-level'}
            onSubmit={saveLevel}
            className="space-y-4"
          >
            <Input
              label="Nombre"
              name="nombre"
              defaultValue={editingLevel?.nombre || ''}
              placeholder="Ej. Preescolar"
              maxLength={80}
              required
            />
            <Input
              label="Clave"
              name="clave"
              defaultValue={editingLevel?.clave || ''}
              placeholder="Se genera a partir del nombre"
              maxLength={40}
            />
            <Input
              label="Orden"
              name="orden"
              type="number"
              min={1}
              step={1}
              defaultValue={editingLevel?.orden || levels.length + 1}
              required
            />
            <Select
              label="Estado"
              name="activo"
              defaultValue={String(editingLevel?.activo ?? true)}
              options={[
                { label: 'Activo', value: 'true' },
                { label: 'Inactivo', value: 'false' },
              ]}
            />
            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-red-900 text-white hover:bg-red-800"
            >
              {saving ? 'Guardando...' : 'Guardar nivel'}
            </Button>
          </form>
        </Modal>

        <Modal
          open={assignmentModalOpen}
          onClose={() => !saving && setAssignmentModalOpen(false)}
          title={`Asignar niveles${assignmentUser ? `: ${assignmentUser.name}` : ''}`}
          size="sm"
        >
          {loadingAssignment ? (
            <div className="py-8 text-center text-gray-500">Cargando...</div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Selecciona todos los niveles que este usuario puede administrar o
                impartir.
              </p>

              <div className="space-y-2">
                {activeLevels.map((level) => (
                  <label
                    key={level.uuid}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLevelIds.includes(level.id)}
                      onChange={() => toggleSelectedLevel(level.id)}
                      className="h-4 w-4 accent-red-900"
                    />
                    <span className="font-medium text-gray-800">
                      {level.nombre}
                    </span>
                  </label>
                ))}
              </div>

              <Button
                type="button"
                disabled={saving || !assignmentUser}
                onClick={() => void saveAssignment()}
                className="w-full bg-red-900 text-white hover:bg-red-800"
              >
                {saving ? 'Guardando...' : 'Guardar asignación'}
              </Button>
            </div>
          )}
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}
