'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { reportService, studentService } from '../services/schoolService';
import ProtectedRoute from '../components/ProtectedRoute';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
        const [reportsData, studentsData] = await Promise.all([
            reportService.getAll(),
            studentService.getAll()
        ]);
        setReports(reportsData);
        setStudents(studentsData);
    } catch (e) {
        console.error("Error cargando datos", e);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    // Objeto basado en tu archivo .rest para reportes
    const payload = {
        titulo: formData.get('titulo'),
        contenido: formData.get('contenido'),
        alumnoId: Number(formData.get('alumnoId'))
    };

    try {
        await reportService.create(payload);
        alert("Reporte creado con éxito 📝");
        setIsModalOpen(false);
        loadData();
    } catch (error) {
        alert("Error al crear el reporte");
    } finally {
        setLoading(false);
    }
  };

  // Filtrado de reportes
  const filtered = Array.isArray(reports) ? reports.filter((r: any) => 
    r.titulo?.toLowerCase().includes(search.toLowerCase()) || 
    r.alumno?.nombre?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <ProtectedRoute allowedRoles={['administrador', 'maestro']}>
      <AppLayout>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-red-900">Reportes de Alumnos</h2>
            <Button onClick={() => setIsModalOpen(true)} className="bg-red-900 hover:bg-red-800 text-white shadow-md">
                + Nuevo Reporte
            </Button>
          </div>

          <div className="max-w-md">
            <Input 
                placeholder="Buscar por título o alumno..." 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <Table 
              columns={[
                { key: 'createdAt', header: 'Fecha', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
                { key: 'titulo', header: 'Título', render: (r: any) => <span className="font-semibold">{r.titulo}</span> },
                { key: 'alumno', header: 'Alumno', render: (r: any) => r.alumno ? `${r.alumno.nombre} ${r.alumno.apellido}` : 'N/A' },
                { key: 'contenido', header: 'Descripción' },
                { 
                  key: 'actions', 
                  header: 'Acciones', 
                  render: (r: any) => (
                      <Button 
                          variant="danger" 
                          className="text-xs bg-red-50 text-red-700 hover:bg-red-100" 
                          onClick={() => {
                              if(confirm("¿Estás seguro de eliminar este reporte?")) {
                                  reportService.delete(r.uuid || r.id).then(loadData);
                              }
                          }}
                      >
                          Borrar
                      </Button>
                  )
                }
              ]} 
              data={filtered.slice((currentPage - 1) * 5, currentPage * 5)} 
            />
          </div>
          
          <Pagination 
            currentPage={currentPage} 
            totalPages={Math.ceil(filtered.length / 5) || 1} 
            onPageChange={setCurrentPage} 
          />
        </div>

        {/* Modal para Crear Reporte */}
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nuevo Reporte">
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <Input 
                label="Título del Reporte" 
                name="titulo" 
                required 
                placeholder="Ej. Comportamiento inadecuado" 
            />
            
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Contenido / Razón</label>
                <textarea 
                    name="contenido" 
                    className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-red-500 outline-none text-sm" 
                    rows={4} 
                    required 
                    placeholder="Describe lo sucedido..."
                />
            </div>

            <Select 
                label="Alumno Involucrado" 
                name="alumnoId" 
                required 
                options={students.map(s => ({
                    label: `${s.nombre} ${s.apellido} (${s.matricula})`,
                    value: s.id.toString()
                }))}
            />

            <Button type="submit" className="w-full bg-red-900 hover:bg-red-800 text-white" disabled={loading}>
                {loading ? "Guardando..." : "Registrar Reporte"}
            </Button>
          </form>
        </Modal>

      </AppLayout>
    </ProtectedRoute>
  );
}