

import React from 'react';
import Link from 'next/link';


export default function Layout({ children }: { children: React.ReactNode }) {
return (
<div className="min-h-screen bg-gray-100">
<header className="bg-white shadow-sm">
<div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
<div className="flex items-center gap-3">
<h1 className="text-xl font-semibold">Gestión Escolar</h1>
<span className="text-sm text-gray-500">Frontend · Next.js · TypeScript</span>
</div>
<nav className="flex items-center gap-3">
<Link href="/" className="text-sm">Dashboard</Link>
<Link href="/admin" className="text-sm">Administración</Link>
<Link href="/teachers" className="text-sm">Maestros</Link>
</nav>
</div>
</header>
<main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
</div>
);
}