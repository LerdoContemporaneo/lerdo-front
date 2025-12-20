'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { studentService, gradeService } from '../services/schoolService';
import { useAuth } from '../hooks/useAuth';

export default function StudentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';
  
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 6;

  const loadData = async () => {
    const sData = await studentService.getAll();
    const gData = await gradeService.getAll();
    setStudents(sData);
    setGrades(gData);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // ESTO ES VITAL: Evita que la página se recargue
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      nombre: formData.get('nombre') as string,
      apellido: formData.get('apellido') as string,
      matricula: formData.get('matricula') as string,
      tutor: formData.get('tutor') as string,
      gradoId: Number(formData.get('gradoId')),
    };

    try {
      const response = await studentService.create(payload);
      if (response.id || response.uuid) {
        alert("¡Alumno registrado!");
        setIsModalOpen(false);
        loadData();
      } else {
        alert("Error: " + (response.msg || "No se pudo guardar"));
      }
    } catch (error) {
      alert("Error de conexión con el servidor");
    }
  };

  const filtered = Array.isArray(students) ? students.filter((s: any) => 
    s.nombre?.toLowerCase().includes(search.toLowerCase()) || 
    s.matricula?.includes(search)
  ) : [];

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const currentData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AppLayout>
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Alumnos</h2>
          {isAdmin && <Button onClick={() => setIsModalOpen(true)}>+ Nuevo Alumno</Button>}
        </div>

        <Input 
          placeholder="Buscar por nombre o matrícula..." 
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />

        <Table 
          columns={[
            { key: 'matricula', header: 'Matrícula' },
            { key: 'nombre', header: 'Nombre', render: (r: any) => `${r.nombre} ${r.apellido}` },
            { key: 'grado', header: 'Grupo', render: (r: any) => r.grado?.nombre || 'S/G' },
            { 
              key: 'actions', 
              header: 'Acciones', 
              render: (r: any) => isAdmin && (
                <Button variant="danger" className="py-1 px-2 text-xs" onClick={async () => {
                  if(confirm('¿Eliminar?')) { await studentService.delete(r.id); loadData(); }
                }}>Eliminar</Button>
              )
            }
          ]} 
          data={currentData} 
        />

        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Alumno">
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <Input label="Nombre" name="nombre" required />
          <Input label="Apellido" name="apellido" required />
          <Input label="Matrícula" name="matricula" required />
          <Input label="Tutor" name="tutor" required />
          <Select 
            label="Grupo" 
            name="gradoId" 
            required 
            options={grades.map((g: any) => ({ label: g.nombre, value: g.id.toString() }))}
          />
          <Button type="submit" className="w-full">Guardar Alumno</Button>
        </form>
      </Modal>
    </AppLayout>
  );
}