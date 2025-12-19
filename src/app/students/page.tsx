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
  
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 6;

  const loadData = async () => {
    const [sData, gData] = await Promise.all([
      studentService.getAll(),
      gradeService.getAll()
    ]);
    setStudents(sData);
    setGrades(gData);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      nombre: formData.get('nombre'),
      apellido: formData.get('apellido'),
      matricula: formData.get('matricula'),
      tutor: formData.get('tutor'),
      gradoId: Number(formData.get('gradoId')),
    };

    try {
      await studentService.create(payload);
      alert("Alumno registrado con éxito");
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      alert("Error al registrar");
    }
  };

  const filtered = students.filter((s: any) => 
    s.nombre.toLowerCase().includes(search.toLowerCase()) || 
    s.matricula.includes(search)
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AppLayout>
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Alumnos Registrados</h2>
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
            { key: 'nombre', header: 'Nombre Completo', render: (r: any) => `${r.nombre} ${r.apellido}` },
            { key: 'tutor', header: 'Tutor' },
            { key: 'grado', header: 'Grupo', render: (r: any) => r.grado?.nombre || 'Sin grupo' },
            { 
              key: 'actions', 
              header: 'Acciones', 
              render: (r: any) => isAdmin && (
                <Button variant="danger" className="py-1 px-2 text-xs" onClick={async () => {
                  if(confirm('¿Eliminar alumno?')) {
                    await studentService.delete(r.id);
                    loadData();
                  }
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
          className="mt-4"
        />
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Nuevo Alumno">
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre(s)" name="nombre" required />
            <Input label="Apellido(s)" name="apellido" required />
          </div>
          <Input label="Matrícula" name="matricula" required />
          <Input label="Nombre del Tutor" name="tutor" required />
          <Select 
            label="Asignar Grupo" 
            name="gradoId" 
            required 
            options={grades.map((g: any) => ({ label: g.nombre, value: g.id.toString() }))}
          />
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="w-full">Guardar</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}