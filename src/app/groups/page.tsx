'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { gradeService, userService } from '../services/schoolService';
import { useAuth } from '../hooks/useAuth';

export default function GroupsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';
  const [groups, setGroups] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    const gData = await gradeService.getAll();
    const uData = await userService.getAll();
    setGroups(gData);
    setTeachers(uData.filter((u: any) => u.role === 'maestro'));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await gradeService.create({
      nombre: formData.get('nombre'),
      maestroId: Number(formData.get('maestroId'))
    });
    setIsModalOpen(false);
    loadData();
  };

  return (
    <AppLayout>
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Grupos</h2>
          {isAdmin && <Button onClick={() => setIsModalOpen(true)}>+ Crear Grupo</Button>}
        </div>

        <Table 
          columns={[
            { key: 'nombre', header: 'Grupo' },
            { key: 'maestro', header: 'Maestro', render: (r: any) => r.maestro?.name || 'No asignado' },
            { 
                key: 'actions', 
                header: 'Acciones', 
                render: (r: any) => isAdmin && (
                  <Button variant="danger" className="text-xs" onClick={() => gradeService.delete(r.id).then(loadData)}>Borrar</Button>
                )
            }
          ]} 
          data={groups} 
        />
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Grupo">
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <Input label="Nombre (ej: 1º B)" name="nombre" required />
          <Select 
            label="Maestro" 
            name="maestroId" 
            required 
            options={teachers.map((t: any) => ({ label: t.name, value: t.id.toString() }))}
          />
          <Button type="submit" className="w-full">Crear</Button>
        </form>
      </Modal>
    </AppLayout>
  );
}