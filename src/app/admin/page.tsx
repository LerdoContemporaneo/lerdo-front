'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import UserLevelSelector from '../components/users/UserLevelSelector';
import {
  levelService,
  userService,
  type EducationalLevel,
  type UserPayload,
} from '../services/schoolService';
import ProtectedRoute from '../components/ProtectedRoute';
import Swal from 'sweetalert2';
import type { UserRole } from '../types/auth';

const USERS_PER_PAGE = 10;

interface User {
  id?: number;
  uuid: string;
  name: string;
  email: string;
  role: UserRole;
  niveles?: EducationalLevel[];
}

const ROLE_STYLES: Record<UserRole, string> = {
  administrador: 'bg-red-50 text-red-700 ring-red-600/20',
  coordinador: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  maestro: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  alumno: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

const ROLE_LABELS: Record<UserRole, string> = {
  administrador: 'Administrador',
  coordinador: 'Coordinador',
  maestro: 'Maestro',
  alumno: 'Alumno',
};

const Alert = Swal.mixin({
  confirmButtonColor: '#7f1d1d',
  cancelButtonColor: '#6b7280',
  buttonsStyling: true,
});

function Icon({ name }: { name: 'users' | 'search' | 'plus' | 'edit' | 'trash' | 'chevron' | 'refresh' }) {
  const paths = {
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    refresh: <><path d="M20 11a8.1 8.1 0 1 0 2 5M20 4v7h-7"/></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">{paths[name]}</svg>;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [levels, setLevels] = useState<EducationalLevel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('maestro');
  const [selectedLevelIds, setSelectedLevelIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await userService.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error al cargar los usuarios:', error);
      setUsers([]);
      await Alert.fire({
        title: 'Error al cargar',
        text: error?.message || 'No fue posible cargar la lista de usuarios.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadLevels = async () => {
    try {
      setLoadingLevels(true);
      setLevels(await levelService.getAll());
    } catch (error: any) {
      console.error('Error al cargar los niveles:', error);
      setLevels([]);
      await Alert.fire({
        title: 'No se cargaron los niveles',
        text: error?.message || 'No fue posible cargar los niveles educativos.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      setLoadingLevels(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    void loadLevels();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !query || [user.name, user.email, user.role]
        .some((value) => String(value || '').toLowerCase().includes(query));
      const matchesRole = roleFilter === 'todos' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const roleCounts = useMemo(() => ({
    administradores: users.filter((user) => user.role === 'administrador').length,
    coordinadores: users.filter((user) => user.role === 'coordinador').length,
    maestros: users.filter((user) => user.role === 'maestro').length,
    alumnos: users.filter((user) => user.role === 'alumno').length,
  }), [users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const visiblePages = useMemo(() => {
    const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
    const end = Math.min(totalPages, start + 2);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const hasFilters = Boolean(searchTerm || roleFilter !== 'todos');
  const firstVisibleUser = filteredUsers.length ? (currentPage - 1) * USERS_PER_PAGE + 1 : 0;
  const lastVisibleUser = Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length);

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('todos');
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setSelectedRole('maestro');
    setSelectedLevelIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setSelectedLevelIds(
      (user.niveles ?? [])
        .filter((level) => level.activo)
        .map((level) => Number(level.id)),
    );
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!loading) {
      setEditingUser(null);
      setSelectedRole('maestro');
      setSelectedLevelIds([]);
      setIsModalOpen(false);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setSelectedLevelIds((currentIds) => {
      if (role === 'administrador') return [];
      if (role === 'alumno') return currentIds.slice(0, 1);
      return currentIds;
    });
  };

  const handleDelete = async (user: User) => {
    const result = await Alert.fire({
      title: '¿Eliminar a este usuario?',
      html: `<strong>${user.name}</strong><br><span style="color:#6b7280">${user.email}</span>`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Conservar usuario',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      Alert.fire({ title: 'Eliminando usuario…', allowOutsideClick: false, allowEscapeKey: false, didOpen: () => Swal.showLoading() });
      await userService.delete(user.uuid);
      await loadUsers();
      await Alert.fire({ title: 'Usuario eliminado', text: 'La cuenta se eliminó correctamente.', icon: 'success', timer: 2200, timerProgressBar: true });
    } catch (error: any) {
      console.error('Error al eliminar el usuario:', error);
      await Alert.fire({ title: 'No se pudo eliminar', text: error?.message || 'El usuario puede tener información relacionada.', icon: 'error', confirmButtonText: 'Aceptar' });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') || '').trim();
    const payload: UserPayload = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      role: selectedRole,
      nivelIds: selectedRole === 'administrador' ? [] : selectedLevelIds,
    };

    if (password) {
      payload.password = password;
      payload.confPassword = password;
    }

    if (!payload.name || !payload.email || !payload.role) {
      await Alert.fire({ title: 'Faltan datos', text: 'Completa los campos marcados como obligatorios.', icon: 'warning', confirmButtonText: 'Revisar formulario' });
      return;
    }

    if (!editingUser && !password) {
      await Alert.fire({ title: 'Falta la contraseña', text: 'Escribe una contraseña para crear la cuenta.', icon: 'warning', confirmButtonText: 'Revisar formulario' });
      return;
    }

    if (selectedRole !== 'administrador' && selectedLevelIds.length === 0) {
      await Alert.fire({
        title: 'Falta el nivel educativo',
        text: 'Selecciona al menos un nivel para esta cuenta.',
        icon: 'warning',
        confirmButtonText: 'Revisar formulario',
      });
      return;
    }

    if (selectedRole === 'alumno' && selectedLevelIds.length !== 1) {
      await Alert.fire({
        title: 'Selecciona un solo nivel',
        text: 'La cuenta de alumno debe pertenecer exactamente a un nivel educativo.',
        icon: 'warning',
        confirmButtonText: 'Revisar formulario',
      });
      return;
    }

    setLoading(true);
    try {
      if (editingUser) await userService.update(editingUser.uuid, payload);
      else await userService.create(payload);

      await Alert.fire({
        title: editingUser ? 'Cambios guardados' : 'Usuario registrado',
        text: editingUser ? 'La información se actualizó correctamente.' : 'La nueva cuenta está lista para usarse.',
        icon: 'success',
        timer: 2200,
        timerProgressBar: true,
      });
      setIsModalOpen(false);
      setEditingUser(null);
      setSelectedRole('maestro');
      setSelectedLevelIds([]);
      await loadUsers();
    } catch (error: any) {
      console.error('Error al guardar el usuario:', error);
      await Alert.fire({ title: editingUser ? 'No se pudo actualizar' : 'No se pudo registrar', text: error?.message || 'Ocurrió un error al guardar la información.', icon: 'error', confirmButtonText: 'Aceptar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['administrador']}>
      <AppLayout>
        <main className="mx-auto w-full max-w-7xl space-y-6 pb-10">
          <header className="flex flex-col gap-5 rounded-2xl bg-gradient-to-br from-red-950 via-red-900 to-red-800 p-6 text-white shadow-lg shadow-red-950/10 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <div className="hidden rounded-xl bg-white/10 p-3 ring-1 ring-white/20 sm:block"><Icon name="users" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-200">Administración</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Gestión de usuarios</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-red-100">Crea cuentas, actualiza su información y asigna los permisos correctos.</p>
              </div>
            </div>
            <Button onClick={handleOpenCreate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl  px-5 font-semibold text-red-900 shadow-sm transition  focus-visible:ring-2 focus-visible:ring-white">
              <Icon name="plus" /> Nuevo usuario
            </Button>
          </header>

          <section aria-label="Resumen de usuarios" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              ['Total', users.length, 'text-gray-900'],
              ['Administradores', roleCounts.administradores, 'text-red-700'],
              ['Coordinadores', roleCounts.coordinadores, 'text-amber-700'],
              ['Maestros', roleCounts.maestros, 'text-blue-700'],
              ['Alumnos', roleCounts.alumnos, 'text-emerald-700'],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="rounded-2xl border border-gray-200 p-4 shadow-sm sm:p-5">
                <p className="text-xs font-medium text-gray-500 sm:text-sm">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${color}`}>{loadingUsers ? '—' : value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-gray-200  shadow-sm" aria-labelledby="users-list-title">
            <div className="border-b border-gray-100 p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 id="users-list-title" className="font-semibold text-gray-900">Directorio de usuarios</h2>
                  <p aria-live="polite" className="mt-0.5 text-sm text-gray-500">{filteredUsers.length} {filteredUsers.length === 1 ? 'resultado' : 'resultados'}</p>
                </div>
                <Button type="button" onClick={loadUsers} disabled={loadingUsers} aria-label="Actualizar lista" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200  p-0 text-gray-600 disabled:opacity-50"><Icon name="refresh" /></Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end">
                <div className="relative">
                  <div className="pointer-events-none absolute bottom-3 left-3 z-10 text-gray-400"><Icon name="search" /></div>
                  <Input label="Buscar" name="search" type="search" value={searchTerm} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)} placeholder="Nombre, correo o rol" className="pl-10" />
                </div>
                <Select label="Filtrar por rol" name="roleFilter" value={roleFilter} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(event.target.value)} options={[
                  { label: 'Todos los roles', value: 'todos' },
                  { label: 'Administradores', value: 'administrador' },
                  { label: 'Coordinadores', value: 'coordinador' },
                  { label: 'Maestros', value: 'maestro' },
                  { label: 'Alumnos', value: 'alumno' },
                ]} />
                {hasFilters && <Button type="button" onClick={clearFilters} className="min-h-10 rounded-lg border border-gray-300  px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">Limpiar filtros</Button>}
              </div>
            </div>

            {loadingUsers ? (
              <div className="space-y-3 p-6" aria-label="Cargando usuarios" role="status">
                {[1, 2, 3, 4, 5].map((row) => <div key={row} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <div className="rounded-full bg-gray-100 p-4 text-gray-500"><Icon name="search" /></div>
                <h3 className="mt-4 font-semibold text-gray-900">No encontramos usuarios</h3>
                <p className="mt-1 max-w-sm text-sm text-gray-500">Prueba con otro término o elimina los filtros para ver todo el directorio.</p>
                {hasFilters && <Button type="button" onClick={clearFilters} className="mt-5 rounded-lg bg-red-900 px-4 py-2 text-white hover:bg-red-800">Ver todos los usuarios</Button>}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table columns={[
                    { key: 'name', header: 'Usuario', render: (user: User) => <div className="min-w-[180px]"><p className="font-medium text-gray-900">{user.name}</p><p className="mt-0.5 text-xs text-gray-500 sm:hidden">{user.email}</p></div> },
                    { key: 'email', header: 'Correo electrónico' },
                    { key: 'role', header: 'Rol', render: (user: User) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${ROLE_STYLES[user.role] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{ROLE_LABELS[user.role] || user.role}</span> },
                    { key: 'niveles', header: 'Nivel educativo', render: (user: User) => user.role === 'administrador' ? <span className="text-sm text-gray-500">Acceso global</span> : (user.niveles?.length ?? 0) > 0 ? <div className="flex max-w-xs flex-wrap gap-1">{user.niveles?.map((level) => <span key={level.uuid} className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">{level.nombre}</span>)}</div> : <span className="text-sm font-medium text-amber-700">Sin asignar</span> },
                    { key: 'actions', header: 'Acciones', render: (user: User) => <div className="flex items-center justify-end gap-2">
                      <Button type="button" onClick={() => handleOpenEdit(user)} aria-label={`Editar a ${user.name}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-gray-200  px-3 text-xs font-semibold text-gray-700 hover:border-blue-200 hover:bg-blue-50"><Icon name="edit" /> Editar</Button>
                      <Button type="button" onClick={() => handleDelete(user)} aria-label={`Eliminar a ${user.name}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-100  px-3 text-xs font-semibold text-red-700 "><Icon name="trash" /> Eliminar</Button>
                    </div> },
                  ]} data={paginatedUsers} />
                </div>

                <nav aria-label="Paginación de usuarios" className="flex flex-col gap-4 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-center text-sm text-gray-600 sm:text-left">Mostrando <strong>{firstVisibleUser}–{lastVisibleUser}</strong> de <strong>{filteredUsers.length}</strong></p>
                  <div className="flex items-center justify-center gap-1">
                    <Button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)} aria-label="Página anterior" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200  p-0 text-gray-700  disabled:cursor-not-allowed disabled:opacity-40"><span className="rotate-180"><Icon name="chevron" /></span></Button>
                    {visiblePages.map((page) => <Button key={page} type="button" onClick={() => setCurrentPage(page)} aria-current={currentPage === page ? 'page' : undefined} aria-label={`Ir a la página ${page}`} className={`h-10 min-w-10 rounded-lg px-3 text-sm font-semibold ${currentPage === page ? 'bg-red-900 text-white shadow-sm' : 'border border-transparent  text-gray-700 '}`}>{page}</Button>)}
                    <Button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)} aria-label="Página siguiente" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200  p-0 text-gray-700  disabled:cursor-not-allowed disabled:opacity-40"><Icon name="chevron" /></Button>
                  </div>
                </nav>
              </>
            )}
          </section>
        </main>

        <Modal open={isModalOpen} onClose={handleCloseModal} title={editingUser ? 'Editar usuario' : 'Crear usuario'}>
          <form key={editingUser?.uuid || 'new-user'} onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
            <p className="-mt-2 text-sm leading-6 text-gray-500">{editingUser ? 'Actualiza los datos de la cuenta. Los campos con * son obligatorios.' : 'Completa los datos para agregar una cuenta al portal.'}</p>
            <Input label="Nombre completo *" name="name" autoComplete="name" defaultValue={editingUser?.name || ''} placeholder="Ej. Ana García" required />
            <Input label="Correo electrónico *" name="email" type="email" autoComplete="email" defaultValue={editingUser?.email || ''} placeholder="nombre@escuela.edu" required />
            <Select label="Rol de usuario *" name="role" required value={selectedRole} onChange={(event) => handleRoleChange(event.target.value as UserRole)} options={[
              { label: 'Coordinador', value: 'coordinador' },
              { label: 'Maestro', value: 'maestro' },
              { label: 'Administrador', value: 'administrador' },
              { label: 'Alumno', value: 'alumno' },
            ]} />
            <UserLevelSelector
              role={selectedRole}
              levels={levels}
              selectedIds={selectedLevelIds}
              onChange={setSelectedLevelIds}
              loading={loadingLevels}
              disabled={loading}
            />
            <div>
              <Input label={editingUser ? 'Nueva contraseña' : 'Contraseña *'} name="password" type="password" autoComplete="new-password" placeholder={editingUser ? 'Déjala vacía para conservar la actual' : 'Escribe una contraseña segura'} required={!editingUser} />
              <p className="mt-1.5 text-xs text-gray-500">{editingUser ? 'Solo se cambiará si escribes una nueva.' : 'Usa una combinación fácil de recordar y difícil de adivinar.'}</p>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
              <Button type="button" onClick={handleCloseModal} disabled={loading} className="min-h-11 rounded-xl border border-gray-300  px-5 font-semibold text-gray-700">Cancelar</Button>
              <Button type="submit" disabled={loading} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-900 px-5 font-semibold text-white shadow-sm hover:bg-red-800 disabled:cursor-wait disabled:opacity-60">{loading ? 'Guardando…' : editingUser ? 'Guardar cambios' : 'Crear usuario'}</Button>
            </div>
          </form>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}
