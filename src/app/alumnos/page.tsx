'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import {
  studentService,
  gradeService,
  userService,
} from '../services/schoolService';
import { useAuth } from '../hooks/useAuth';

type Teacher = {
  id: number;
  uuid: string;
  name: string;
  email?: string;
  role: string;
};

type Grade = {
  id: number;
  uuid: string;
  nombre: string;
  maestroId: number | string | null;
  maestro?: Teacher | null;
  Maestro?: Teacher | null;
};

type StudentUser = {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role: string;
};

type Student = {
  id: number;
  uuid: string;
  nombre: string;
  apellido: string;
  matricula: string;
  tutor: string;
  userId: number;
  gradoId: number | string | null;
  grado?: Grade | null;
  Grado?: Grade | null;
};

export default function StudentsPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'administrador';
  const isTeacher = user?.role === 'maestro';

  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [availableUsers, setAvailableUsers] = useState<StudentUser[]>([]);

  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);

  const [teacherUsers, setTeacherUsers] = useState<Teacher[]>([]);

  const itemsPerPage = 6;

  const loadData = async () => {
    try {
      setLoadingData(true);

      const [studentsResponse, gradesResponse, usersResponse] =
        await Promise.all([
          studentService.getAll(),
          gradeService.getAll(),
          userService.getAll(),
        ]);

      const studentsData: Student[] = Array.isArray(studentsResponse)
        ? studentsResponse
        : [];

      const gradesData: Grade[] = Array.isArray(gradesResponse)
        ? gradesResponse
        : [];

      const usersData: StudentUser[] = Array.isArray(usersResponse)
        ? usersResponse
        : [];

      setStudents(studentsData);
      setGrades(gradesData);

      setTeacherUsers(
        usersData.filter(
          (candidate) => candidate.role === 'maestro'
        )
      );

      // Usuarios con rol alumno que todavía no han sido vinculados.
      const unlinkedStudentUsers = usersData.filter(
        (candidate) =>
          candidate.role === 'alumno' &&
          !studentsData.some(
            (student) => Number(student.userId) === Number(candidate.id)
          )
      );

      setAvailableUsers(unlinkedStudentUsers);
    } catch (error) {
      console.error('Error cargando alumnos:', error);
      alert('No fue posible cargar la información de alumnos.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const teacherDirectory = useMemo(() => {
  const directory = new Map<number, Teacher>();

  teacherUsers.forEach((teacher) => {
    directory.set(Number(teacher.id), teacher);
  });

  grades.forEach((grade) => {
    const nestedTeacher =
      grade.maestro ?? grade.Maestro ?? null;

    if (nestedTeacher) {
      directory.set(
        Number(nestedTeacher.id),
        nestedTeacher
      );
    }
  });

  return directory;
}, [teacherUsers, grades]);

const normalizedGrades = useMemo<Grade[]>(() => {
  return grades.map((grade) => {
    const nestedTeacher =
      grade.maestro ?? grade.Maestro ?? null;

    const teacherId = Number(grade.maestroId);

    const resolvedTeacher =
      nestedTeacher ??
      (teacherId > 0
        ? teacherDirectory.get(teacherId) ?? null
        : null);

    return {
      ...grade,
      maestro: resolvedTeacher,
    };
  });
}, [grades, teacherDirectory]);

const gradeDirectory = useMemo(() => {
  return new Map<number, Grade>(
    normalizedGrades.map((grade) => [
      Number(grade.id),
      grade,
    ])
  );
}, [normalizedGrades]);

const normalizedStudents = useMemo<Student[]>(() => {
  return students.map((student) => {
    const nestedGrade =
      student.grado ?? student.Grado ?? null;

    const gradeId = Number(
      student.gradoId ?? nestedGrade?.id ?? 0
    );

    const resolvedGrade =
      gradeDirectory.get(gradeId) ??
      nestedGrade ??
      null;

    if (!resolvedGrade) {
      return {
        ...student,
        grado: null,
      };
    }

    const nestedTeacher =
      resolvedGrade.maestro ??
      resolvedGrade.Maestro ??
      null;

    const teacherId = Number(
      resolvedGrade.maestroId
    );

    const resolvedTeacher =
      nestedTeacher ??
      (teacherId > 0
        ? teacherDirectory.get(teacherId) ?? null
        : null);

    return {
      ...student,
      gradoId: student.gradoId ?? resolvedGrade.id,
      grado: {
        ...resolvedGrade,
        maestro: resolvedTeacher,
      },
    };
  });
}, [students, gradeDirectory, teacherDirectory]);

const assignableGrades = useMemo(() => {
  const gradesWithTeacher = normalizedGrades.filter(
    (grade) =>
      Boolean(grade.maestro) ||
      Number(grade.maestroId) > 0
  );

  if (!isTeacher) {
    return gradesWithTeacher;
  }

  return gradesWithTeacher.filter((grade) => {
    const sameId =
      Number(grade.maestroId) === Number(user?.id) ||
      Number(grade.maestro?.id) === Number(user?.id);

    const sameUuid =
      Boolean(user?.uuid) &&
      grade.maestro?.uuid === user?.uuid;

    return sameId || sameUuid;
  });
}, [normalizedGrades, isTeacher, user]);

const teachers = useMemo(() => {
  const teacherMap = new Map<number, Teacher>();

  normalizedGrades.forEach((grade) => {
    if (grade.maestro) {
      teacherMap.set(
        Number(grade.maestro.id),
        grade.maestro
      );
    }
  });

  return Array.from(teacherMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}, [normalizedGrades]);

const visibleStudents = useMemo(() => {
  if (!isTeacher) {
    return normalizedStudents;
  }

  return normalizedStudents.filter((student) => {
    const sameId =
      Number(student.grado?.maestroId) ===
        Number(user?.id) ||
      Number(student.grado?.maestro?.id) ===
        Number(user?.id);

    const sameUuid =
      Boolean(user?.uuid) &&
      student.grado?.maestro?.uuid === user?.uuid;

    return sameId || sameUuid;
  });
}, [normalizedStudents, isTeacher, user]);


  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return visibleStudents.filter((student) => {
      const fullName = `${student.nombre || ''} ${
        student.apellido || ''
      }`.toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        fullName.includes(normalizedSearch) ||
        student.matricula?.toLowerCase().includes(normalizedSearch) ||
        student.grado?.nombre?.toLowerCase().includes(normalizedSearch) ||
        student.grado?.maestro?.name
          ?.toLowerCase()
          .includes(normalizedSearch);

      const studentGradeId =
  student.gradoId ?? student.grado?.id;

const studentTeacherId =
  student.grado?.maestroId ??
  student.grado?.maestro?.id;

const matchesGrade =
  !gradeFilter ||
  String(studentGradeId) === gradeFilter;

const matchesTeacher =
  !teacherFilter ||
  String(studentTeacherId) === teacherFilter;

      return matchesSearch && matchesGrade && matchesTeacher;
    });
  }, [
    visibleStudents,
    search,
    gradeFilter,
    teacherFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / itemsPerPage)
  );

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, gradeFilter, teacherFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleOpenCreate = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const selectedUserId = String(formData.get('userId') || '');

    const selectedUser = availableUsers.find(
      (candidate) => String(candidate.id) === selectedUserId
    );

    const gradoId = Number(formData.get('gradoId'));

    const selectedGrade = assignableGrades.find(
      (grade) => Number(grade.id) === gradoId
    );

    if (!selectedGrade) {
      alert(
        'Selecciona un grupo que tenga un maestro responsable asignado.'
      );
      return;
    }

    const payload: Record<string, unknown> = {
      matricula: String(formData.get('matricula') || '').trim(),
      tutor: String(formData.get('tutor') || '').trim(),
      gradoId,
    };

    if (!editingStudent) {
      if (!selectedUser) {
        alert('Selecciona el usuario que será vinculado como alumno.');
        return;
      }

      const nameParts = selectedUser.name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      payload.nombre = nameParts[0] || selectedUser.name;
      payload.apellido = nameParts.slice(1).join(' ') || '';
      payload.userId = selectedUser.id;
      payload.email = selectedUser.email;
    }

    try {
      setSaving(true);

      if (editingStudent) {
        await studentService.update(editingStudent.uuid, payload);
        alert('Alumno actualizado correctamente.');
      } else {
        await studentService.create(payload);
        alert('Usuario vinculado como alumno correctamente.');
      }

      handleCloseModal();
      await loadData();
    } catch (error) {
      console.error('Error guardando alumno:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar el alumno.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (student: Student) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar a ${student.nombre} ${student.apellido}?`
    );

    if (!confirmed) return;

    try {
      setDeletingUuid(student.uuid);

      await studentService.delete(student.uuid);
      await loadData();

      alert('Alumno eliminado correctamente.');
    } catch (error) {
      console.error('Error eliminando alumno:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'No fue posible eliminar el alumno.'
      );
    } finally {
      setDeletingUuid(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setGradeFilter('');
    setTeacherFilter('');
    setCurrentPage(1);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Lista de alumnos
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {isTeacher
                  ? 'Alumnos pertenecientes a los grupos que tienes asignados.'
                  : 'Administra los alumnos, sus grupos y maestros responsables.'}
              </p>
            </div>

            {isAdmin && (
              <Button
                type="button"
                onClick={handleOpenCreate}
                className="bg-red-900 text-white hover:bg-red-800"
              >
                + Nuevo alumno
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total de alumnos
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {visibleStudents.length}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Grupos con alumnos
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              {
                new Set(
                  visibleStudents
                    .map(
                        (student) =>
                          student.gradoId ?? student.grado?.id
                      )
                    .filter(Boolean)
                ).size
              }
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Resultados encontrados
            </p>

            <p className="mt-2 text-3xl font-bold text-red-900">
              {filteredStudents.length}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Buscar alumno"
              placeholder="Nombre, matrícula, grupo o maestro..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <Select
              label="Filtrar por grupo"
              value={gradeFilter}
              onChange={(event) => setGradeFilter(event.target.value)}
              options={[
                {
                  label: 'Todos los grupos',
                  value: '',
                },
                ...assignableGrades.map((grade) => ({
                  label: grade.nombre,
                  value: String(grade.id),
                })),
              ]}
            />

            {!isTeacher && (
              <Select
                label="Filtrar por maestro"
                value={teacherFilter}
                onChange={(event) =>
                  setTeacherFilter(event.target.value)
                }
                options={[
                  {
                    label: 'Todos los maestros',
                    value: '',
                  },
                  ...teachers.map((teacher) => ({
                    label: teacher.name,
                    value: String(teacher.id),
                  })),
                ]}
              />
            )}
          </div>

          {(search || gradeFilter || teacherFilter) && (
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={clearFilters}
                className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          {loadingData ? (
            <div className="p-10 text-center text-gray-500">
              Cargando alumnos...
            </div>
          ) : currentData.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-gray-700">
                No se encontraron alumnos
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Intenta modificar la búsqueda o los filtros seleccionados.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table
                  columns={[
                    {
                      key: 'matricula',
                      header: 'Matrícula',
                    },
                    {
                      key: 'nombre',
                      header: 'Alumno',
                      render: (student: Student) =>
                        `${student.nombre} ${student.apellido}`,
                    },
                    {
                      key: 'grado',
                      header: 'Grupo',
                      render: (student: Student) =>
                        student.grado?.nombre || 'Sin grupo',
                    },
                    {
                      key: 'maestro',
                      header: 'Maestro responsable',
                      render: (student: Student) =>
                        student.grado?.maestro?.name || (
                          <span className="text-amber-700">
                            Sin maestro
                          </span>
                        ),
                    },
                    {
                      key: 'estado',
                      header: 'Estado',
                      render: (student: Student) =>
                        student.grado?.maestro ? (
                          <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Asignado
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            Sin asignar
                          </span>
                        ),
                    },
                    {
                      key: 'actions',
                      header: 'Acciones',
                      render: (student: Student) =>
                        isAdmin ? (
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              className="bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
                              onClick={() => handleOpenEdit(student)}
                            >
                              Editar
                            </Button>

                            <Button
                              type="button"
                              variant="danger"
                              disabled={deletingUuid === student.uuid}
                              className="bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                              onClick={() => handleDelete(student)}
                            >
                              {deletingUuid === student.uuid
                                ? 'Eliminando...'
                                : 'Eliminar'}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Solo lectura
                          </span>
                        ),
                    },
                  ]}
                  data={currentData}
                />
              </div>

              <div className="grid gap-4 p-4 md:hidden">
                {currentData.map((student) => (
                  <article
                    key={student.uuid}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {student.nombre} {student.apellido}
                        </h3>

                        <p className="text-sm text-gray-500">
                          Matrícula: {student.matricula}
                        </p>
                      </div>

                    {student.grado?.maestro ? (
  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
    Asignado
  </span>
) : (
  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
    Sin asignar
  </span>
)}
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <p>
                        <span className="font-semibold">Grupo:</span>{' '}
                        {student.grado?.nombre || 'Sin grupo'}
                      </p>

                      <p>
                        <span className="font-semibold">Maestro:</span>{' '}
                        {student.grado?.maestro?.name ||
                          'Sin maestro asignado'}
                      </p>

                      <p>
                        <span className="font-semibold">Tutor:</span>{' '}
                        {student.tutor}
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="mt-4 flex gap-2 border-t pt-4">
                        <Button
                          type="button"
                          className="flex-1 bg-blue-50 text-blue-700"
                          onClick={() => handleOpenEdit(student)}
                        >
                          Editar
                        </Button>

                        <Button
                          type="button"
                          variant="danger"
                          className="flex-1 bg-red-50 text-red-700"
                          disabled={deletingUuid === student.uuid}
                          onClick={() => handleDelete(student)}
                        >
                          {deletingUuid === student.uuid
                            ? 'Eliminando...'
                            : 'Eliminar'}
                        </Button>
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <div className="border-t border-gray-200 p-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={
          editingStudent
            ? 'Editar alumno'
            : 'Vincular nuevo alumno'
        }
      >
        <form
          key={editingStudent?.uuid || 'new-student'}
          onSubmit={handleSubmit}
          className="space-y-4 p-4"
        >
          {editingStudent && (
            <div className="rounded bg-gray-100 p-3 text-sm font-semibold text-gray-700">
              Alumno: {editingStudent.nombre}{' '}
              {editingStudent.apellido}
            </div>
          )}

          {!editingStudent && (
            <Select
              label="Seleccionar usuario"
              name="userId"
              required
              options={[
                {
                  label: 'Selecciona un usuario alumno',
                  value: '',
                },
                ...availableUsers.map((studentUser) => ({
                  label: `${studentUser.name} — ${studentUser.email}`,
                  value: String(studentUser.id),
                })),
              ]}
            />
          )}

          <Input
            label="Matrícula"
            name="matricula"
            defaultValue={editingStudent?.matricula || ''}
            required
          />

          <Input
            label="Tutor"
            name="tutor"
            defaultValue={editingStudent?.tutor || ''}
            required
          />

          <Select
            label="Grupo / grado"
            name="gradoId"
            required
            defaultValue={
              editingStudent?.gradoId
                ? String(editingStudent.gradoId)
                : ''
            }
            options={[
              {
                label: 'Selecciona un grupo',
                value: '',
              },
              ...assignableGrades.map((grade) => ({
                label: `${grade.nombre} — ${
                  grade.maestro?.name || 'Sin maestro'
                }`,
                value: String(grade.id),
              })),
            ]}
          />

          {assignableGrades.length === 0 && (
            <p className="rounded bg-amber-50 p-3 text-sm text-amber-700">
              No hay grupos disponibles con un maestro asignado. Primero
              asigna un maestro desde Gestión de Grupos.
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-red-900 text-white hover:bg-red-800"
            disabled={saving || assignableGrades.length === 0}
          >
            {saving
              ? 'Procesando...'
              : editingStudent
                ? 'Actualizar datos'
                : 'Vincular y guardar'}
          </Button>
        </form>
      </Modal>
    </AppLayout>
  );
}