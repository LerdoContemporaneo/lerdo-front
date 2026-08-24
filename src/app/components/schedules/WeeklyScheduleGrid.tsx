'use client';

import type {
  ScheduleBlock,
  SchoolSchedule,
  ScheduledClass,
} from '../../services/scheduleService';

const DAYS: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

const shortTime = (value: string) => String(value || '').slice(0, 5);

const configurationDays = (schedule?: SchoolSchedule | null) => {
  if (!schedule?.configuracion) return [];
  try {
    const configuration = typeof schedule.configuracion === 'string'
      ? JSON.parse(schedule.configuracion)
      : schedule.configuracion;
    return Array.isArray(configuration?.dias)
      ? configuration.dias.map(Number).filter((day: number) => DAYS[day])
      : [];
  } catch {
    return [];
  }
};

export default function WeeklyScheduleGrid({
  blocks,
  schedule,
}: {
  blocks: ScheduleBlock[];
  schedule?: SchoolSchedule | null;
}) {
  const configuredDays = configurationDays(schedule);
  const classDays = (schedule?.clases || []).map((item) => Number(item.diaSemana));
  const days = [...new Set([...configuredDays, ...classDays])].sort((a, b) => a - b);
  const visibleDays = days.length ? days : [1, 2, 3, 4, 5];

  const classes = new Map<string, ScheduledClass>();
  (schedule?.clases || []).forEach((item) => {
    classes.set(`${item.diaSemana}-${item.bloqueId}`, item);
  });

  const firstBlockBySession = new Map<string, number>();
  (schedule?.clases || []).forEach((item) => {
    const current = firstBlockBySession.get(item.sesionUuid);
    if (current === undefined || item.bloque.numero < current) {
      firstBlockBySession.set(item.sesionUuid, item.bloque.numero);
    }
  });

  if (!blocks.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
        Configura los bloques de clase del periodo para visualizar la cuadrícula.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-[900px] w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-950 text-white">
            <th className="w-32 border border-gray-700 px-3 py-3 text-left">Hora</th>
            {visibleDays.map((day) => (
              <th key={day} className="min-w-40 border border-gray-700 px-3 py-3 text-center uppercase tracking-wide">
                {DAYS[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {blocks.map((block) => (
            <tr key={block.id} className={block.tipo === 'receso' ? 'bg-red-950 text-white' : ''}>
              <th className={`border px-3 py-3 text-left font-semibold ${block.tipo === 'receso' ? 'border-red-900' : 'border-gray-200 bg-gray-100 text-gray-800'}`}>
                {shortTime(block.horaInicio)}–{shortTime(block.horaFin)}
              </th>
              {block.tipo === 'receso' ? (
                <td colSpan={visibleDays.length} className="border border-red-900 px-4 py-3 text-center text-lg font-bold tracking-[0.35em]">
                  RECESO
                </td>
              ) : visibleDays.map((day) => {
                const item = classes.get(`${day}-${block.id}`);
                const isContinuation = item && firstBlockBySession.get(item.sesionUuid) !== block.numero;
                return (
                  <td key={day} className="h-24 border border-gray-200 p-2 align-top">
                    {item ? (
                      <div className={`h-full rounded-lg border border-red-200 bg-gradient-to-br from-red-950 to-red-800 p-3 text-white shadow-sm ${isContinuation ? 'opacity-90' : ''}`}>
                        <p className="font-bold leading-tight">{item.materia?.nombre || 'Materia'}</p>
                        {!isContinuation && (
                          <>
                            <p className="mt-1 text-xs text-red-100">{item.maestro?.name || 'Maestro pendiente'}</p>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-red-200">
                              {item.salon?.nombre || 'Sin salón'}
                              {item.salon?.edificio ? ` · ${item.salon.edificio}` : ''}
                            </p>
                          </>
                        )}
                        {isContinuation && <p className="mt-1 text-xs text-red-100">Continuación</p>}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-lg bg-gray-50 text-xs text-gray-400">
                        Disponible
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
