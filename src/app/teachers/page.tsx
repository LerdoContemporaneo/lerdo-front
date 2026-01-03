'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import { Select } from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { userService, attendanceService } from '../services/schoolService';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  const loadTeachers = async () => {
    const data = await userService.getAll();
    setTeachers(data.filter((u: any) => u.role === 'maestro'));
  };

  useEffect(() => { loadTeachers(); }, []);

  const handleAttendance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await attendanceService.createTeacher(
        Number(formData.get('maestroId')),
        formData.get('estado') as string
      );
      alert("Asistencia de maestro registrada");
      setIsModalOpen(false);
    } catch (error) {
      alert("Error al registrar asistencia");
    }
  };

  return (
    <AppLayout>
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Panel de Docentes</h2>
        
        <Table 
          columns={[
            { key: 'name', header: 'Nombre del Maestro' },
            { key: 'email', header: 'Correo Electrónico' },
            { 
              key: 'actions', 
              header: 'Asistencia', 
              render: (r: any) => (
                <Button onClick={() => { setSelectedTeacher(r); setIsModalOpen(true); }}>
                  Pasar Lista
                </Button>
              )
            }
          ]} 
          data={teachers} 
        />
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Asistencia: ${selectedTeacher?.name}`}>
        <form onSubmit={handleAttendance} className="p-4 space-y-4">
          <input type="hidden" name="maestroId" value={selectedTeacher?.id} />
          <Select 
            label="Estado de Asistencia" 
            name="estado" 
            required 
            options={[
              { label: 'Presente', value: 'Presente' },
              { label: 'Tarde', value: 'Tarde' },
              { label: 'Ausente', value: 'Ausente' },
              { label: 'Justificado', value: 'Justificado' }
            ]}
          />
          <Button type="submit" className="w-full">Confirmar Asistencia</Button>
        </form>
      </Modal>
    </AppLayout>
  );
}