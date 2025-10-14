

import React from 'react';


export default function Modal({ open, onClose, title, children }: { open: boolean; onClose(): void; title?: string; children?: React.ReactNode }) {
if (!open) return null;
return (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
<div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-4">
<div className="flex justify-between items-center mb-4">
<h3 className="text-lg font-medium">{title}</h3>
<button onClick={onClose} className="text-gray-500">Cerrar</button>
</div>
<div>{children}</div>
</div>
</div>
);
}