'use client';

import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import {
  studentService,
  gradeService,
  attendanceService,
  type AttendanceStatus,
} from '../services/schoolService';
import { useAuth } from '../hooks/useAuth';

type Teacher = {
  uuid?: string;
  email?: string;
};

type Grade = {
  id: number;
  uuid?: string;
  nombre: string;
  maestroId?: number | null;
  maestro?: Teacher | null;
};

type Student = {
  id: number;
  uuid?: string;
  matricula: string;
  nombre: string;
  apellido: string;
  gradoId?: number | null;
  grado?: Grade | null;
};

const isAttendanceStatus = (
  value: FormDataEntryValue | null
): value is AttendanceStatus => {
  return (
    typeof value === 'string' &&
    ['Presente', 'Ausente', 'Tarde', 'Justificado'].includes(
      value as AttendanceStatus
    )
  );
};

export default function MyGroupPage() {
  const { user } = useAuth();

  const [myStudents, setMyStudents] = useState<Student[]>([]);
  const [myGroupName, setMyGroupName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadMyGroup = async () => {
      setLoadingStudents(true);
      setError('');

      try {
        const [gradesResult, studentsResult] = await Promise.all([
          gradeService.getAll(),
          studentService.getAll(),
        ]);

        const allGrades: Grade[] = Array.isArray(gradesResult)
          ? gradesResult
          : [];

        const allStudents: Student[] = Array.isArray(studentsResult)
          ? studentsResult
          : [];

        if (user.role === 'administrador') {
          setMyStudents(allStudents);
          setMyGroupName('Todos los alumnos (Vista Admin)');
          return;
        }

        const teacherGrades = allGrades.filter((grade) => {
          const sameId =
            user.id != null &&
            grade.maestroId != null &&
            Number(grade.maestroId) === Number(user.id);

          const sameUuid =
            Boolean(user.uuid) &&
            grade.maestro?.uuid === user.uuid;

          const sameEmail =
            Boolean(user.email) &&
            grade.maestro?.email === user.email;

          return sameId || sameUuid || sameEmail;
        });

        const teacherGradeIds = new Set(
          teacherGrades.map((grade) => Number(grade.id))
        );

        const teacherGradeUuids = new Set(
          teacherGrades
            .map((grade) => grade.uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        );

        const filteredStudents = allStudents.filter((student) => {
          const gradeId =
            student.gradoId ?? student.grado?.id;

          const gradeUuid = student.grado?.uuid;

          return (
            (gradeId != null &&
              teacherGradeIds.has(Number(gradeId))) ||
            (Boolean(gradeUuid) &&
              teacherGradeUuids.has(gradeUuid as string))
          );
        });

        setMyStudents(filteredStudents);

        setMyGroupName(
          teacherGrades.length > 0
            ? teacherGrades
                .map((grade) => grade.nombre)
                .join(', ')
            : 'Sin grupo asignado'
        );
      } catch (loadError) {
        console.error('Error al cargar el grupo:', loadError);
        setMyStudents([]);
        setMyGroupName('Sin información');
        setError('No fue posible cargar los alumnos del grupo.');
      } finally {
        setLoadingStudents(false);
      }
    };

    void loadMyGroup();
  }, [user]);

  const openAttendanceModal = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setError('');
  };

  const closeAttendanceModal = () => {
    if (savingAttendance) {
      return;
    }

    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleAttendance = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const alumnoId = Number(formData.get('alumnoId'));
    const estado = formData.get('estado');

    if (!Number.isInteger(alumnoId) || alumnoId <= 0) {
      setError('El alumno seleccionado no es válido.');
      return;
    }

    if (!isAttendanceStatus(estado)) {
      setError('Selecciona un estado de asistencia válido.');
      return;
    }

    setSavingAttendance(true);
    setError('');

    try {
      await attendanceService.createStudent(
        alumnoId,
        estado
      );

      alert('Asistencia guardada correctamente.');
      setIsModalOpen(false);
      setSelectedStudent(null);
    } catch (attendanceError) {
      console.error(
        'Error al guardar la asistencia:',
        attendanceError
      );

      const message =
        attendanceError instanceof Error
          ? attendanceError.message
          : 'No fue posible guardar la asistencia.';

      setError(message);
    } finally {
      setSavingAttendance(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-blue-800">
            Panel Docente: {myGroupName}
          </h2>

          <p className="text-sm text-gray-500">
            Gestione la asistencia de sus alumnos aquí.
          </p>
        </div>

        {error && !isModalOpen && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loadingStudents ? (
          <p className="py-8 text-center text-gray-500">
            Cargando alumnos...
          </p>
        ) : myStudents.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            No hay alumnos disponibles en el grupo.
          </p>
        ) : (
          <Table
            columns={[
              {
                key: 'matricula',
                header: 'Matrícula',
              },
              {
                key: 'nombre',
                header: 'Nombre',
                render: (student: Student) =>
                  `${student.nombre} ${student.apellido}`,
              },
              {
                key: 'grado',
                header: 'Grupo',
                render: (student: Student) =>
                  student.grado?.nombre ?? '-',
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (student: Student) => (
                  <Button
                    onClick={() =>
                      openAttendanceModal(student)
                    }
                    className="text-xs"
                  >
                    Pasar lista
                  </Button>
                ),
              },
            ]}
            data={myStudents}
          />
        )}
      </div>

      <Modal
        open={isModalOpen}
        onClose={closeAttendanceModal}
        title={`Asistencia: ${
          selectedStudent
            ? `${selectedStudent.nombre} ${selectedStudent.apellido}`
            : ''
        }`}
      >
        <form
          onSubmit={handleAttendance}
          className="space-y-4 p-4"
        >
          <input
            type="hidden"
            name="alumnoId"
            value={selectedStudent?.id ?? ''}
          />

          <Select
            label="Estado"
            name="estado"
            required
            options={[
              {
                label: 'Presente',
                value: 'Presente',
              },
              {
                label: 'Ausente',
                value: 'Ausente',
              },
              {
                label: 'Tarde',
                value: 'Tarde',
              },
              {
                label: 'Justificado',
                value: 'Justificado',
              },
            ]}
          />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              savingAttendance || !selectedStudent
            }
          >
            {savingAttendance
              ? 'Guardando...'
              : 'Guardar'}
          </Button>
        </form>
      </Modal>
    </AppLayout>
  );
}