'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';


export default function LoginPage() {
const { login } = useAuth();
const router = useRouter();
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');

async function handleSubmit(e: React.FormEvent) {
e.preventDefault();
const ok = await login(username, password);
if (ok) {
if (username === 'admin') router.push('/admin');
else router.push('/teachers');
} else {
setError('Credenciales incorrectas');
}
}
return (
<div className="min-h-screen flex items-center justify-center bg-gray-100">
<div className="bg-white p-6 rounded-lg shadow w-full max-w-sm">
<h1 className="text-2xl font-semibold mb-4 text-center">Iniciar Sesión</h1>
<form onSubmit={handleSubmit} className="space-y-4">
<Input label="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
<Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
{error && <p className="text-sm text-red-600">{error}</p>}
<Button type="submit" className="w-full">Entrar</Button>
</form>
<div className="text-xs text-gray-500 mt-4 text-center">
{/* <p>Admin → admin / admin123</p>
<p>Maestro → maestro / maestro123</p> */}
</div>
</div>
</div>
);
}