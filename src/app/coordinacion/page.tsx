'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import {
  levelService,
  type EducationalLevel,
} from '../services/schoolService';

export default function CoordinatorPage() {
  const [levels, setLevels] = useState<EducationalLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLevels = async () => {
      try {
        setLoading(true);
        setError('');
        setLevels(await levelService.getAll());
      } catch (loadError) {
        setLevels([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No fue posible cargar tus niveles educativos.',
        );
      } finally {
        setLoading(false);
      }
    };

    void loadLevels();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['coordinador']}>
      <AppLayout>
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="rounded-2xl bg-gradient-to-br from-red-950 via-red-900 to-red-800 p-6 text-white shadow-lg sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-200">
              Portal CELC
            </p>
            <h1 className="mt-2 text-3xl font-bold">Coordinación académica</h1>
            <p className="mt-2 text-sm text-red-100">
              Estos son los niveles educativos que puedes administrar.
            </p>
          </header>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
              Cargando niveles…
            </div>
          ) : levels.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
              Tu cuenta todavía no tiene niveles asignados. Solicita al administrador que realice la asignación.
            </div>
          ) : (
            <>
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ['/admin', 'Usuarios', 'Crear maestros y alumnos'],
                  ['/grupos', 'Grupos', 'Organizar grupos por nivel'],
                  ['/alumnos', 'Alumnos', 'Vincular cuentas y grupos'],
                  ['/tareas', 'Tareas', 'Consultar tareas asignadas'],
                  ['/asistencias', 'Asistencia', 'Revisar el historial'],
                  ['/reportes', 'Reportes', 'Consultar reportes escolares'],
                  ['/incidents', 'Incidencias', 'Revisar incidencias'],
                ].map(([href, title, description]) => (
                  <Link key={href} href={href} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-red-200 hover:shadow-md">
                    <h2 className="font-bold text-red-900">{title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{description}</p>
                  </Link>
                ))}
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-gray-900">Tus niveles educativos</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {levels.map((level) => (
                    <article key={level.uuid} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Nivel {level.orden}</p>
                      <h3 className="mt-1 text-xl font-bold text-gray-900">{level.nombre}</h3>
                      <p className="mt-4 text-sm text-gray-500">Clave: {level.clave}</p>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
