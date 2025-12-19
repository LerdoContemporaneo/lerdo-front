'use client';
import React, { useState, useEffect } from 'react';
import { Table } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ProtectedRoute from '../components/ProtectedRoute';
import AppLayout from '../components/AppLayout';
import { userService, attendanceService } from '../services/schoolService';

function AdminContent() {
  const [open, setOpen] = useState(false);
  const [maestros, setMaestros] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const users = await userService.getAll();
      // Solo mostramos administradores y maestros
      setMaestros(users.filter((u: any) => u.role !== 'alumno'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const columns = [
    { key: 'name', header: 'Nombre' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Rol', render: (r: any) => (
      <span className="capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{r.role}</span>
    )},
  ];

  const handleAttendance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await attendanceService.createTeacher(
      Number(formData.get('maestroId')),
      formData.get('estado') as string
    );
    alert("Puntualidad registrada");
    setOpen(false);
  };

  if (loading) return <div className="p-10 text-center">Conectando con la base de datos...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Módulo Administrativo</h2>
        <Button onClick={() => setOpen(true)}>Registrar puntualidad</Button>
      </div>

      <Table columns={columns} data={maestros} />

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar puntualidad de docente">
        <form onSubmit={handleAttendance} className="space-y-4 p-2">
          <div>
            <label className="text-sm block mb-1">Docente</label>
            <select name="maestroId" className="w-full p-2 border rounded">
              {maestros.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm block mb-1">Estado</label>
            <select name="estado" className="w-full p-2 border rounded">
              <option value="Presente">Presente</option>
              <option value="Tarde">Tarde</option>
              <option value="Ausente">Ausente</option>
            </select>
          </div>
          <Button type="submit" className="w-full">Guardar Registro</Button>
        </form>
      </Modal>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['administrador']}>
      <AppLayout><AdminContent /></AppLayout>
    </ProtectedRoute>
  );
}