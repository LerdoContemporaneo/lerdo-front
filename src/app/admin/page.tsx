'use client';
import React, { useState } from 'react';
import { Teacher, TeacherAttendanceRecord } from '../types/index';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ProtectedRoute from '../components/ProtectedRoute';
import AppLayout from '../components/AppLayout';

const mockTeachers: Teacher[] = [
{ id: 't1', firstName: 'Ana', lastName: 'Pérez', email: 'ana@escuela.test' },
{ id: 't2', firstName: 'Luis', lastName: 'Ramírez', email: 'luis@escuela.test' },
];


function AdminContent() {
const [open, setOpen] = useState(false);
const [records, setRecords] = useState<TeacherAttendanceRecord[]>([]);


function addRecord(data: Partial<TeacherAttendanceRecord>) {
const record: TeacherAttendanceRecord = {
id: String(Date.now()),
teacherId: data.teacherId || mockTeachers[0].id,
date: data.date || new Date().toISOString(),
status: (data.status as any) || 'present',
note: data.note || '',
};
setRecords((s) => [record, ...s]);
setOpen(false);
}



const columns = [
{ key: 'teacher', header: 'Docente', render: (r: any) => mockTeachers.find((t) => t.id === r.teacherId)?.firstName + ' ' + mockTeachers.find((t) => t.id === r.teacherId)?.lastName },
{ key: 'date', header: 'Fecha', render: (r: any) => new Date(r.date).toLocaleString() },
{ key: 'status', header: 'Estado' },
{ key: 'note', header: 'Nota' },
];


// return (
// <div className="space-y-4">
// <div className="flex items-center justify-between">
// <h2 className="text-xl font-semibold">Módulo Administrativo</h2>
// <div className="flex items-center gap-2">
// <Button onClick={() => setOpen(true)}>Registrar puntualidad</Button>
// </div>
// </div>

  return (
    <div className="space-y-4">
      {/* ... todo el contenido del módulo administrativo ... */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Módulo Administrativo</h2>
        <div className="flex items-center gap-2">
          <Button onClick={() => setOpen(true)}>Registrar puntualidad</Button>
        </div>
      </div>
      <Table columns={columns} data={records as any} />
      <Modal open={open} onClose={() => setOpen(false)} title="Registrar puntualidad">
        <AttendanceForm teachers={mockTeachers} onSubmit={(d) => addRecord(d)} />
      </Modal>
    </div>
  );
}

// Este es el componente que se exporta por defecto
export default function AdminPageWrapper() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      {/* Usamos el AppLayout que incluye el Navbar */}
      <AppLayout>
        <AdminContent /> 
      </AppLayout>
    </ProtectedRoute>
  );
}


{/* <Table columns={columns} data={records as any} />


<Modal open={open} onClose={() => setOpen(false)} title="Registrar puntualidad">
<AttendanceForm teachers={mockTeachers} onSubmit={(d) => addRecord(d)} />
</Modal>
</div>
);
} */}

function AttendanceForm({ teachers, onSubmit }: { teachers: Teacher[]; onSubmit: (d: Partial<TeacherAttendanceRecord>) => void }) {
const [teacherId, setTeacherId] = useState<string>(teachers[0]?.id ?? '');
const [status, setStatus] = useState<'present' | 'late' | 'absent'>('present');
const [note, setNote] = useState('');


return (
<form
onSubmit={(e) => {
e.preventDefault();
onSubmit({ teacherId, status, note, date: new Date().toISOString() });
}}
className="space-y-3"
>
<div>
<label className="text-sm text-gray-700">Docente</label>
<select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="w-full px-3 py-2 border rounded-md">
{teachers.map((t) => (
<option key={t.id} value={t.id}>
{t.firstName} {t.lastName}
</option>
))}
</select>
</div>
<div>
<label className="text-sm text-gray-700">Estado</label>
<select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-3 py-2 border rounded-md">
<option value="Presente">Presente</option>
<option value="Tarde">Tarde</option>
<option value="Ausente">Ausente</option>
</select>
</div>
<div>
<label className="text-sm text-gray-700">Nota</label>
<textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
</div>
<div className="flex justify-end">
<Button type="submit">Guardar</Button>
</div>
</form>
);
}