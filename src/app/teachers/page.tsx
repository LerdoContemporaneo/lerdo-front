'use client';
import React, { useState } from 'react';
import { Student, StudentAttendanceRecord, Task, Incident } from '../types/index';
import { Table } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ProtectedRoute from '../components/ProtectedRoute';
import AppLayout from '../components/AppLayout';

const mockStudents: Student[] = [
{ id: 's1', firstName: 'Carlos', lastName: 'Gómez', grade: '3A' },
{ id: 's2', firstName: 'María', lastName: 'López', grade: '2B' },
];

function TeachersContent() {
const [attendance, setAttendance] = useState<StudentAttendanceRecord[]>([]);
const [openAttend, setOpenAttend] = useState(false);
const [openTask, setOpenTask] = useState(false);
const [openIncident, setOpenIncident] = useState(false);

return (
<div className="space-y-4">
<div className="flex items-center justify-between">
<h2 className="text-xl font-semibold">Módulo Maestros</h2>
<div className="flex items-center gap-2">
<Button onClick={() => setOpenAttend(true)}>Registrar Asistencia</Button>
<Button onClick={() => setOpenTask(true)} variant="ghost">Tareas</Button>
<Button onClick={() => setOpenIncident(true)} variant="danger">Incidencia</Button>
</div>
</div>


<Table
columns={[
{ key: 'student', header: 'Alumno', render: (r: any) => mockStudents.find((s) => s.id === r.studentId)?.firstName + ' ' + mockStudents.find((s) => s.id === r.studentId)?.lastName },
{ key: 'date', header: 'Fecha', render: (r: any) => new Date(r.date).toLocaleString() },
{ key: 'status', header: 'Estado' },
{ key: 'subject', header: 'Asignatura' },
]}
data={attendance as any}
/>


<Modal open={openAttend} onClose={() => setOpenAttend(false)} title="Registrar Asistencia">
<StudentAttendanceForm students={mockStudents} onSubmit={(d) => setAttendance((s) => [d as StudentAttendanceRecord, ...s])} />
</Modal>


<Modal open={openTask} onClose={() => setOpenTask(false)} title="Crear Tarea">
<TaskForm onCreate={(t) => console.log('Tarea creada', t)} />
</Modal>


<Modal open={openIncident} onClose={() => setOpenIncident(false)} title="Reporte de incidencia">
<IncidentForm students={mockStudents} onCreate={(i) => console.log('Incidencia', i)} />
</Modal>
</div>
);
}

// Este es el componente que se exporta por defecto
export default function TeachersPageWrapper() {
  return (
    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
      {/* Usamos el AppLayout que incluye el Navbar */}
      <AppLayout>
        <TeachersContent /> 
      </AppLayout>
    </ProtectedRoute>
  );
}

function StudentAttendanceForm({ students, onSubmit }: { students: Student[]; onSubmit: (d: Partial<StudentAttendanceRecord>) => void }) {
const [studentId, setStudentId] = useState(students[0]?.id ?? '');
const [status, setStatus] = useState<'present' | 'late' | 'absent'>('present');
const [subject, setSubject] = useState('Matemáticas');


return (
<form
onSubmit={(e) => {
e.preventDefault();
onSubmit({ id: String(Date.now()), studentId, date: new Date().toISOString(), status, subject });
}}
className="space-y-3"
>
<div>
<label className="text-sm text-gray-700">Alumno</label>
<select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full px-3 py-2 border rounded-md">
{students.map((s) => (
<option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.grade}</option>
))}
</select>
</div>
<div>
<label className="text-sm text-gray-700">Estado</label>
<select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-3 py-2 border rounded-md">
<option value="present">Presente</option>
<option value="late">Tarde</option>
<option value="absent">Ausente</option>
</select>
</div>
<div>
<label className="text-sm text-gray-700">Asignatura</label>
<input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
</div>
<div className="flex justify-end">
<Button type="submit">Registrar</Button>
</div>
</form>
);
}

function TaskForm({ onCreate }: { onCreate: (t: Task) => void }) {
const [title, setTitle] = useState('');
const [dueDate, setDueDate] = useState('');


function submit(e: React.FormEvent) {
e.preventDefault();
const t: Task = { id: String(Date.now()), title, dueDate: dueDate || undefined, status: 'pending' };
onCreate(t);
}


return (
<form onSubmit={submit} className="space-y-3">
<div>
<label className="text-sm text-gray-700">Título</label>
<input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
</div>
<div>
<label className="text-sm text-gray-700">Fecha de entrega</label>
<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
</div>
<div className="flex justify-end">
<Button type="submit">Crear</Button>
</div>
</form>
);
}

function IncidentForm({ students, onCreate }: { students: Student[]; onCreate: (i: Incident) => void }) {
const [studentId, setStudentId] = useState(students[0]?.id ?? '');
const [description, setDescription] = useState('');
const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('low');


function submit(e: React.FormEvent) {
e.preventDefault();
const i: Incident = { id: String(Date.now()), studentId, date: new Date().toISOString(), severity, description };
onCreate(i);
}


return (
<form onSubmit={submit} className="space-y-3">
<div>
<label className="text-sm text-gray-700">Alumno</label>
<select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full px-3 py-2 border rounded-md">
{students.map((s) => (
<option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
))}
</select>
</div>
<div>
<label className="text-sm text-gray-700">Severidad</label>
<select value={severity} onChange={(e) => setSeverity(e.target.value as any)} className="w-full px-3 py-2 border rounded-md">
<option value="low">Baja</option>
<option value="medium">Media</option>
<option value="high">Alta</option>
</select>
</div>
<div>
<label className="text-sm text-gray-700">Descripción</label>
<textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
</div>
<div className="flex justify-end">
<Button type="submit" variant="danger">Reportar</Button>
</div>
</form>
);
}