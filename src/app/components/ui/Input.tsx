import React from 'react';


type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label?: string };


export function Input({ label, className = '', ...rest }: InputProps) {
return (
<div className={`flex flex-col gap-1 ${className}`}>
{label && <label className="text-sm text-gray-700">{label}</label>}
<input className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" {...rest} />
</div>
);
}