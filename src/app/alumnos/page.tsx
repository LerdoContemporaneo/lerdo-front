'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { studentService, gradeService, userService } from '../services/schoolService';
import { useAuth } from '../hooks/useAuth';

export default function StudentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';
  
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(false); // <--- ESTO FALTABA
  const itemsPerPage = 6;

  const loadData = async () => {
    const sData = await studentService.getAll();
    const gData = await gradeService.getAll();
    const allUsers = await userService.getAll();
    
    setStudents(sData);
    setGrades(gData);
    
    // Filtrar usuarios con rol alumno que no tengan ya un registro en la tabla Alumnos
    const studentUsers = allUsers.filter((u: any) => 
        u.role === 'alumno' && !sData.some((s: any) => s.userId === u.id)
    );
    setAvailableUsers(studentUsers);
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenEdit = (student: any) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setLoading(true);
  const formData = new FormData(e.currentTarget);
  const selectedUserId = formData.get('userId');

  // Buscamos el objeto del usuario seleccionado para obtener su nombre/apellido
  const selectedUser = availableUsers.find(u => u.id.toString() === selectedUserId);

  const payload: any = {
    matricula: formData.get('matricula') as string,
    tutor: formData.get('tutor') as string,
    gradoId: Number(formData.get('gradoId')),
  };

  if (!editingStudent && selectedUser) {
    // Dividimos el nombre del usuario (ej: "Juan Perez") para enviarlo al backend
    const nameParts = selectedUser.name.split(' ');
    payload.nombre = nameParts[0]; 
    payload.apellido = nameParts.slice(1).join(' ') || ' ';
    payload.userId = selectedUser.id;
    
    // Datos por defecto para el controlador
    payload.email = selectedUser.email;
    payload.password = 'defaultPassword123'; 
    payload.confPassword = 'defaultPassword123';
  }

  try {
    if (editingStudent) {
      await studentService.update(editingStudent.uuid, payload);
      alert("¡Perfil actualizado!");
    } else {
      await studentService.create(payload);
      alert("¡Usuario vinculado como alumno!");
    }
    setIsModalOpen(false);
    loadData();
  } catch (error) {
    alert("Error al guardar");
  } finally {
    setLoading(false);
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
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Alumnos</h2>
          {isAdmin && (
            <Button onClick={handleOpenCreate} className="bg-red-900 text-white">
              + Nuevo Alumno
            </Button>
          )}
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
                <div className="flex gap-2">
                  <Button 
                    className="py-1 px-2 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100" 
                    onClick={() => handleOpenEdit(r)}
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="danger" 
                    className="py-1 px-2 text-xs bg-red-50 text-red-700 hover:bg-red-100" 
                    onClick={async () => {
                      if(confirm('¿Estás seguro de eliminar este alumno?')) { 
                        await studentService.delete(r.uuid);
                        loadData(); 
                      }
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
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

     <Modal 
  open={isModalOpen} 
  onClose={() => { setIsModalOpen(false); setEditingStudent(null); }} 
  title={editingStudent ? "Editar Alumno" : "Vincular Nuevo Alumno"}
>
  <form onSubmit={handleSubmit} className="p-4 space-y-4">
    {/* Si estamos editando, mostramos el nombre pero no dejamos editarlo (o lo quitamos) */}
    {editingStudent && (
      <div className="p-2 bg-gray-100 rounded text-sm font-semibold text-gray-700">
        Alumno: {editingStudent.nombre} {editingStudent.apellido}
      </div>
    )}

    {!editingStudent && (
      <Select 
        label="Seleccionar Usuario" 
        name="userId" 
        required 
        options={availableUsers.map((u: any) => ({ label: u.name, value: u.id.toString() }))}
      />
    )}
    
    <Input label="Matrícula" name="matricula" defaultValue={editingStudent?.matricula} required />
    <Input label="Tutor" name="tutor" defaultValue={editingStudent?.tutor} required />
    
    <Select 
      label="Grupo / Grado" 
      name="gradoId" 
      required 
      defaultValue={editingStudent?.gradoId?.toString()}
      options={grades.map((g: any) => ({ label: g.nombre, value: g.id.toString() }))}
    />
    
    <Button type="submit" className="w-full bg-red-900 text-white" disabled={loading}>
      {loading ? "Procesando..." : (editingStudent ? "Actualizar Datos" : "Vincular y Guardar")}
    </Button>
  </form>
</Modal>
    </AppLayout>
  );
}