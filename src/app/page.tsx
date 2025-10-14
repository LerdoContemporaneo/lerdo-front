import React from 'react';
import { Card } from './components/ui/card.tsx';
import { TeacherAttendanceRecord } from './types/index.ts';


// Mock metrics - replace with apiGet in future
const mockTeachersPresent = 12;
const mockTeachersLate = 2;
const mockStudentsPresent = 320;


export default function HomePage() {
return (
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
</div>
);
}