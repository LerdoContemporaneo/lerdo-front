'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import { teacherAttendanceService } from '../services/schoolService';
import ProtectedRoute from '../components/ProtectedRoute';

export default function TeacherAttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = () => teacherAttendanceService.getAll().then(setRecords);
  useEffect(() => { loadData(); }, []);

  const totalPages = Math.ceil(records.length / 8) || 1;
  const currentData = records.slice((currentPage - 1) * 8, currentPage * 8);

  return (
    <ProtectedRoute allowedRoles={['administrador']}>
      <AppLayout>
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-indigo-700">Control de Asistencia Docente</h2>
          
          <Table 
            columns={[
              { key: 'fecha', header: 'Fecha', render: (r: any) => new Date(r.fecha).toLocaleDateString() },
              { key: 'maestro', header: 'Docente', render: (r: any) => r.maestro ? r.maestro.name : 'N/A' },
              { key: 'estado', header: 'Estado', render: (r: any) => (
                  <span className={`font-bold ${r.estado === 'Presente' ? 'text-green-600' : 'text-red-600'}`}>
                      {r.estado}
                  </span>
              )},
              { key: 'actions', header: 'Acciones', render: (r: any) => (
                  <Button variant="ghost" className="text-xs text-red-500" onClick={() => {
                      if(confirm("¿Eliminar registro?")) teacherAttendanceService.delete(r.id).then(loadData);
                  }}>Eliminar</Button>
              )}
            ]} 
            data={currentData} 
          />
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}