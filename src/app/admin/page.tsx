'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { userService } from '../services/schoolService';
import ProtectedRoute from '../components/ProtectedRoute';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadUsers = async () => {
    const data = await userService.getAll();
    setUsers(data);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    
    await userService.create(payload);
    alert("Usuario creado con éxito");
    setIsModalOpen(false);
    loadUsers();
  };

  return (
    <ProtectedRoute allowedRoles={['administrador']}>
      <AppLayout>
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
            <Button onClick={() => setIsModalOpen(true)}>+ Nuevo Usuario</Button>
          </div>

          <Table 
            columns={[
              { key: 'name', header: 'Nombre' },
              { key: 'email', header: 'Email' },
              { key: 'role', header: 'Rol' },
              { 
                key: 'actions', 
                header: 'Acciones', 
                render: (r: any) => (
                  <Button variant="danger" className="text-xs" onClick={() => userService.delete(r.id).then(loadUsers)}>Eliminar</Button>
                )
              }
            ]} 
            data={users} 
          />
        </div>

        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Usuario del Sistema">
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <Input label="Nombre Completo" name="name" required />
            <Input label="Email" name="email" type="email" required />
            <Input label="Contraseña" name="password" type="password" required />
            <Select 
              label="Rol de Usuario" 
              name="role" 
              required 
              options={[
                { label: 'Maestro', value: 'maestro' },
                { label: 'Administrador', value: 'administrador' }
              ]}
            />
            <Button type="submit" className="w-full">Guardar Usuario</Button>
          </form>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}