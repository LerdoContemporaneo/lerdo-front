import React from 'react';


export function Card({ title, children }: { title?: string; children?: React.ReactNode }) {
return (
<div className="bg-white rounded-lg shadow p-4">
{title && <h3 className="text-sm text-gray-500">{title}</h3>}
<div className="mt-2">{children}</div>
</div>
);
}