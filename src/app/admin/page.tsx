'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table'; // Asegúrate que tu componente Table soporte render personalizado
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { userService } from '../services/schoolService';
import ProtectedRoute from '../components/ProtectedRoute';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null); // Estado para saber si editamos
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    const data = await userService.getAll();
    setUsers(data);
  };

  useEffect(() => { loadUsers(); }, []);

  // Abrir modal para crear
  const handleOpenCreate = () => {
    setEditingUser(null); // Limpiamos selección
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if(!confirm("¿Estás seguro de eliminar este usuario?")) return;
    await userService.delete(id);
    loadUsers();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    // Convertimos FormData a objeto JSON limpio
    const payload: any = {
        name: formData.get('name'),
        email: formData.get('email'),
        role: formData.get('role'),
    };

    // Solo enviamos password si se escribió algo (en edición es opcional)
    const password = formData.get('password');
    if (password) {
        payload.password = password;
    }

    try {
        if (editingUser) {
            // MODO EDICIÓN
            await userService.update(editingUser.id, payload);
            alert("Usuario actualizado correctamente 🐧");
        } else {
            // MODO CREACIÓN
            // Validación extra: password obligatorio al crear
            if (!password) {
                alert("La contraseña es obligatoria para nuevos usuarios");
                setLoading(false);
                return;
            }
            await userService.create(payload);
            alert("Usuario creado correctamente 🐣");
        }
        setIsModalOpen(false);
        loadUsers();
    } catch (error) {
        console.error(error);
        alert("Hubo un error al guardar.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['administrador']}>
      <AppLayout>
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-red-900">Gestión de Usuarios</h1>
                <Button onClick={handleOpenCreate} className="bg-red-900 hover:bg-red-800 text-white">
                    + Nuevo Usuario
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <Table 
                    columns={[
                    { key: 'name', header: 'Nombre' },
                    { key: 'email', header: 'Email' },
                    { key: 'role', header: 'Rol' },
                    { 
                        key: 'actions', 
                        header: 'Acciones', 
                        render: (r: any) => (
                        <div className="flex gap-2">
                            <Button 
                                variant="primary" 
                                className="text-xs py-1 px-2 bg-blue-50 text-blue-700 hover:bg-blue-100" 
                                onClick={() => handleOpenEdit(r)}
                            >
                                Editar
                            </Button>
                            <Button 
                                variant="danger" 
                                className="text-xs py-1 px-2 bg-red-50 text-red-700 hover:bg-red-100" 
                                onClick={() => handleDelete(r.id)}
                            >
                                Eliminar
                            </Button>
                        </div>
                        )
                    }
                    ]} 
                    data={users} 
                />
            </div>
        </div>

        <Modal 
            open={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title={editingUser ? "Editar Usuario" : "Registrar Nuevo Usuario"}
        >
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <Input 
                label="Nombre Completo" 
                name="name" 
                defaultValue={editingUser?.name} 
                required 
            />
            <Input 
                label="Email" 
                name="email" 
                type="email" 
                defaultValue={editingUser?.email} 
                required 
            />
            
            <div className="space-y-1">
                <Input 
                    label={editingUser ? "Nueva Contraseña (Opcional)" : "Contraseña"} 
                    name="password" 
                    type="password" 
                    placeholder={editingUser ? "Dejar en blanco para mantener la actual" : "******"}
                />
            </div>

            <Select 
              label="Rol de Usuario" 
              name="role" 
              required 
              defaultValue={editingUser?.role || 'maestro'}
              options={[
                { label: 'Maestro', value: 'maestro' },
                { label: 'Administrador', value: 'administrador' },
                { label: 'Alumno', value: 'alumno' }
              ]}
            />
            <Button type="submit" className="w-full bg-red-900 hover:bg-red-800 text-white" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Usuario"}
            </Button>
          </form>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}