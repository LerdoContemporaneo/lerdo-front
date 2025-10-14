import React from 'react';


type Column<T> = { key: string; header: string; render?: (row: T) => React.ReactNode };


export function Table<T>({ columns, data }: { columns: Column<T>[]; data: T[] }) {
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
{data.map((row, idx) => (
<tr key={idx} className="border-t hover:bg-gray-50">
{columns.map((c) => (
<td key={c.key} className="px-4 py-3 align-top">
{c.render ? c.render(row) : (row as any)[c.key]}
</td>
))}
</tr>
))}
</tbody>
</table>
</div>
);
}