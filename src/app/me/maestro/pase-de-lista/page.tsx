'use client';

import { useEffect, useState } from 'react';
import AppLayout from '../../../components/AppLayout';
import Button from '../../../components/ui/Button';
import ProtectedRoute from '../../../components/ProtectedRoute';
import {
  studentService,
  attendanceService,
  type AttendanceStatus,
} from '../../../services/schoolService';

type Alumno = {
  id: number;
  nombre: string;
  apellido: string;
  matricula: string;
};

export default function PaseDeListaPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [asistencias, setAsistencias] = useState<
    Record<number, AttendanceStatus>
  >({});
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarAlumnos = async () => {
      setLoadingStudents(true);
      setError('');

      try {
        const data = await studentService.getAll();
        const students = Array.isArray(data)
          ? (data as Alumno[])
          : [];

        setAlumnos(students);

        const defaultState: Record<number, AttendanceStatus> = {};

        students.forEach((alumno) => {
          defaultState[alumno.id] = 'Presente';
        });

        setAsistencias(defaultState);
      } catch (error) {
        console.error('Error al cargar alumnos:', error);
        setError('No fue posible cargar la lista de alumnos.');
      } finally {
        setLoadingStudents(false);
      }
    };

    void cargarAlumnos();
  }, []);

  const toggleAsistencia = (id: number) => {
    setAsistencias((prev) => {
      const currentState = prev[id] ?? 'Presente';
      let nextState: AttendanceStatus = 'Presente';

      if (currentState === 'Presente') {
        nextState = 'Ausente';
      } else if (currentState === 'Ausente') {
        nextState = 'Tarde';
      }

      return {
        ...prev,
        [id]: nextState,
      };
    });
  };

  const guardarAsistencia = async () => {
    if (alumnos.length === 0) {
      alert('No hay alumnos para registrar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const promesas = Object.entries(asistencias).map(
        ([alumnoId, estado]) =>
          attendanceService.createStudent(
            Number(alumnoId),
            estado
          )
      );

      await Promise.all(promesas);

      alert('¡Pase de lista guardado con éxito! ✅');
    } catch (error) {
      console.error('Error al guardar la asistencia:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Hubo un error al guardar la asistencia.';

      setError(message);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute
      allowedRoles={['maestro', 'administrador']}
    >
      <AppLayout>
        <div className="mx-auto max-w-3xl space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-red-900">
              Pase de Lista Rápido
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Todos están presentes por defecto. Toca el botón
              para cambiar a Ausente o Tarde.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loadingStudents ? (
            <p className="py-8 text-center text-gray-500">
              Cargando alumnos...
            </p>
          ) : alumnos.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              No hay alumnos disponibles para pasar lista.
            </p>
          ) : (
            <div className="space-y-3">
              {alumnos.map((alumno) => {
                const estado =
                  asistencias[alumno.id] ?? 'Presente';

                const bgClass =
                  estado === 'Presente'
                    ? 'bg-green-500'
                    : estado === 'Ausente'
                      ? 'bg-red-500'
                      : 'bg-yellow-500';

                const textClass =
                  estado === 'Presente'
                    ? 'text-green-700'
                    : estado === 'Ausente'
                      ? 'text-red-700'
                      : 'text-yellow-700';

                const translateClass =
                  estado === 'Presente'
                    ? 'translate-x-7'
                    : estado === 'Tarde'
                      ? 'translate-x-3.5'
                      : 'translate-x-0';

                return (
                  <div
                    key={alumno.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {alumno.nombre} {alumno.apellido}
                      </p>

                      <p className="text-xs text-gray-400">
                        {alumno.matricula}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`w-16 text-right text-sm font-bold ${textClass}`}
                      >
                        {estado}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          toggleAsistencia(alumno.id)
                        }
                        aria-label={`Cambiar asistencia de ${alumno.nombre}. Estado actual: ${estado}`}
                        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent shadow-inner transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-900 focus:ring-offset-2 ${bgClass}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${translateClass}`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Button
            onClick={guardarAsistencia}
            className="mt-6 w-full rounded-lg bg-red-900 py-3 text-lg font-bold text-white shadow-md hover:bg-red-800"
            disabled={
              loading ||
              loadingStudents ||
              alumnos.length === 0
            }
          >
            {loading
              ? 'Guardando Lista...'
              : 'Guardar Asistencia del Día'}
          </Button>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}