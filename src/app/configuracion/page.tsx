'use client';
import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Estados del formulario
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert("Las contraseñas nuevas no coinciden ❌");
      return;
    }

    setLoading(true);
    try {
      // AQUÍ IRÁ LA LLAMADA AL BACKEND EN EL FUTURO
      // await userService.updatePassword(user.uuid, { currentPassword, newPassword });
      
      console.log("Simulando cambio de contraseña para:", user?.uuid);
      alert("Contraseña actualizada con éxito ✅ (Simulado)");
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      alert("Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto py-8 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          
          <div className="mb-8 border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-800">Seguridad de la Cuenta</h1>
            <p className="text-sm text-gray-500 mt-1">
              Actualiza tu contraseña para mantener tu cuenta segura.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              label="Contraseña Actual" 
              type="password" 
              required 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Ingresa tu contraseña actual"
            />
            
            <div className="pt-4 border-t border-gray-100">
              <Input 
                label="Nueva Contraseña" 
                type="password" 
                required 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            
            <Input 
              label="Confirmar Nueva Contraseña" 
              type="password" 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Vuelve a escribir la nueva contraseña"
            />

            <Button 
              type="submit" 
              className="w-full bg-red-900 hover:bg-red-800 text-white font-bold py-3 mt-4"
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </Button>
          </form>

        </div>
      </div>
    </AppLayout>
  );
}