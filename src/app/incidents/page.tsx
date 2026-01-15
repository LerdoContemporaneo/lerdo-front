'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { incidentService, studentService } from '../services/schoolService';
import { useAuth } from '../hooks/useAuth';

export default function IncidentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';
  const [incidents, setIncidents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadData = async () => {
    const [iData, sData] = await Promise.all([incidentService.getAll(), studentService.getAll()]);
    setIncidents(iData);
    setStudents(sData);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
        await incidentService.create({
            tipo: formData.get('tipo'),
            descripcion: formData.get('descripcion'),
            alumnoId: Number(formData.get('alumnoId'))
        });
        setIsModalOpen(false);
        loadData();
    } catch(e) { alert("Error al crear incidencia"); }
  };

  const totalPages = Math.ceil(incidents.length / itemsPerPage) || 1;
  const currentData = incidents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AppLayout>
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-red-700">Bitácora de Incidencias</h2>
          <Button onClick={() => setIsModalOpen(true)} variant="danger">+ Nueva Incidencia</Button>
        </div>

        <Table 
          columns={[
            { key: 'createdAt', header: 'Fecha', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
            { key: 'alumno', header: 'Alumno', render: (r: any) => r.alumno ? `${r.alumno.nombre} ${r.alumno.apellido}` : 'Desconocido' },
            { key: 'tipo', header: 'Gravedad', render: (r: any) => <span className="font-bold">{r.tipo}</span> },
            { key: 'descripcion', header: 'Detalles' },
            { key: 'action', header: 'Acciones', render: (r: any) => isAdmin && (
                <Button variant="ghost" className="text-red-600 text-xs" onClick={() => {
                    if(confirm("¿Borrar incidencia?")) incidentService.delete(r.id).then(loadData);
                }}>Eliminar</Button>
            )}
          ]} 
          data={currentData} 
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Reportar Incidencia">
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <Select label="Alumno" name="alumnoId" required options={students.map(s => ({ label: `${s.nombre} ${s.apellido}`, value: s.id }))} />
          <Select label="Gravedad" name="tipo" required options={[{label:'Leve',value:'Leve'}, {label:'Moderada',value:'Moderada'}, {label:'Grave',value:'Grave'}]} />
          <div className="flex flex-col gap-1">
             <label className="text-sm text-gray-700">Descripción</label>
             <textarea name="descripcion" required className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-200" rows={3}></textarea>
          </div>
          <Button type="submit" variant="danger" className="w-full">Registrar</Button>
        </form>
      </Modal>
    </AppLayout>
  );
}