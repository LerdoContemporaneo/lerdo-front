import React from 'react';


type Option = { label: string; value: string };


export function Select({ label, options = [], ...rest }: { label?: string; options?: Option[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
return (
<div className="flex flex-col gap-1">
{label && <label className="text-sm text-gray-700">{label}</label>}
<select className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" {...rest}>
{options.map((o) => (
<option key={o.value} value={o.value}>
{o.label}
</option>
))}
</select>
</div>
);
}