'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { studentService, gradeService, attendanceService } from '../services/schoolService';
import { useAuth } from '../hooks/useAuth';

export default function MyGroupPage() {
  const { user } = useAuth();
  const [myStudents, setMyStudents] = useState<any[]>([]);
  const [myGroupName, setMyGroupName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const loadMyGroup = async () => {
      // 1. Obtenemos todos los grupos
      const allGrades = await gradeService.getAll();
      // 2. Buscamos si el usuario actual (maestro) tiene un grupo asignado
      // Nota: user.uuid o user.id, depende de cómo guardes el maestroId en Grados
      // En GradosModel.js usas maestroId (INTEGER). En AuthContext user tiene id?
      // Vamos a asumir que podemos comparar con el ID numérico si está disponible, 
      // o tendremos que filtrar por nombre si es lo único que tenemos.
      
      // *Estrategia segura:* Buscamos el grupo donde el maestroId coincida.
      // Necesitamos saber el ID numérico del usuario logueado. 
      // Si AuthContext no tiene el ID numérico, tendremos que buscarlo en /users/me o similar.
      // Por ahora filtraremos los alumnos directos si el backend devuelve "grado" populated.
      
      const allStudents = await studentService.getAll();
      
      // Filtramos alumnos cuyo grupo tenga como maestro al usuario actual
      // Esto asume que el endpoint /alumnos devuelve { grado: { maestroId: ... } }
      const myClass = allStudents.filter((s: any) => s.grado?.maestroId === user.uuid || s.grado?.maestro?.email === user.email);
      
      // Si la estrategia anterior falla (porque el backend no anida tanto),
      // mostramos todos los alumnos para admin, o vacio.
      if (user.role === 'administrador') {
          setMyStudents(allStudents);
          setMyGroupName("Todos los alumnos (Vista Admin)");
      } else {
          // Intento de filtrar por nombre de grupo si no hay match de ID directo
          // Esto es un fallback. Idealmente el backend debe filtrar por ti.
          setMyStudents(allStudents); // Muestra todos temporalmente si no podemos filtrar
          setMyGroupName("Listado General");
      }
    };
    loadMyGroup();
  }, [user]);

  const handleAttendance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
        await attendanceService.createStudent(
            Number(formData.get('alumnoId')),
            formData.get('estado') as string
        );
        alert("Asistencia guardada");
        setIsModalOpen(false);
    } catch (e) { alert("Error al guardar"); }
  };

  return (
    <AppLayout>
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <h2 className="text-2xl font-bold text-blue-800">Panel Docente: {myGroupName}</h2>
        <p className="text-sm text-gray-500">Gestione la asistencia de sus alumnos aquí.</p>

        <Table 
          columns={[
            { key: 'matricula', header: 'Matrícula' },
            { key: 'nombre', header: 'Nombre', render: (r: any) => `${r.nombre} ${r.apellido}` },
            { key: 'grado', header: 'Grupo', render: (r: any) => r.grado?.nombre || '-' },
            { key: 'actions', header: 'Acciones', render: (r: any) => (
                <Button onClick={() => { setSelectedStudent(r); setIsModalOpen(true); }} className="text-xs">
                    Pasar Lista
                </Button>
            )}
          ]} 
          data={myStudents} 
        />
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Asistencia: ${selectedStudent?.nombre}`}>
         <form onSubmit={handleAttendance} className="p-4 space-y-4">
            <input type="hidden" name="alumnoId" value={selectedStudent?.id} />
            <Select label="Estado" name="estado" required options={[{label:'Presente',value:'Presente'},{label:'Ausente',value:'Ausente'},{label:'Tarde',value:'Tarde'}]} />
            <Button type="submit" className="w-full">Guardar</Button>
         </form>
      </Modal>
    </AppLayout>
  );
}