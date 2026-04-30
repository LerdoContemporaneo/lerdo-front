'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Button from '../components/ui/Button';
import { attendanceService } from '../services/schoolService';
import { useAuth } from '../hooks/useAuth';

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';
  const [records, setRecords] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = () => attendanceService.getAll().then(setRecords);
  useEffect(() => { loadData(); }, []);

  const totalPages = Math.ceil(records.length / 8) || 1;
  const currentData = records.slice((currentPage - 1) * 8, currentPage * 8);

  return (
    <AppLayout>
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <h2 className="text-2xl font-bold">Historial de Asistencia (Alumnos)</h2>
        <p className="text-sm text-gray-500">Los registros se crean desde el panel de "Maestros" o "Mi Grupo".</p>
        
        <Table 
          columns={[
            { key: 'fecha', header: 'Fecha', render: (r: any) => new Date(r.fecha).toLocaleDateString() },
            { key: 'alumno', header: 'Alumno', render: (r: any) => r.alumno ? `${r.alumno.nombre} ${r.alumno.apellido}` : 'N/A' },
            { key: 'estado', header: 'Estado', render: (r: any) => (
                <span className={`px-2 py-1 rounded text-xs ${r.estado === 'Presente' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {r.estado}
                </span>
            )},
            { key: 'grado', header: 'Grupo', render: (r: any) => r.alumno?.grado?.nombre || '-' },
            { key: 'del', header: '', render: (r: any) => isAdmin && (
                <Button variant="ghost" className="text-xs text-red-500" onClick={() => {
                    if(confirm("¿Borrar registro?")) attendanceService.delete(r.id).then(loadData);
                }}>X</Button>
            )}
          ]} 
          data={currentData} 
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </AppLayout>
  );
}