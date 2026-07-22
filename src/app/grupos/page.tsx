'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';

import AppLayout from '../components/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import { Table } from '../components/ui/Table';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { gradeService, userService } from '../services/schoolService';
import { useAuth } from '../hooks/useAuth';

const GROUPS_PER_PAGE = 10;

type Teacher = {
  id: number;
  uuid: string;
  name: string;
  email?: string;
  role: string;
};

type Group = {
  id: number;
  uuid: string;
  nombre: string;
  maestroId: number | null;
  maestro?: Teacher | null;
};

const Alert = Swal.mixin({
  confirmButtonColor: '#7f1d1d',
  cancelButtonColor: '#6b7280',
  buttonsStyling: true,
});

export default function GroupsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';

  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    try {
      setLoadingData(true);

      const [groupsData, usersData] = await Promise.all([
        gradeService.getAll(),
        userService.getAll(),
      ]);

      setGroups(Array.isArray(groupsData) ? groupsData : []);

      const users = Array.isArray(usersData) ? usersData : [];

      setTeachers(
        users.filter((currentUser: Teacher) => {
          return currentUser.role === 'maestro';
        })
      );
    } catch (error: any) {
      console.error('Error al cargar los grupos:', error);

      setGroups([]);
      setTeachers([]);

      await Alert.fire({
        title: 'Error al cargar',
        text:
          error?.message ||
          'No fue posible cargar los grupos y los maestros.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredGroups = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return groups.filter((group) => {
      const groupName = String(group.nombre || '').toLowerCase();
      const teacherName = String(group.maestro?.name || '').toLowerCase();
      const teacherEmail = String(group.maestro?.email || '').toLowerCase();

      const matchesSearch =
        !search ||
        groupName.includes(search) ||
        teacherName.includes(search) ||
        teacherEmail.includes(search);

      const matchesTeacher =
        teacherFilter === 'todos' ||
        (teacherFilter === 'sin-asignar'
          ? !group.maestroId
          : String(group.maestroId) === teacherFilter);

      return matchesSearch && matchesTeacher;
    });
  }, [groups, searchTerm, teacherFilter]);

  const assignedTeachers = useMemo(
    () =>
      new Set(
        groups
          .filter((group) => group.maestroId)
          .map((group) => group.maestroId)
      ).size,
    [groups]
  );

  const groupsWithoutTeacher = useMemo(
    () => groups.filter((group) => !group.maestroId).length,
    [groups]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredGroups.length / GROUPS_PER_PAGE)
  );

  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * GROUPS_PER_PAGE;

    return filteredGroups.slice(
      startIndex,
      startIndex + GROUPS_PER_PAGE
    );
  }, [filteredGroups, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, teacherFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const firstPage = Math.max(1, currentPage - 2);
    const lastPage = Math.min(totalPages, currentPage + 2);

    for (let page = firstPage; page <= lastPage; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  const firstVisibleGroup =
    filteredGroups.length === 0
      ? 0
      : (currentPage - 1) * GROUPS_PER_PAGE + 1;

  const lastVisibleGroup = Math.min(
    currentPage * GROUPS_PER_PAGE,
    filteredGroups.length
  );

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: Group) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;

    setEditingGroup(null);
    setIsModalOpen(false);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setTeacherFilter('todos');
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    if (filteredGroups.length === 0) {
      void Alert.fire({
        title: 'Sin datos para exportar',
        text: 'No hay grupos que coincidan con los filtros actuales.',
        icon: 'info',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    const escapeCsv = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const rows = filteredGroups.map((group) => [
      group.nombre,
      group.maestro?.name || 'Sin asignar',
      group.maestro?.email || '',
      group.maestroId ? 'Asignado' : 'Sin asignar',
    ]);

    const csv = [
      ['Grupo', 'Maestro', 'Correo', 'Estado'],
      ...rows,
    ]
      .map((row) => row.map(escapeCsv).join(','))
      .join('\r\n');

    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grupos-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const nombre = String(formData.get('nombre') || '').trim();
    const maestroIdValue = String(
      formData.get('maestroId') || ''
    ).trim();

    if (!nombre) {
      await Alert.fire({
        title: 'Nombre obligatorio',
        text: 'Escribe el nombre del grupo.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });

      return;
    }

    if (!maestroIdValue) {
      await Alert.fire({
        title: 'Maestro obligatorio',
        text: 'Selecciona al maestro responsable del grupo.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });

      return;
    }

    const maestroId = Number(maestroIdValue);

    if (!Number.isInteger(maestroId) || maestroId <= 0) {
      await Alert.fire({
        title: 'Maestro no válido',
        text: 'Selecciona un maestro válido.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });

      return;
    }

    const selectedTeacher = teachers.find(
      (teacher) => teacher.id === maestroId
    );

    if (!selectedTeacher) {
      await Alert.fire({
        title: 'Maestro no encontrado',
        text: 'El maestro seleccionado ya no está disponible.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });

      return;
    }

    const duplicateGroup = groups.some((group) => {
      const sameName =
        group.nombre.trim().toLowerCase() === nombre.toLowerCase();

      const isDifferentGroup =
        !editingGroup || group.uuid !== editingGroup.uuid;

      return sameName && isDifferentGroup;
    });

    if (duplicateGroup) {
      await Alert.fire({
        title: 'Grupo duplicado',
        text: `Ya existe un grupo con el nombre "${nombre}".`,
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });

      return;
    }

    const payload = {
      nombre,
      maestroId,
    };

    try {
      setSaving(true);

      if (editingGroup) {
        await gradeService.update(editingGroup.uuid, payload);
      } else {
        await gradeService.create(payload);
      }

      setIsModalOpen(false);
      setEditingGroup(null);

      await loadData();

      await Alert.fire({
        title: editingGroup
          ? 'Grupo actualizado'
          : 'Grupo registrado',
        text: editingGroup
          ? 'Los cambios del grupo se guardaron correctamente.'
          : 'El nuevo grupo se creó correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        timer: 2200,
        timerProgressBar: true,
      });
    } catch (error: any) {
      console.error('Error al guardar el grupo:', error);

      await Alert.fire({
        title: editingGroup
          ? 'No se pudo actualizar'
          : 'No se pudo registrar',
        text:
          error?.message ||
          'Ocurrió un error al guardar la información del grupo.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (group: Group) => {
    const result = await Alert.fire({
      title: '¿Eliminar grupo?',
      html: `
        <p>Se eliminará el grupo <strong>${group.nombre}</strong>.</p>
        <p style="margin-top: 8px;">
          Verifica que no tenga alumnos, asistencias o reportes relacionados.
        </p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingUuid(group.uuid);

      Alert.fire({
        title: 'Eliminando grupo...',
        text: 'Espera un momento.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await gradeService.delete(group.uuid);
      await loadData();

      await Alert.fire({
        title: 'Grupo eliminado',
        text: `El grupo ${group.nombre} se eliminó correctamente.`,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        timer: 2200,
        timerProgressBar: true,
      });
    } catch (error: any) {
      console.error('Error al eliminar el grupo:', error);

      await Alert.fire({
        title: 'No se pudo eliminar',
        text:
          error?.message ||
          'El grupo puede tener alumnos, asistencias o reportes relacionados.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      setDeletingUuid(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['administrador', 'maestro']}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-red-900">
                Gestión de Grupos
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Administra los grupos y sus maestros responsables.
              </p>
            </div>

            {isAdmin && (
              <Button
                onClick={handleOpenCreate}
                className="bg-red-900 text-white hover:bg-red-800"
              >
                + Crear Grupo
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Total de grupos</p>
              <p className="mt-2 text-3xl font-bold text-red-900">{groups.length}</p>
              <p className="mt-1 text-xs text-gray-400">Grupos registrados</p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Maestros asignados</p>
              <p className="mt-2 text-3xl font-bold text-blue-700">{assignedTeachers}</p>
              <p className="mt-1 text-xs text-gray-400">Maestros con al menos un grupo</p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
              <p className="text-sm font-medium text-gray-500">Grupos sin maestro</p>
              <p className="mt-2 text-3xl font-bold text-amber-600">{groupsWithoutTeacher}</p>
              <p className="mt-1 text-xs text-gray-400">Pendientes de asignación</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_280px_auto_auto] lg:items-end">
              <div className="flex-1">
                <Input
                  label="Buscar grupo"
                  name="search"
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Buscar por grupo o maestro..."
                />
              </div>

              <Select
                label="Filtrar por maestro"
                name="teacherFilter"
                value={teacherFilter}
                onChange={(event) => setTeacherFilter(event.target.value)}
                options={[
                  { label: 'Todos los maestros', value: 'todos' },
                  { label: 'Sin maestro asignado', value: 'sin-asignar' },
                  ...teachers.map((teacher) => ({
                    label: teacher.name,
                    value: String(teacher.id),
                  })),
                ]}
              />

              {(searchTerm || teacherFilter !== 'todos') && (
                <Button
                  type="button"
                  onClick={handleClearFilters}
                  className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                >
                  Limpiar filtros
                </Button>
              )}

              <Button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredGroups.length === 0}
                className="bg-emerald-700 text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Exportar CSV
              </Button>
            </div>

            <p className="mt-3 text-sm text-gray-500">
              {filteredGroups.length === 1
                ? '1 grupo encontrado'
                : `${filteredGroups.length} grupos encontrados`}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {loadingData ? (
              <div className="p-10 text-center text-gray-500">
                Cargando grupos...
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-medium text-gray-700">
                  No se encontraron grupos
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || teacherFilter !== 'todos'
                    ? 'Intenta cambiar la búsqueda o los filtros.'
                    : 'Todavía no hay grupos registrados.'}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table
                    columns={[
                    {
                      key: 'nombre',
                      header: 'Grupo',
                    },
                    {
                      key: 'maestro',
                      header: 'Maestro',
                      render: (group: Group) => (
                        <div>
                          <p className="font-medium text-gray-900">
                            {group.maestro?.name || 'No asignado'}
                          </p>
                          {group.maestro?.email && (
                            <p className="text-xs text-gray-500">{group.maestro.email}</p>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: 'estado',
                      header: 'Estado',
                      render: (group: Group) =>
                        group.maestroId ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                            Asignado
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                            Sin asignar
                          </span>
                        ),
                    },
                    {
                      key: 'actions',
                      header: 'Acciones',
                      render: (group: Group) =>
                        isAdmin ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="primary"
                              className="bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
                              onClick={() => handleOpenEdit(group)}
                            >
                              Editar
                            </Button>

                            <Button
                              variant="danger"
                              className="bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                              disabled={deletingUuid === group.uuid}
                              onClick={() => handleDelete(group)}
                            >
                              {deletingUuid === group.uuid
                                ? 'Eliminando...'
                                : 'Eliminar'}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Solo lectura
                          </span>
                        ),
                    },
                    ]}
                    data={paginatedGroups}
                  />
                </div>

                <div className="grid gap-4 p-4 md:hidden">
                  {paginatedGroups.map((group) => (
                    <article key={group.uuid} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Grupo</p>
                          <h2 className="mt-1 text-lg font-bold text-red-900">{group.nombre}</h2>
                        </div>
                        {group.maestroId ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Asignado</span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Sin asignar</span>
                        )}
                      </div>

                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <p className="text-xs text-gray-400">Maestro responsable</p>
                        <p className="mt-1 font-medium text-gray-800">{group.maestro?.name || 'No asignado'}</p>
                        {group.maestro?.email && <p className="mt-0.5 text-sm text-gray-500">{group.maestro.email}</p>}
                      </div>

                      {isAdmin ? (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <Button type="button" variant="primary" className="bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={() => handleOpenEdit(group)}>
                            Editar
                          </Button>
                          <Button type="button" variant="danger" className="bg-red-50 text-red-700 hover:bg-red-100" disabled={deletingUuid === group.uuid} onClick={() => handleDelete(group)}>
                            {deletingUuid === group.uuid ? 'Eliminando...' : 'Eliminar'}
                          </Button>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-gray-400">Solo lectura</p>
                      )}
                    </article>
                  ))}
                </div>

                <div className="flex flex-col gap-4 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-600">
                    Mostrando{' '}
                    <span className="font-medium">
                      {firstVisibleGroup}
                    </span>{' '}
                    a{' '}
                    <span className="font-medium">
                      {lastVisibleGroup}
                    </span>{' '}
                    de{' '}
                    <span className="font-medium">
                      {filteredGroups.length}
                    </span>{' '}
                    grupos
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.max(page - 1, 1)
                        )
                      }
                      className="bg-red-900 px-3 py-2 text-sm text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-900 disabled:opacity-50"
                    >
                      Anterior
                    </Button>

                    {visiblePages.map((page) => (
                      <Button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={
                          currentPage === page
                            ? 'border border-red-900 bg-red-900 px-3 py-2 text-sm text-white ring-2 ring-red-300'
                            : 'border border-red-900 bg-red-900 px-3 py-2 text-sm text-white hover:bg-red-800'
                        }
                      >
                        {page}
                      </Button>
                    ))}

                    <Button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(page + 1, totalPages)
                        )
                      }
                      className="bg-red-900 px-3 py-2 text-sm text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-900 disabled:opacity-50"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <Modal
          open={isModalOpen}
          onClose={handleCloseModal}
          title={editingGroup ? 'Editar Grupo' : 'Nuevo Grupo'}
        >
          <form
            key={editingGroup?.uuid || 'new-group'}
            onSubmit={handleSubmit}
            className="space-y-4 p-4"
          >
            <Input
              label="Nombre del grupo"
              name="nombre"
              placeholder="Ejemplo: 1º B"
              defaultValue={editingGroup?.nombre || ''}
              required
            />

            <Select
              label="Maestro responsable"
              name="maestroId"
              required
              defaultValue={
                editingGroup?.maestroId
                  ? String(editingGroup.maestroId)
                  : ''
              }
              options={[
                {
                  label: 'Selecciona un maestro',
                  value: '',
                },
                ...teachers.map((teacher) => ({
                  label: teacher.name,
                  value: String(teacher.id),
                })),
              ]}
            />

            {teachers.length === 0 && (
              <p className="text-sm text-amber-700">
                No hay maestros disponibles. Primero registra un usuario
                con rol de maestro.
              </p>
            )}

            <Button
              type="submit"
              disabled={saving || teachers.length === 0}
              className="w-full bg-red-900 text-white hover:bg-red-800"
            >
              {saving
                ? 'Guardando...'
                : editingGroup
                  ? 'Actualizar Grupo'
                  : 'Crear Grupo'}
            </Button>
          </form>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}