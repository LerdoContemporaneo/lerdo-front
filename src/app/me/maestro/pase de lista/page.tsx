'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../../../components/AppLayout';
import Button from '../../../components/ui/Button';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { studentService, attendanceService } from '../../../services/schoolService';

export default function PaseDeListaPage() {
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [asistencias, setAsistencias] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cargar los alumnos (idealmente aquí filtraríamos por la materia/grupo del maestro)
    studentService.getAll().then((data) => {
      setAlumnos(data);
      // Por defecto, inicializamos a todos como "Presente"
      const defaultState: Record<number, string> = {};
      data.forEach((alumno: any) => {
        defaultState[alumno.id] = 'Presente';
      });
      setAsistencias(defaultState);
    });
  }, []);

  // Función para cambiar el estado cíclicamente: Presente -> Ausente -> Tarde
  const toggleAsistencia = (id: number) => {
    setAsistencias((prev) => {
      const currentState = prev[id];
      let nextState = 'Presente';
      if (currentState === 'Presente') nextState = 'Ausente';
      else if (currentState === 'Ausente') nextState = 'Tarde';
      
      return { ...prev, [id]: nextState };
    });
  };

  const guardarAsistencia = async () => {
    setLoading(true);
    try {
      // Enviamos todas las asistencias al backend
      const promesas = Object.entries(asistencias).map(([alumnoId, estado]) => 
        attendanceService.createStudent(Number(alumnoId), estado)
      );
      await Promise.all(promesas);
      alert("¡Pase de lista guardado con éxito! ✅");
    } catch (error) {
      alert("Hubo un error al guardar la asistencia.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['maestro', 'administrador']}>
      <AppLayout>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-3xl mx-auto space-y-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-red-900">Pase de Lista Rápido</h2>
            <p className="text-gray-500 text-sm mt-1">Todos están presentes por defecto. Toca el botón para cambiar a Ausente o Retardo.</p>
          </div>

          <div className="space-y-3">
            {alumnos.map((alumno) => {
              const estado = asistencias[alumno.id];
              
              // Colores dinámicos del deslizador según el estado
              const bgClass = 
                estado === 'Presente' ? 'bg-green-500' : 
                estado === 'Ausente' ? 'bg-red-500' : 'bg-yellow-500';

              const textClass = 
                estado === 'Presente' ? 'text-green-700' : 
                estado === 'Ausente' ? 'text-red-700' : 'text-yellow-700';

              return (
                <div key={alumno.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-800">{alumno.nombre} {alumno.apellido}</p>
                    <p className="text-xs text-gray-400">{alumno.matricula}</p>
                  </div>

                  {/* DESLIZADOR INTERACTIVO */}
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-16 text-right ${textClass}`}>
                      {estado}
                    </span>
                    <button 
                      type="button"
                      onClick={() => toggleAsistencia(alumno.id)}
                      className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${bgClass}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          estado === 'Presente' ? 'translate-x-7' : 
                          estado === 'Tarde' ? 'translate-x-3.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Button 
            onClick={guardarAsistencia} 
            className="w-full bg-red-900 hover:bg-red-800 text-white py-3 text-lg font-bold rounded-lg shadow-md mt-6"
            disabled={loading || alumnos.length === 0}
          >
            {loading ? 'Guardando Lista...' : 'Guardar Asistencia del Día'}
          </Button>

        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}