'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import Pagination from '../components/ui/Pagination';
import { reportService } from '../services/schoolService';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    reportService.getAll().then(setReports);
  }, []);

  const filtered = reports.filter((r: any) => 
    r.titulo.toLowerCase().includes(search.toLowerCase()) || 
    r.alumno?.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <h2 className="text-2xl font-bold">Historial de Reportes</h2>
        <Input 
          placeholder="Filtrar por título o alumno..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Table 
          columns={[
            { key: 'createdAt', header: 'Fecha', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
            { key: 'titulo', header: 'Título' },
            { key: 'alumno', header: 'Alumno', render: (r: any) => r.alumno ? `${r.alumno.nombre} ${r.alumno.apellido}` : 'N/A' },
            { key: 'contenido', header: 'Descripción' }
          ]} 
          data={filtered.slice((currentPage - 1) * 5, currentPage * 5)} 
        />
        <Pagination 
          currentPage={currentPage} 
          totalPages={Math.ceil(filtered.length / 5)} 
          onPageChange={setCurrentPage} 
        />
      </div>
    </AppLayout>
  );
}