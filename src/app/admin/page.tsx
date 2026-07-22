'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { userService } from '../services/schoolService';
import ProtectedRoute from '../components/ProtectedRoute';

import Swal from 'sweetalert2';

const USERS_PER_PAGE = 10;

const Alert = Swal.mixin({
  confirmButtonColor: '#7f1d1d', // Tailwind red-900
  cancelButtonColor: '#6b7280',
  buttonsStyling: true,
});

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Estados del buscador y paginación
  const [searchTerm, setSearchTerm] = useState('');
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
      text:
        error?.message ||
        'No fue posible cargar la lista de usuarios.',
      icon: 'error',
      confirmButtonText: 'Aceptar',
    });
  } finally {
    setLoadingUsers(false);
  }
};

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtrar usuarios por nombre, correo o rol
  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) => {
      const name = String(user.name || '').toLowerCase();
      const email = String(user.email || '').toLowerCase();
      const role = String(user.role || '').toLowerCase();

      return (
        name.includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        role.includes(normalizedSearch)
      );
    });
  }, [users, searchTerm]);

  // Calcular el número total de páginas
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / USERS_PER_PAGE)
  );

  // Obtener solamente los usuarios de la página actual
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;

    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage]);

  // Regresar a la primera página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Evitar permanecer en una página que ya no existe
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Abrir modal para crear
  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (loading) return;

    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleDelete = async (uuid: string) => {
  const result = await Alert.fire({
    title: '¿Eliminar usuario?',
    text: 'Esta acción eliminará permanentemente al usuario.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    focusCancel: true,
  });

  if (!result.isConfirmed) return;

  try {
    Alert.fire({
      title: 'Eliminando usuario...',
      text: 'Espera un momento.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    await userService.delete(uuid);
    await loadUsers();

    await Alert.fire({
      title: 'Usuario eliminado',
      text: 'El usuario se eliminó correctamente.',
      icon: 'success',
      confirmButtonText: 'Aceptar',
      timer: 2200,
      timerProgressBar: true,
    });
  } catch (error: any) {
    console.error('Error al eliminar el usuario:', error);

    await Alert.fire({
      title: 'No se pudo eliminar',
      text:
        error?.message ||
        'El usuario puede tener información relacionada.',
      icon: 'error',
      confirmButtonText: 'Aceptar',
    });
  }
};

const handleSubmit = async (
  event: React.FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);

  const password = String(formData.get('password') || '').trim();

  const payload: any = {
    name: String(formData.get('name') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    role: String(formData.get('role') || ''),
    password,
    confPassword: password,
  };

  if (!payload.name || !payload.email || !payload.role) {
    await Alert.fire({
      title: 'Datos incompletos',
      text: 'Completa todos los campos obligatorios.',
      icon: 'warning',
      confirmButtonText: 'Aceptar',
    });

    return;
  }

  if (!editingUser && !password) {
    await Alert.fire({
      title: 'Contraseña obligatoria',
      text: 'Escribe una contraseña para registrar al usuario.',
      icon: 'warning',
      confirmButtonText: 'Aceptar',
    });

    return;
  }

  setLoading(true);

  try {
    if (editingUser) {
      await userService.update(editingUser.uuid, payload);

      await Alert.fire({
        title: 'Usuario actualizado',
        text: 'Los cambios se guardaron correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        timer: 2200,
        timerProgressBar: true,
      });
    } else {
      await userService.create(payload);

      await Alert.fire({
        title: 'Usuario registrado',
        text: 'La nueva cuenta se creó correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        timer: 2200,
        timerProgressBar: true,
      });
    }

    setIsModalOpen(false);
    setEditingUser(null);

    await loadUsers();
  } catch (error: any) {
    console.error('Error al guardar el usuario:', error);

    await Alert.fire({
      title: editingUser
        ? 'No se pudo actualizar'
        : 'No se pudo registrar',
      text:
        error?.message ||
        'Ocurrió un error al guardar la información del usuario.',
      icon: 'error',
      confirmButtonText: 'Aceptar',
    });
  } finally {
    setLoading(false);
  }
};

  // Crear los números de página que se mostrarán
  const visiblePages = useMemo(() => {
    const pages: number[] = [];

    const firstPage = Math.max(1, currentPage - 2);
    const lastPage = Math.min(totalPages, currentPage + 2);

    for (let page = firstPage; page <= lastPage; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  const firstVisibleUser =
    filteredUsers.length === 0
      ? 0
      : (currentPage - 1) * USERS_PER_PAGE + 1;

  const lastVisibleUser = Math.min(
    currentPage * USERS_PER_PAGE,
    filteredUsers.length
  );

  return (
    <ProtectedRoute allowedRoles={['administrador']}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-red-900">
                Gestión de Usuarios
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Administra las cuentas y los roles del portal.
              </p>
            </div>

            <Button
              onClick={handleOpenCreate}
              className="bg-red-900 text-white hover:bg-red-800"
            >
              + Nuevo Usuario
            </Button>
          </div>

          {/* Buscador */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  label="Buscar usuario"
                  name="search"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Buscar por nombre, correo o rol..."
                />
              </div>

              {searchTerm && (
                <Button
                  type="button"
                  onClick={handleClearSearch}
                  className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                >
                  Limpiar
                </Button>
              )}
            </div>

            <p className="mt-3 text-sm text-gray-500">
              {filteredUsers.length === 1
                ? '1 usuario encontrado'
                : `${filteredUsers.length} usuarios encontrados`}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {loadingUsers ? (
              <div className="p-10 text-center text-gray-500">
                Cargando usuarios...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-medium text-gray-700">
                  No se encontraron usuarios
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Intenta realizar la búsqueda con otro nombre,
                  correo o rol.
                </p>
              </div>
            ) : (
              <>
                <Table
                  columns={[
                    {
                      key: 'name',
                      header: 'Nombre',
                    },
                    {
                      key: 'email',
                      header: 'Email',
                    },
                    {
                      key: 'role',
                      header: 'Rol',
                      render: (user: any) => (
                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
                          {user.role}
                        </span>
                      ),
                    },
                    {
                      key: 'actions',
                      header: 'Acciones',
                      render: (user: any) => (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="primary"
                            className="bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
                            onClick={() => handleOpenEdit(user)}
                          >
                            Editar
                          </Button>

                          <Button
                            variant="danger"
                            className="bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                            onClick={() =>
                              handleDelete(user.uuid)
                            }
                          >
                            Eliminar
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                  data={paginatedUsers}
                />

                {/* Paginador */}
<div className="flex flex-col gap-4 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
  <p className="text-sm text-gray-600">
    Mostrando <span className="font-medium">{firstVisibleUser}</span> a{' '}
    <span className="font-medium">{lastVisibleUser}</span> de{' '}
    <span className="font-medium">{filteredUsers.length}</span> usuarios
  </p>

  <div className="flex flex-wrap items-center gap-2">
    <Button
      type="button"
      disabled={currentPage === 1}
      onClick={() =>
        setCurrentPage((page) => Math.max(page - 1, 1))
      }
      className="bg-red-900 px-3 py-2 text-sm text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-900 disabled:text-white disabled:opacity-50"
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
            ? 'border border-red-900 bg-red-900 px-3 py-2 text-sm text-white hover:bg-red-800'
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
        setCurrentPage((page) => Math.min(page + 1, totalPages))
      }
      className="bg-red-900 px-3 py-2 text-sm text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-900 disabled:text-white disabled:opacity-50"
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
          title={
            editingUser
              ? 'Editar Usuario'
              : 'Registrar Nuevo Usuario'
          }
        >
          <form
            key={editingUser?.uuid || 'new-user'}
            onSubmit={handleSubmit}
            className="space-y-4 p-4"
          >
            <Input
              label="Nombre Completo"
              name="name"
              defaultValue={editingUser?.name || ''}
              required
            />

            <Input
              label="Email"
              name="email"
              type="email"
              defaultValue={editingUser?.email || ''}
              required
            />

            <Input
              label={
                editingUser
                  ? 'Nueva Contraseña (Opcional)'
                  : 'Contraseña'
              }
              name="password"
              type="password"
              placeholder={
                editingUser
                  ? 'Dejar en blanco para mantener la actual'
                  : '******'
              }
              required={!editingUser}
            />

            <Select
              label="Rol de Usuario"
              name="role"
              required
              defaultValue={editingUser?.role || 'maestro'}
              options={[
                {
                  label: 'Maestro',
                  value: 'maestro',
                },
                {
                  label: 'Administrador',
                  value: 'administrador',
                },
                {
                  label: 'Alumno',
                  value: 'alumno',
                },
              ]}
            />

            <Button
              type="submit"
              className="w-full bg-red-900 text-white"
              disabled={loading}
            >
              {loading
                ? 'Guardando...'
                : editingUser
                  ? 'Actualizar Usuario'
                  : 'Guardar Usuario'}
            </Button>
          </form>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}