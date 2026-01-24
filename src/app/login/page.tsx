// src/app/page.tsx
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth'; 
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Image from 'next/image'; // Importamos Image de Next.js para el logo

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);

    if (success) {
      // Redirección simple por ahora, ya que no hay backend real activo
      if (email.includes('admin')) {
         router.push('/admin');
      } else {
         router.push('/teachers');
      }
    } else {
      setError('Credenciales incorrectas. ¿Quizás Mapi escondió tu contraseña? 🦝');
    }
    setLoading(false);
  }

  return (
    // FONDO: Usamos un degradado rojo oscuro (red-900 a red-800) para dar identidad
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-900 to-red-800 px-4">
      
      {/* Contenedor del Logo y Título */}
      <div className="mb-8 text-center">
        {/* Asegúrate de poner tu logo en la carpeta public como 'logo.png' */}
        <div className="bg-white p-3 rounded-full inline-block shadow-lg mb-4">
            {/* Si aún no tienes la imagen, esto mostrará un cuadro gris, pero está listo para tu logo */}
            <Image src="/logo.png" alt="Logo CELC" width={80} height={80} className="object-contain" />
            {/* <span className="text-4xl">🎓</span>  */}
        </div>
        <h1 className="text-3xl font-bold text-white tracking-wide">
          Lerdo Contemporáneo
        </h1>
        <p className="text-red-100 mt-2 text-sm font-light">
          Portal Escolar
        </p>
      </div>

      {/* Tarjeta de Login */}
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-red-600">
        <div className="flex justify-center mb-6">
            <span className="text-5xl" title="Mapi te saluda">🦝</span>
        </div>
        
        <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">
          Bienvenido de nuevo
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            label="Correo Institucional" 
            type="email"
            placeholder="usuario@lerdocontemporaneo.edu.mx"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
            // Aquí podrías pasar clases extra a tu Input si soporta className
            className="focus-within:ring-red-500" 
          />
          <Input 
            label="Contraseña" 
            type="password" 
            placeholder="••••••••"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
          />
          
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-100 flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-900 hover:bg-red-800 text-white py-3 rounded-lg font-bold transition-all transform active:scale-95 shadow-md"
          >
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="mt-6 text-center">
            <a href="#" className="text-sm text-red-800 hover:text-red-600 font-medium">
                ¿Olvidaste tu contraseña?
            </a>
        </div>
      </div>

      <footer className="mt-8 text-red-200 text-xs">
        © {new Date().getFullYear()} Centro de Estudios Lerdo Contemporáneo
      </footer>
    </div>
  );
}