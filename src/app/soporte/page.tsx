'use client';
import React from 'react';
import AppLayout from '../components/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';

export default function SoportePage() {
  // 👇 AQUÍ PONES TU NÚMERO PERSONAL (Con código de país, ej. 52 para México)
  const ContactoSoporte = process.env.NEXT_PUBLIC_API_NUMBER_SUPPORT;
  
  // Mensaje predefinido que aparecerá en su caja de texto
  const mensajePredeterminado = encodeURIComponent(
    "Hola, te contacto desde el Portal CELC. Quiero reportar lo siguiente: "
  );
  
  const enlaceWhatsApp = `https://wa.me/${ContactoSoporte}?text=${mensajePredeterminado}`;

  return (
    <ProtectedRoute allowedRoles={['administrador', 'maestro']}>
      <AppLayout>
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center space-y-6">
            
            <div className="text-6xl mb-4">💬🦝</div>
            
            <h1 className="text-3xl font-bold text-red-900">Soporte Técnico</h1>
            
            <p className="text-gray-600">
              ¿Encontraste algún error en la plataforma, tienes alguna sugerencia o necesitas ayuda con tu cuenta? 
              Mánda un mensaje directo y lo revisaremos lo antes posible.
            </p>

            <div className="pt-6">
              <a 
                href={enlaceWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-transform transform hover:scale-105 shadow-md"
              >
                <span>Enviar mensaje por WhatsApp</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.116 1.546 5.862L.156 23.844l6.155-1.353C8.016 23.493 9.96 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.986c-1.848 0-3.61-.482-5.183-1.396l-.372-.216-3.848.846.865-3.69-.24-.393A9.957 9.957 0 012.014 12C2.014 6.486 6.486 2.014 12 2.014 17.514 2.014 22 6.486 22 12s-4.486 9.986-10 9.986z"/>
                </svg>
              </a>
            </div>
            
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}