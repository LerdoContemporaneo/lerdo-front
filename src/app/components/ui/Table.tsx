import React from 'react';

type Column<T> = { key: string; header: string; render?: (row: T) => React.ReactNode };

export function Table<T>({ columns, data = [] }: { columns: Column<T>[]; data: T[] }) {
  // Si data no es un array, lo convertimos en uno vacío para que no explote
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="overflow-x-auto bg-white rounded-md shadow-sm border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 font-medium text-gray-600">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeData.length > 0 ? (
            safeData.map((row, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 align-top">
                    {c.render ? c.render(row) : (row as any)[c.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                No se encontraron registros.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}