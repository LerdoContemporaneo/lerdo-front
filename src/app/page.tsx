'use client';
import React, { useEffect, useState } from 'react';
import { Card } from './components/ui/card';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import { userService, studentService } from './services/schoolService';

export default function HomePage() {
  const [counts, setCounts] = useState({ maestros: 0, alumnos: 0, admins: 0 });

  useEffect(() => {
    const loadCounts = async () => {
      const [users, students] = await Promise.all([
        userService.getAll(),
        studentService.getAll()
      ]);
      
      setCounts({
        maestros: users.filter((u: any) => u.role === 'maestro').length,
        admins: users.filter((u: any) => u.role === 'administrador').length,
        alumnos: students.length
      });
    };
    loadCounts();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['maestro', 'administrador']}>
      <AppLayout>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Docentes Activos"><div className="text-3xl font-bold">{counts.maestros}</div></Card>
          <Card title="Alumnos en Sistema"><div className="text-3xl font-bold text-green-600">{counts.alumnos}</div></Card>
          <Card title="Administradores"><div className="text-3xl font-bold text-purple-600">{counts.admins}</div></Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}