import React from 'react';
import { Card } from './components/ui/card';
import { TeacherAttendanceRecord } from './types/index';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';


// Mock metrics - replace with apiGet in future
const mockTeachersPresent = 12;
const mockTeachersLate = 2;
const mockStudentsPresent = 512;
const mockStudentsLate = 15;
const mockStudentsAbsent = 24;
// const mockTeachersAttendance: TeacherAttendanceRecord[] = [
//   { id: '1', teacherId: 't1', date: new Date().toISOString(), status: 'present', note: '' },
//   { id: '2', teacherId: 't2', date: new Date().toISOString(), status: 'late', note: 'Tráfico' },
//   // Más registros...
// ];
// const mockStudentsAttendance = [
//   // Registros de asistencia de estudiantes...
// ];
// const mockTasks = [
//   // Tareas asignadas...
// ];
const mockIncidents = 5; // Número de incidentes reportados



export default function HomePage() {
  return (
    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
        <AppLayout> {/* <-- Envolver el contenido con el AppLayout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="Docentes presentes">
                    <div className="text-3xl font-semibold">{mockTeachersPresent}</div>
                </Card>
                <Card title="Docentes tarde">
                    <div className="text-3xl font-semibold">{mockTeachersLate}</div>
                </Card>
                <Card title="Alumnos presentes">
                    <div className="text-3xl font-semibold">{mockStudentsPresent}</div>
                </Card>
                <Card title="Alumnos tarde">
                    <div className="text-3xl font-semibold">{mockStudentsLate}</div>
                </Card>
                <Card title="Incidentes reportados">
                    <div className="text-3xl font-semibold">{mockIncidents}</div>
                </Card>
                <Card title="Alumnos ausentes">
                    <div className="text-3xl font-semibold">{mockStudentsAbsent}</div>
                </Card>

            </div>
        </AppLayout>
    </ProtectedRoute>
  );
}