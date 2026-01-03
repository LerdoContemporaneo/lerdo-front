'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { incidentService, studentService } from '../services/schoolService';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    incidentService.getAll().then(setIncidents);
    studentService.getAll().then(setStudents);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await incidentService.create({
      tipo: formData.get('tipo'),
      descripcion: formData.get('descripcion'),
      alumnoId: Number(formData.get('alumnoId'))
    });
    setIsModalOpen(false);
    incidentService.getAll().then(setIncidents);
  };

  return (
    <AppLayout>
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Bitácora de Incidencias</h2>
          <Button onClick={() => setIsModalOpen(true)}>+ Registrar Incidencia</Button>
        </div>

        <Table 
          columns={[
            { key: 'fecha', header: 'Fecha' },
            { key: 'alumno', header: 'Alumno', render: (r: any) => r.alumno ? `${r.alumno.nombre}` : 'N/A' },
            { key: 'tipo', header: 'Gravedad' },
            { key: 'descripcion', header: 'Detalles' }
          ]} 
          data={incidents} 
        />
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Incidencia">
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <Select 
            label="Alumno" 
            name="alumnoId" 
            required 
            options={students.map(s => ({ label: `${s.nombre} ${s.apellido}`, value: s.id.toString() }))}
          />
          <Select 
            label="Tipo" 
            name="tipo" 
            required 
            options={[
              { label: 'Leve', value: 'Leve' },
              { label: 'Moderada', value: 'Moderada' },
              { label: 'Grave', value: 'Grave' }
            ]}
          />
          <Input label="Descripción del suceso" name="descripcion" required />
          <Button type="submit" className="w-full">Registrar</Button>
        </form>
      </Modal>
    </AppLayout>
  );
}