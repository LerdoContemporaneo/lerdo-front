// export type ID = string;


// export interface Teacher {
// id: ID;
// firstName: string;
// lastName: string;
// email: string;
// hiredAt?: string; // ISO date
// }


// export interface TeacherAttendanceRecord {
// id: ID;
// teacherId: ID;
// date: string; // ISO
// status: 'present' | 'late' | 'absent';
// note?: string;
// }


// export interface Student {
// id: ID;
// firstName: string;
// lastName: string;
// grade: string;
// }


// export interface StudentAttendanceRecord {
// id: ID;
// studentId: ID;
// teacherId?: ID; // who registered
// date: string;
// status: 'present' | 'late' | 'absent';
// subject?: string;
// }


// export interface Task {
// id: ID;
// title: string;
// description?: string;
// dueDate?: string;
// assignedBy?: ID; // teacher
// status: 'pending' | 'submitted' | 'graded';
// }


// export interface Incident {
// id: ID;
// studentId: ID;
// teacherId?: ID;
// date: string;
// severity: 'low' | 'medium' | 'high';
// description: string;
// }