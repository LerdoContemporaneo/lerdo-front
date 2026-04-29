// app/components/ui/Toast.tsx
'use client';
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    // La alerta desaparece sola después de 3 segundos
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  const bgColors = type === 'success' ? 'bg-green-600' : 'bg-red-600';

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-xl text-white font-medium flex items-center gap-3 animate-fade-in-up ${bgColors}`}>
      {type === 'success' ? '✅' : '❌'}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white/80 hover:text-white">
        ✖
      </button>
    </div>
  );
}