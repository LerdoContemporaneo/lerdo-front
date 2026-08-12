'use client';

import type { EducationalLevel } from '../../services/schoolService';
import type { UserRole } from '../../types/auth';

type UserLevelSelectorProps = {
  role: UserRole;
  levels: EducationalLevel[];
  selectedIds: number[];
  onChange: (levelIds: number[]) => void;
  disabled?: boolean;
  loading?: boolean;
};

const ROLE_HELP: Partial<Record<UserRole, string>> = {
  coordinador: 'Puede coordinar uno o varios niveles educativos.',
  maestro: 'Puede impartir clases en uno o varios niveles educativos.',
  alumno: 'El alumno debe pertenecer a un solo nivel educativo.',
};

export default function UserLevelSelector({
  role,
  levels,
  selectedIds,
  onChange,
  disabled = false,
  loading = false,
}: UserLevelSelectorProps) {
  if (role === 'administrador') {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        El administrador tiene acceso global y no necesita un nivel asignado.
      </div>
    );
  }

  const singleSelection = role === 'alumno';
  const activeLevels = levels.filter((level) => level.activo);

  const toggleLevel = (levelId: number) => {
    if (singleSelection) {
      onChange([levelId]);
      return;
    }

    onChange(
      selectedIds.includes(levelId)
        ? selectedIds.filter((id) => id !== levelId)
        : [...selectedIds, levelId],
    );
  };

  return (
    <fieldset className="space-y-3" disabled={disabled || loading}>
      <div>
        <legend className="text-sm font-medium text-gray-700">
          {singleSelection ? 'Nivel educativo *' : 'Niveles educativos *'}
        </legend>
        <p className="mt-1 text-xs text-gray-500">{ROLE_HELP[role]}</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          Cargando niveles educativos…
        </div>
      ) : activeLevels.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No hay niveles activos. Activa al menos uno antes de crear esta cuenta.
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {activeLevels.map((level) => {
            const checked = selectedIds.includes(Number(level.id));

            return (
              <label
                key={level.uuid}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  checked
                    ? 'border-red-700 bg-red-50 ring-1 ring-red-700/20'
                    : 'border-gray-200 bg-white hover:border-red-300'
                } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <input
                  type={singleSelection ? 'radio' : 'checkbox'}
                  name="nivelIds"
                  value={level.id}
                  checked={checked}
                  onChange={() => toggleLevel(Number(level.id))}
                  className="mt-1 h-4 w-4 accent-red-800"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">
                    {level.nombre}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {level.clave}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
