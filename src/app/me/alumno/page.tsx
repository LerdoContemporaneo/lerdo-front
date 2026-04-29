'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import { Table } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';
import { reportService, homeworkService } from '../../services/schoolService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AlumnoDashboard() {
  const { user } = useAuth(); // Necesitamos saber quién es el usuario logueado
  const [misReportes, setMisReportes] = useState<any[]>([]);
  const [misTareas, setMisTareas] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    // Cargar datos
    const loadMyData = async () => {
      try {
        const [reportes, tareas] = await Promise.all([
          reportService.getAll(),
          homeworkService.getAll()
        ]);
        
        // Asumiendo que tu backend vincula el reporte/tarea con un 'alumno' 
        // y ese alumno tiene un 'userId' o el nombre coincide.
        // OJO: Ajusta esta condición según cómo te devuelva los datos tu backend.
        const misRep = reportes.filter((r: any) => r.alumno?.userId === user?.uuid || r.alumno?.nombre === user?.name);
        const misTar = tareas.filter((t: any) => t.alumno?.userId === user?.uuid || t.alumno?.nombre === user?.name);
        
        setMisReportes(misRep);
        setMisTareas(misTar);
      } catch (error) {
        console.error("Error cargando datos del alumno", error);
      }
    };

    if (user) loadMyData();
  }, [user]);

  // 🖨️ FUNCIÓN PARA GENERAR EL PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Título del PDF
    doc.setFontSize(18);
    doc.setTextColor(153, 27, 27); // Rojo oscuro (red-900)
    doc.text('Historial de Reportes - Control CELC', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Alumno: ${user?.name || 'Desconocido'}`, 14, 32);

    // Crear la tabla con autoTable
    autoTable(doc, {
      startY: 40,
      headStyles: { fillColor: [153, 27, 27] }, // Fondo rojo en la cabecera
      head: [['Fecha', 'Título', 'Descripción']],
      body: misReportes.map(r => [
        new Date(r.createdAt).toLocaleDateString(),
        r.titulo,
        r.contenido
      ]),
    });

    // Descargar el archivo
    doc.save(`Reportes_${user?.name?.replace(/\s/g, '_')}.pdf`);
    setToastMsg('¡PDF descargado con éxito! 📄');
  };

  return (
    <ProtectedRoute allowedRoles={['alumno']}>
      <AppLayout>
        <div className="space-y-8">
          <div className="bg-red-900 text-white p-6 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold">¡Hola, {user?.name}! 👋</h1>
            <p className="mt-2 text-red-200">Bienvenido a tu panel estudiantil. Aquí puedes revisar tus pendientes.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Sección de Tareas */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Mis Tareas Pendientes 📚</h2>
              <Table 
                columns={[
                  { key: 'titulo', header: 'Tarea' },
                  { key: 'fechaEntrega', header: 'Para el', render: (r: any) => new Date(r.fechaEntrega).toLocaleDateString() }
                ]} 
                data={misTareas} 
              />
            </div>

            {/* Sección de Reportes */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Mis Reportes ⚠️</h2>
                <Button onClick={downloadPDF} className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                  Descargar PDF
                </Button>
              </div>
              <Table 
                columns={[
                  { key: 'createdAt', header: 'Fecha', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
                  { key: 'titulo', header: 'Motivo' }
                ]} 
                data={misReportes} 
              />
            </div>
          </div>
        </div>

        {/* Mostrar mensaje emergente si existe */}
        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}
      </AppLayout>
    </ProtectedRoute>
  );
}