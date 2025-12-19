'use client';
import React, { useState, useEffect } from 'react';
import { Table } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ProtectedRoute from '../components/ProtectedRoute';
import AppLayout from '../components/AppLayout';
import { studentService, attendanceService, incidentService } from '../services/schoolService';

function TeachersContent() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{type: 'asistencia' | 'incidencia' | null, open: boolean}>({type: null, open: false});

  useEffect(() => {
    studentService.getAll().then(data => {
      setStudents(data);
      setLoading(false);
    });
  }, []);

  const handleAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const studentId = Number(formData.get('studentId'));

    if (modal.type === 'asistencia') {
      await attendanceService.createStudent(studentId, formData.get('estado') as string);
    } else {
      await incidentService.create({
        alumnoId: studentId,
        tipo: formData.get('tipo') as string,
        descripcion: formData.get('descripcion') as string
      });
    }
    alert("Registro completado");
    setModal({ type: null, open: false });
  };

  if (loading) return <div className="p-10 text-center">Cargando alumnos...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Módulo Maestros</h2>
        <div className="flex gap-2">
          <Button onClick={() => setModal({type: 'asistencia', open: true})}>Asistencia</Button>
          <Button variant="danger" onClick={() => setModal({type: 'incidencia', open: true})}>Incidencia</Button>
        </div>
      </div>

      <Table 
        columns={[
          { key: 'nombre', header: 'Nombre', render: (r: any) => `${r.nombre} ${r.apellido}` },
          { key: 'matricula', header: 'Matrícula' },
          { key: 'tutor', header: 'Tutor' }
        ]} 
        data={students} 
      />

      <Modal open={modal.open} onClose={() => setModal({type: null, open: false})} title={modal.type === 'asistencia' ? "Pase de Lista" : "Reportar Incidencia"}>
        <form onSubmit={handleAction} className="space-y-4 p-2">
          <label className="text-sm block">Alumno</label>
          <select name="studentId" className="w-full p-2 border rounded">
            {students.map((s: any) => <option key={s.id} value={s.id}>{s.nombre} {s.apellido}</option>)}
          </select>

          {modal.type === 'asistencia' ? (
            <select name="estado" className="w-full p-2 border rounded">
              <option value="Presente">Presente</option>
              <option value="Ausente">Ausente</option>
              <option value="Tarde">Tarde</option>
            </select>
          ) : (
            <>
              <input name="tipo" placeholder="Tipo (Conducta, Académico...)" className="w-full p-2 border rounded" required />
              <textarea name="descripcion" placeholder="Detalles de la incidencia" className="w-full p-2 border rounded" required />
            </>
          )}
          <Button type="submit" className="w-full">Confirmar</Button>
        </form>
      </Modal>
    </div>
  );
}

export default function TeachersPage() {
  return (
    <ProtectedRoute allowedRoles={['maestro', 'administrador']}>
      <AppLayout><TeachersContent /></AppLayout>
    </ProtectedRoute>
  );
}