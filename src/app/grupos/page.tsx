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
import {
  gradeService,
  levelService,
  studentService,
  userService,
  type EducationalLevel,
} from '../services/schoolService';
import { useAuth } from '../hooks/useAuth';

const GROUPS_PER_PAGE = 10;

type Teacher = {
  id: number;
  uuid: string;
  name: string;
  email?: string;
  role: string;
  niveles?: EducationalLevel[];
};

type StudentGrade = {
  id: number;
  uuid: string;
  nombre: string;
  nivelId?: number | null;
};

type Student = {
  id: number;
  uuid: string;
  nombre: string;
  apellido: string;
  matricula: string;
  grados?: StudentGrade[];
};

type Group = {
  id: number;
  uuid: string;
  nombre: string;
  nivelId: number | null;
  nivel?: EducationalLevel | null;
  maestroId: number | null;
  maestro?: Teacher | null;
  alumnos?: Student[];
};

const Alert = Swal.mixin({
  confirmButtonColor: '#7f1d1d',
  cancelButtonColor: '#6b7280',
  buttonsStyling: true,
});

export default function GroupsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';
  const isCoordinator = user?.role === 'coordinador';
  const canManage = isAdmin || isCoordinator;

  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [levels, setLevels] = useState<EducationalLevel[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [rosterGroup, setRosterGroup] = useState<Group | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [rosterSearch, setRosterSearch] = useState('');

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingRoster, setSavingRoster] = useState(false);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    try {
      setLoadingData(true);

      const [groupsData, usersData, studentsData, levelsData] = await Promise.all([
        gradeService.getAll(),
        canManage ? userService.getAll() : Promise.resolve([]),
        canManage ? studentService.getAll() : Promise.resolve([]),
        canManage ? levelService.getAll() : Promise.resolve([]),
      ]);

      const loadedGroups: Group[] = Array.isArray(groupsData)
        ? groupsData
        : [];

      setGroups(loadedGroups);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setLevels(Array.isArray(levelsData) ? levelsData : []);

      const users = Array.isArray(usersData) ? usersData : [];

      if (canManage) {
        setTeachers(
          users.filter((currentUser: Teacher) => {
            return currentUser.role === 'maestro';
          }),
        );
      } else {
        setTeachers(
          Array.from(
            new Map(
              loadedGroups
                .filter((group) => group.maestro)
                .map((group) => [
                  Number(group.maestro!.id),
                  group.maestro!,
                ]),
            ).values(),
          ),
        );
      }
    } catch (error: any) {
      console.error('Error al cargar los grupos:', error);

      setGroups([]);
      setTeachers([]);
      setStudents([]);

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
    if (['administrador', 'coordinador', 'maestro'].includes(user?.role ?? '')) {
      void loadData();
    }
  }, [user?.role]);

  const levelTeachers = useMemo(() => {
    const nivelId = Number(selectedLevelId);
    if (!nivelId) return [];

    return teachers.filter((teacher) =>
      teacher.niveles?.some((nivel) => Number(nivel.id) === nivelId),
    );
  }, [teachers, selectedLevelId]);

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

  const filteredRosterStudents = useMemo(() => {
    const search = rosterSearch.trim().toLowerCase();

    return students
      .filter((student) => {
        if (!search) return true;

        const fullName = `${student.nombre} ${student.apellido}`.toLowerCase();

        return (
          fullName.includes(search) ||
          student.matricula.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => {
        const aName = `${a.apellido} ${a.nombre}`;
        const bName = `${b.apellido} ${b.nombre}`;
        return aName.localeCompare(bName, 'es');
      });
  }, [students, rosterSearch]);

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
    setSelectedLevelId(String(levels.find((level) => level.activo)?.id ?? ''));
    setSelectedTeacherId('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: Group) => {
    setEditingGroup(group);
    setSelectedLevelId(group.nivelId ? String(group.nivelId) : '');
    setSelectedTeacherId(group.maestroId ? String(group.maestroId) : '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;

    setEditingGroup(null);
    setSelectedLevelId('');
    setSelectedTeacherId('');
    setIsModalOpen(false);
  };

  const handleOpenRoster = async (group: Group) => {
    if (!group.maestroId) {
      await Alert.fire({
        title: 'Falta asignar maestro',
        text: 'Asigna un maestro responsable antes de inscribir alumnos.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    setRosterGroup(group);
    setSelectedStudentIds(
      (group.alumnos ?? []).map((student) => Number(student.id)),
    );
    setRosterSearch('');
    setIsRosterModalOpen(true);
  };

  const handleCloseRoster = () => {
    if (savingRoster) return;

    setIsRosterModalOpen(false);
    setRosterGroup(null);
    setSelectedStudentIds([]);
    setRosterSearch('');
  };

  const toggleRosterStudent = (studentId: number) => {
    setSelectedStudentIds((currentIds) =>
      currentIds.includes(studentId)
        ? currentIds.filter((id) => id !== studentId)
        : [...currentIds, studentId],
    );
  };

  const selectVisibleRosterStudents = () => {
    const visibleIds = filteredRosterStudents.map((student) => student.id);

    setSelectedStudentIds((currentIds) => [
      ...new Set([...currentIds, ...visibleIds]),
    ]);
  };

  const handleSaveRoster = async () => {
    if (!rosterGroup) return;

    if (selectedStudentIds.length === 0) {
      const result = await Alert.fire({
        title: '¿Dejar el grupo sin alumnos?',
        text: `Se quitarán todos los alumnos inscritos en ${rosterGroup.nombre}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, dejar vacío',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
      });

      if (!result.isConfirmed) return;
    }

    try {
      setSavingRoster(true);
      await gradeService.replaceStudents(
        rosterGroup.uuid,
        selectedStudentIds,
      );
      await loadData();

      setIsRosterModalOpen(false);
      setRosterGroup(null);
      setSelectedStudentIds([]);
      setRosterSearch('');

      await Alert.fire({
        title: 'Alumnos asignados',
        text: `${selectedStudentIds.length} alumno${
          selectedStudentIds.length === 1 ? '' : 's'
        } quedaron inscritos en el grupo.`,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        timer: 2200,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error('Error al actualizar los alumnos del grupo:', error);

      await Alert.fire({
        title: 'No se pudo actualizar el grupo',
        text:
          error instanceof Error
            ? error.message
            : 'No fue posible guardar la lista de alumnos.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      setSavingRoster(false);
    }
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
      group.nivel?.nombre || 'Sin nivel',
      group.maestro?.name || 'Sin asignar',
      group.maestro?.email || '',
      group.maestroId ? 'Asignado' : 'Sin asignar',
    ]);

    const csv = [
      ['Grupo', 'Nivel', 'Maestro', 'Correo', 'Estado'],
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
    const maestroIdValue = selectedTeacherId;
    const nivelId = Number(selectedLevelId);

    if (!nombre) {
      await Alert.fire({
        title: 'Nombre obligatorio',
        text: 'Escribe el nombre del grupo.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });

      return;
    }

    if (!Number.isInteger(nivelId) || nivelId <= 0) {
      await Alert.fire({
        title: 'Nivel obligatorio',
        text: 'Selecciona el nivel educativo del grupo.',
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

    const selectedTeacher = levelTeachers.find(
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
      nivelId,
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
    <ProtectedRoute allowedRoles={['administrador', 'coordinador', 'maestro']}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-red-900">
                Gestión de Grupos
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Administra los grupos, sus maestros responsables y la lista de
                alumnos que podrá consultar cada maestro.
              </p>
            </div>

            {canManage && (
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
                      key: 'nivel',
                      header: 'Nivel',
                      render: (group: Group) => group.nivel?.nombre || 'Sin nivel',
                    },
                    {
                      key: 'alumnos',
                      header: 'Alumnos',
                      render: (group: Group) => (
                        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
                          {group.alumnos?.length ?? 0} inscritos
                        </span>
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
                        canManage ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              className="px-2 py-1 text-xs text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={!group.maestroId}
                              onClick={() => void handleOpenRoster(group)}
                            >
                              Administrar alumnos
                            </Button>

                            <Button
                              type="button"
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
                        <p className="mt-3 text-xs text-gray-400">Alumnos inscritos</p>
                        <p className="mt-1 font-semibold text-blue-700">
                          {group.alumnos?.length ?? 0}
                        </p>
                        <p className="mt-3 text-xs text-gray-400">Nivel educativo</p>
                        <p className="mt-1 font-medium text-gray-800">{group.nivel?.nombre || 'Sin nivel'}</p>
                      </div>

                      {canManage ? (
                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                          <Button
                            type="button"
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!group.maestroId}
                            onClick={() => void handleOpenRoster(group)}
                          >
                            Alumnos
                          </Button>
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
              label="Nivel educativo"
              name="nivelId"
              required
              value={selectedLevelId}
              onChange={(event) => {
                const nextLevelId = event.target.value;
                setSelectedLevelId(nextLevelId);
                const currentTeacher = teachers.find(
                  (teacher) => String(teacher.id) === selectedTeacherId,
                );
                if (!currentTeacher?.niveles?.some(
                  (nivel) => String(nivel.id) === nextLevelId,
                )) {
                  setSelectedTeacherId('');
                }
              }}
              options={[
                { label: 'Selecciona un nivel', value: '' },
                ...levels.filter((level) => level.activo).map((level) => ({
                  label: level.nombre,
                  value: String(level.id),
                })),
              ]}
            />

            <Select
              label="Maestro responsable"
              name="maestroId"
              required
              value={selectedTeacherId}
              onChange={(event) => setSelectedTeacherId(event.target.value)}
              options={[
                {
                  label: 'Selecciona un maestro',
                  value: '',
                },
                ...levelTeachers.map((teacher) => ({
                  label: teacher.name,
                  value: String(teacher.id),
                })),
              ]}
            />

            {selectedLevelId && levelTeachers.length === 0 && (
              <p className="text-sm text-amber-700">
                No hay maestros disponibles. Primero registra un usuario
                con rol de maestro.
              </p>
            )}

            <Button
              type="submit"
              disabled={saving || !selectedLevelId || levelTeachers.length === 0}
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

        <Modal
          open={isRosterModalOpen}
          onClose={handleCloseRoster}
          title={
            rosterGroup
              ? `Administrar alumnos — ${rosterGroup.nombre}`
              : 'Administrar alumnos'
          }
          size="xl"
        >
          {rosterGroup && (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-xl border border-red-100 bg-red-50 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                    Grupo
                  </p>
                  <p className="mt-1 font-bold text-red-950">
                    {rosterGroup.nombre}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                    Maestro responsable
                  </p>
                  <p className="mt-1 font-bold text-red-950">
                    {rosterGroup.maestro?.name ?? 'Sin maestro'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                    Seleccionados
                  </p>
                  <p className="mt-1 font-bold text-red-950">
                    {selectedStudentIds.length} de {students.length}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                <Input
                  label="Buscar alumno"
                  type="search"
                  value={rosterSearch}
                  onChange={(event) => setRosterSearch(event.target.value)}
                  placeholder="Nombre, apellido o matrícula..."
                />

                <Button
                  type="button"
                  onClick={selectVisibleRosterStudents}
                  disabled={filteredRosterStudents.length === 0}
                  className="border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  Seleccionar visibles
                </Button>

                <Button
                  type="button"
                  onClick={() => setSelectedStudentIds([])}
                  disabled={selectedStudentIds.length === 0}
                  className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Quitar selección
                </Button>
              </div>

              <div className="max-h-[430px] overflow-y-auto rounded-xl border border-gray-200">
                {filteredRosterStudents.length === 0 ? (
                  <div className="p-10 text-center text-sm text-gray-500">
                    {students.length === 0
                      ? 'Primero registra y vincula perfiles de alumnos.'
                      : 'No hay alumnos que coincidan con la búsqueda.'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredRosterStudents.map((student) => {
                      const checked = selectedStudentIds.includes(student.id);
                      const otherGroups = (student.grados ?? []).filter(
                        (grade) => Number(grade.id) !== Number(rosterGroup.id),
                      );

                      return (
                        <label
                          key={student.id}
                          className={`flex cursor-pointer items-start gap-3 p-4 transition hover:bg-gray-50 ${
                            checked ? 'bg-emerald-50/70' : 'bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRosterStudent(student.id)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 accent-red-900"
                          />

                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-gray-900">
                              {student.apellido} {student.nombre}
                            </span>
                            <span className="mt-0.5 block text-xs text-gray-500">
                              Matrícula: {student.matricula}
                            </span>
                            {otherGroups.length > 0 && (
                              <span className="mt-1 block text-xs text-blue-700">
                                También pertenece a:{' '}
                                {otherGroups.map((grade) => grade.nombre).join(', ')}
                              </span>
                            )}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              checked
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {checked ? 'Inscrito' : 'No inscrito'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  onClick={handleCloseRoster}
                  disabled={savingRoster}
                  className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  onClick={() => void handleSaveRoster()}
                  disabled={savingRoster}
                  className="bg-red-900 text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingRoster
                    ? 'Guardando alumnos...'
                    : `Guardar ${selectedStudentIds.length} alumno${
                        selectedStudentIds.length === 1 ? '' : 's'
                      }`}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}
