'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Swal from 'sweetalert2';

import AppLayout from '../components/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { Select } from '../components/ui/Select';
import { useAuth } from '../hooks/useAuth';
import {
  academicResourceService,
  gradeService,
  subjectService,
  userService,
  type AcademicGroup,
  type AcademicResource,
  type AcademicResourcePayload,
  type AcademicTeacher,
  type EducationalLevel,
  type Subject,
  type SubjectPayload,
} from '../services/schoolService';

type Teacher = AcademicTeacher & {
  role: string;
  niveles?: EducationalLevel[];
};

type SubjectFormState = {
  nombre: string;
  gradoId: string;
  maestroId: string;
};

type ResourceFormState = {
  titulo: string;
  descripcion: string;
  tipo: 'enlace' | 'pdf';
  gradoId: string;
  materiaId: string;
  enlace: string;
  archivo: File | null;
};

const EMPTY_SUBJECT_FORM: SubjectFormState = {
  nombre: '',
  gradoId: '',
  maestroId: '',
};

const EMPTY_RESOURCE_FORM: ResourceFormState = {
  titulo: '',
  descripcion: '',
  tipo: 'enlace',
  gradoId: '',
  materiaId: '',
  enlace: '',
  archivo: null,
};

const PAGE_SIZE = 9;
const MAX_PDF_BYTES = 8 * 1024 * 1024;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatBytes = (value?: number | null) => {
  if (!value) return 'PDF';
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('No fue posible leer el archivo'));
    };
    reader.onerror = () => reject(new Error('No fue posible leer el archivo'));
    reader.readAsDataURL(file);
  });

const uniqueGroupsFromSubjects = (subjects: Subject[]) => {
  const groups = new Map<number, AcademicGroup>();

  subjects.forEach((subject) => {
    if (subject.grado) groups.set(subject.grado.id, subject.grado);
  });

  return [...groups.values()].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es')
  );
};

export default function AcademicResourcesPage() {
  const { user } = useAuth();
  const canManage =
    user?.role === 'administrador' || user?.role === 'coordinador';

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingUuid, setDownloadingUuid] = useState<string | null>(
    null
  );

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState<SubjectFormState>(
    EMPTY_SUBJECT_FORM
  );

  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] =
    useState<AcademicResource | null>(null);
  const [resourceForm, setResourceForm] = useState<ResourceFormState>(
    EMPTY_RESOURCE_FORM
  );

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('todos');
  const [subjectFilter, setSubjectFilter] = useState('todas');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const [subjectData, resourceData] = await Promise.all([
        subjectService.getAll(),
        academicResourceService.getAll(),
      ]);

      setSubjects(subjectData);
      setResources(resourceData);

      if (canManage) {
        const [groupData, userData] = await Promise.all([
          gradeService.getAll(),
          userService.getAll(),
        ]);

        setGroups(groupData as AcademicGroup[]);
        setTeachers(
          (userData as Teacher[]).filter((item) => item.role === 'maestro')
        );
      } else {
        setGroups(uniqueGroupsFromSubjects(subjectData));
        setTeachers([]);
      }
    } catch (error) {
      console.error('Error cargando recursos academicos:', error);
      await Swal.fire({
        icon: 'error',
        title: 'No fue posible cargar los recursos',
        text: getErrorMessage(
          error,
          'Verifica la conexion con el servidor.'
        ),
      });
    } finally {
      setLoading(false);
    }
  }, [canManage, user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedSubjectGroup = useMemo(
    () =>
      groups.find(
        (group) => String(group.id) === subjectForm.gradoId
      ) ?? null,
    [groups, subjectForm.gradoId]
  );

  const teachersForSelectedGroup = useMemo(() => {
    if (!selectedSubjectGroup?.nivelId) return [];

    return teachers.filter((teacher) =>
      teacher.niveles?.some(
        (level) => Number(level.id) === Number(selectedSubjectGroup.nivelId)
      )
    );
  }, [selectedSubjectGroup, teachers]);

  const subjectsForResourceGroup = useMemo(
    () =>
      subjects.filter(
        (subject) => String(subject.gradoId) === resourceForm.gradoId
      ),
    [subjects, resourceForm.gradoId]
  );

  const selectedResourceSubject = useMemo(
    () =>
      subjects.find(
        (subject) => String(subject.id) === resourceForm.materiaId
      ) ?? null,
    [subjects, resourceForm.materiaId]
  );

  const filteredResources = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const subject = resource.materia;
      const group = subject?.grado;
      const teacher = subject?.maestro;
      const matchesSearch =
        !normalized ||
        resource.titulo.toLowerCase().includes(normalized) ||
        (resource.descripcion || '').toLowerCase().includes(normalized) ||
        (subject?.nombre || '').toLowerCase().includes(normalized) ||
        (group?.nombre || '').toLowerCase().includes(normalized) ||
        (teacher?.name || '').toLowerCase().includes(normalized);
      const matchesGroup =
        groupFilter === 'todos' || String(group?.id) === groupFilter;
      const matchesSubject =
        subjectFilter === 'todas' ||
        String(resource.materiaId) === subjectFilter;
      const matchesType =
        typeFilter === 'todos' || resource.tipo === typeFilter;

      return matchesSearch && matchesGroup && matchesSubject && matchesType;
    });
  }, [resources, search, groupFilter, subjectFilter, typeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, groupFilter, subjectFilter, typeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredResources.length / PAGE_SIZE)
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const visibleResources = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredResources.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredResources]);

  const metrics = useMemo(
    () => ({
      resources: resources.length,
      pdfs: resources.filter((resource) => resource.tipo === 'pdf').length,
      links: resources.filter((resource) => resource.tipo === 'enlace').length,
      subjects: subjects.length,
    }),
    [resources, subjects]
  );

  const openCreateSubject = async () => {
    if (!canManage) return;

    if (groups.length === 0 || teachers.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Faltan datos de configuracion',
        text: 'Primero registra un grupo con nivel y al menos un maestro asignado a ese nivel.',
      });
      return;
    }

    setEditingSubject(null);
    setSubjectForm(EMPTY_SUBJECT_FORM);
    setSubjectModalOpen(true);
  };

  const openEditSubject = (subject: Subject) => {
    if (!canManage) return;
    setEditingSubject(subject);
    setSubjectForm({
      nombre: subject.nombre,
      gradoId: String(subject.gradoId),
      maestroId: String(subject.maestroId),
    });
    setSubjectModalOpen(true);
  };

  const saveSubject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: SubjectPayload = {
      nombre: subjectForm.nombre.trim(),
      gradoId: Number(subjectForm.gradoId),
      maestroId: Number(subjectForm.maestroId),
    };

    if (
      payload.nombre.length < 2 ||
      !Number.isInteger(payload.gradoId) ||
      !Number.isInteger(payload.maestroId)
    ) {
      await Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Escribe la materia y selecciona el grupo y maestro.',
      });
      return;
    }

    try {
      setSaving(true);
      if (editingSubject) {
        await subjectService.update(editingSubject.uuid, payload);
      } else {
        await subjectService.create(payload);
      }
      setSubjectModalOpen(false);
      setEditingSubject(null);
      setSubjectForm(EMPTY_SUBJECT_FORM);
      await loadData();
      await Swal.fire({
        icon: 'success',
        title: editingSubject ? 'Materia actualizada' : 'Materia creada',
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'No fue posible guardar la materia',
        text: getErrorMessage(error, 'Intenta nuevamente.'),
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteSubject = async (subject: Subject) => {
    if (!canManage) return;

    const result = await Swal.fire({
      icon: 'warning',
      title: `Eliminar ${subject.nombre}?`,
      text: 'Tambien se eliminaran los recursos publicados para esta materia.',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#991b1b',
    });

    if (!result.isConfirmed) return;

    try {
      await subjectService.delete(subject.uuid);
      await loadData();
      await Swal.fire({
        icon: 'success',
        title: 'Materia eliminada',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'No fue posible eliminar la materia',
        text: getErrorMessage(error, 'Intenta nuevamente.'),
      });
    }
  };

  const openCreateResource = async () => {
    if (!canManage) return;

    if (subjects.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Primero crea una materia',
        text: 'Cada recurso debe dirigirse a una materia y a su maestro asignado.',
      });
      return;
    }

    setEditingResource(null);
    setResourceForm(EMPTY_RESOURCE_FORM);
    setResourceModalOpen(true);
  };

  const openEditResource = (resource: AcademicResource) => {
    if (!canManage) return;
    setEditingResource(resource);
    setResourceForm({
      titulo: resource.titulo,
      descripcion: resource.descripcion || '',
      tipo: resource.tipo,
      gradoId: String(resource.materia?.gradoId || ''),
      materiaId: String(resource.materiaId),
      enlace: resource.enlace || '',
      archivo: null,
    });
    setResourceModalOpen(true);
  };

  const saveResource = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const materiaId = Number(resourceForm.materiaId);

    if (
      resourceForm.titulo.trim().length < 2 ||
      !Number.isInteger(materiaId) ||
      materiaId <= 0
    ) {
      await Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Escribe el titulo y selecciona grupo y materia.',
      });
      return;
    }

    if (resourceForm.tipo === 'enlace' && !resourceForm.enlace.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Falta el enlace',
        text: 'Agrega una direccion que inicie con http:// o https://.',
      });
      return;
    }

    if (
      resourceForm.tipo === 'pdf' &&
      !resourceForm.archivo &&
      (!editingResource || editingResource.tipo !== 'pdf')
    ) {
      await Swal.fire({
        icon: 'warning',
        title: 'Falta el PDF',
        text: 'Selecciona un archivo PDF de hasta 8 MB.',
      });
      return;
    }

    const payload: AcademicResourcePayload = {
      titulo: resourceForm.titulo.trim(),
      descripcion: resourceForm.descripcion.trim(),
      tipo: resourceForm.tipo,
      materiaId,
    };

    if (resourceForm.tipo === 'enlace') {
      payload.enlace = resourceForm.enlace.trim();
    } else if (resourceForm.archivo) {
      if (
        resourceForm.archivo.type !== 'application/pdf' ||
        !resourceForm.archivo.name.toLowerCase().endsWith('.pdf')
      ) {
        await Swal.fire({
          icon: 'warning',
          title: 'Archivo no valido',
          text: 'El archivo seleccionado debe ser un PDF.',
        });
        return;
      }

      if (resourceForm.archivo.size > MAX_PDF_BYTES) {
        await Swal.fire({
          icon: 'warning',
          title: 'Archivo demasiado grande',
          text: 'El PDF no puede superar 8 MB.',
        });
        return;
      }

      payload.archivoBase64 = await fileToDataUrl(resourceForm.archivo);
      payload.archivoNombre = resourceForm.archivo.name;
    }

    try {
      setSaving(true);
      if (editingResource) {
        await academicResourceService.update(editingResource.uuid, payload);
      } else {
        await academicResourceService.create(payload);
      }
      setResourceModalOpen(false);
      setEditingResource(null);
      setResourceForm(EMPTY_RESOURCE_FORM);
      await loadData();
      await Swal.fire({
        icon: 'success',
        title: editingResource
          ? 'Recurso actualizado'
          : 'Recurso publicado',
        text: selectedResourceSubject?.maestro?.name
          ? `Disponible para ${selectedResourceSubject.maestro.name}.`
          : undefined,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'No fue posible guardar el recurso',
        text: getErrorMessage(error, 'Intenta nuevamente.'),
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteResource = async (resource: AcademicResource) => {
    if (!canManage) return;
    const result = await Swal.fire({
      icon: 'warning',
      title: `Eliminar ${resource.titulo}?`,
      text: 'El maestro dejara de tener acceso al recurso.',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#991b1b',
    });

    if (!result.isConfirmed) return;

    try {
      await academicResourceService.delete(resource.uuid);
      await loadData();
      await Swal.fire({
        icon: 'success',
        title: 'Recurso eliminado',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'No fue posible eliminar el recurso',
        text: getErrorMessage(error, 'Intenta nuevamente.'),
      });
    }
  };

  const downloadPdf = async (resource: AcademicResource) => {
    try {
      setDownloadingUuid(resource.uuid);
      const blob = await academicResourceService.downloadPdf(resource.uuid);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = resource.archivoNombre || `${resource.titulo}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'No fue posible descargar el PDF',
        text: getErrorMessage(error, 'Intenta nuevamente.'),
      });
    } finally {
      setDownloadingUuid(null);
    }
  };

  return (
    <ProtectedRoute
      allowedRoles={['administrador', 'coordinador', 'maestro']}
    >
      <AppLayout>
        <div className="space-y-6">
          <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-red-950 via-red-900 to-[#630330] p-6 text-white shadow-lg sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
                  Coordinacion academica
                </p>
                <h1 className="mt-2 text-3xl font-bold">
                  Recursos para maestros
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-red-100">
                  Publica enlaces o archivos PDF por grupo y materia. El sistema
                  los entrega solamente al maestro asignado.
                </p>
              </div>

              {canManage && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void openCreateSubject()}
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                  >
                    + Nueva materia
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void openCreateResource()}
                    className="bg-white text-red-900 hover:bg-red-50"
                  >
                    + Publicar recurso
                  </Button>
                </div>
              )}
            </div>
          </header>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Recursos visibles', metrics.resources, 'bg-red-50 text-red-800'],
              ['Archivos PDF', metrics.pdfs, 'bg-blue-50 text-blue-800'],
              ['Enlaces', metrics.links, 'bg-emerald-50 text-emerald-800'],
              ['Materias', metrics.subjects, 'bg-amber-50 text-amber-800'],
            ].map(([label, value, color]) => (
              <article
                key={String(label)}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}
                >
                  {label}
                </span>
                <p className="mt-3 text-3xl font-bold text-gray-900">
                  {value}
                </p>
              </article>
            ))}
          </section>

          {canManage && subjects.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Materias configuradas
                  </h2>
                  <p className="text-sm text-gray-500">
                    La materia determina el grupo y el maestro destinatario.
                  </p>
                </div>
                <span className="text-sm font-semibold text-red-800">
                  {subjects.length} registradas
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {subjects.map((subject) => (
                  <article
                    key={subject.uuid}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-gray-900">
                          {subject.nombre}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {subject.grado?.nombre || 'Grupo sin nombre'}
                        </p>
                        <p className="mt-1 truncate text-xs text-gray-500">
                          Maestro: {subject.maestro?.name || 'Sin asignar'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEditSubject(subject)}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteSubject(subject)}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Input
                label="Buscar"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Titulo, materia, grupo o maestro"
              />
              <Select
                label="Grupo"
                value={groupFilter}
                onChange={(event) => {
                  setGroupFilter(event.target.value);
                  setSubjectFilter('todas');
                }}
                options={[
                  { label: 'Todos los grupos', value: 'todos' },
                  ...groups.map((group) => ({
                    label: group.nombre,
                    value: String(group.id),
                  })),
                ]}
              />
              <Select
                label="Materia"
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
                options={[
                  { label: 'Todas las materias', value: 'todas' },
                  ...subjects
                    .filter(
                      (subject) =>
                        groupFilter === 'todos' ||
                        String(subject.gradoId) === groupFilter
                    )
                    .map((subject) => ({
                      label: subject.nombre,
                      value: String(subject.id),
                    })),
                ]}
              />
              <Select
                label="Tipo"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                options={[
                  { label: 'PDF y enlaces', value: 'todos' },
                  { label: 'Solo PDF', value: 'pdf' },
                  { label: 'Solo enlaces', value: 'enlace' },
                ]}
              />
            </div>
          </section>

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
              Cargando recursos academicos...
            </div>
          ) : visibleResources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
              <p className="text-lg font-bold text-gray-800">
                No hay recursos para mostrar
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {canManage
                  ? 'Crea una materia y publica el primer enlace o PDF.'
                  : 'Cuando Coordinacion publique material para tus materias aparecera aqui.'}
              </p>
            </div>
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleResources.map((resource) => {
                  const subject = resource.materia;
                  const isPdf = resource.tipo === 'pdf';

                  return (
                    <article
                      key={resource.uuid}
                      className="flex min-h-72 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            isPdf
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isPdf ? 'PDF' : 'ENLACE'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(resource.createdAt)}
                        </span>
                      </div>

                      <h2 className="mt-4 text-xl font-bold text-gray-900">
                        {resource.titulo}
                      </h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                        {resource.descripcion || 'Sin descripcion adicional.'}
                      </p>

                      <dl className="mt-4 space-y-2 rounded-xl bg-gray-50 p-3 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-gray-500">Grupo</dt>
                          <dd className="text-right font-semibold text-gray-800">
                            {subject?.grado?.nombre || 'Sin grupo'}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-gray-500">Materia</dt>
                          <dd className="text-right font-semibold text-gray-800">
                            {subject?.nombre || 'Sin materia'}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-gray-500">Maestro</dt>
                          <dd className="text-right font-semibold text-gray-800">
                            {subject?.maestro?.name || 'Sin maestro'}
                          </dd>
                        </div>
                        {isPdf && (
                          <div className="flex justify-between gap-3">
                            <dt className="text-gray-500">Tamano</dt>
                            <dd className="font-semibold text-gray-800">
                              {formatBytes(resource.archivoTamano)}
                            </dd>
                          </div>
                        )}
                      </dl>

                      <div className="mt-auto flex flex-wrap gap-2 pt-5">
                        {isPdf ? (
                          <Button
                            type="button"
                            onClick={() => void downloadPdf(resource)}
                            disabled={downloadingUuid === resource.uuid}
                            className="bg-red-800 hover:bg-red-900"
                          >
                            {downloadingUuid === resource.uuid
                              ? 'Descargando...'
                              : 'Descargar PDF'}
                          </Button>
                        ) : (
                          <a
                            href={resource.enlace || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-900"
                          >
                            Abrir enlace
                          </a>
                        )}

                        {canManage && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => openEditResource(resource)}
                            >
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => void deleteResource(resource)}
                            >
                              Eliminar
                            </Button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
              />
            </>
          )}
        </div>

        <Modal
          open={subjectModalOpen}
          onClose={() => {
            if (!saving) setSubjectModalOpen(false);
          }}
          title={editingSubject ? 'Editar materia' : 'Nueva materia'}
          size="md"
        >
          <form onSubmit={saveSubject} className="space-y-4">
            <Input
              label="Nombre de la materia"
              value={subjectForm.nombre}
              onChange={(event) =>
                setSubjectForm((current) => ({
                  ...current,
                  nombre: event.target.value,
                }))
              }
              maxLength={120}
              placeholder="Ej. Programacion Web"
              required
            />
            <Select
              label="Grupo"
              value={subjectForm.gradoId}
              onChange={(event) =>
                setSubjectForm((current) => ({
                  ...current,
                  gradoId: event.target.value,
                  maestroId: '',
                }))
              }
              options={[
                { label: 'Selecciona un grupo', value: '' },
                ...groups.map((group) => ({
                  label: `${group.nombre} - ${group.nivel?.nombre || 'Sin nivel'}`,
                  value: String(group.id),
                })),
              ]}
              required
            />
            <Select
              label="Maestro que impartira la materia"
              value={subjectForm.maestroId}
              onChange={(event) =>
                setSubjectForm((current) => ({
                  ...current,
                  maestroId: event.target.value,
                }))
              }
              options={[
                {
                  label: subjectForm.gradoId
                    ? 'Selecciona un maestro del nivel'
                    : 'Selecciona primero el grupo',
                  value: '',
                },
                ...teachersForSelectedGroup.map((teacher) => ({
                  label: teacher.name,
                  value: String(teacher.id),
                })),
              ]}
              disabled={!subjectForm.gradoId}
              required
            />

            {subjectForm.gradoId && teachersForSelectedGroup.length === 0 && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                No hay maestros asignados al nivel de este grupo. Asigna el
                nivel al maestro desde Usuarios.
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSubjectModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-red-800 hover:bg-red-900"
              >
                {saving ? 'Guardando...' : 'Guardar materia'}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          open={resourceModalOpen}
          onClose={() => {
            if (!saving) setResourceModalOpen(false);
          }}
          title={editingResource ? 'Editar recurso' : 'Publicar recurso'}
          size="lg"
        >
          <form onSubmit={saveResource} className="space-y-4">
            <Input
              label="Titulo"
              value={resourceForm.titulo}
              onChange={(event) =>
                setResourceForm((current) => ({
                  ...current,
                  titulo: event.target.value,
                }))
              }
              maxLength={160}
              placeholder="Ej. Guia para la practica 1"
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Grupo"
                value={resourceForm.gradoId}
                onChange={(event) =>
                  setResourceForm((current) => ({
                    ...current,
                    gradoId: event.target.value,
                    materiaId: '',
                  }))
                }
                options={[
                  { label: 'Selecciona un grupo', value: '' },
                  ...groups.map((group) => ({
                    label: group.nombre,
                    value: String(group.id),
                  })),
                ]}
                required
              />
              <Select
                label="Materia"
                value={resourceForm.materiaId}
                onChange={(event) =>
                  setResourceForm((current) => ({
                    ...current,
                    materiaId: event.target.value,
                  }))
                }
                options={[
                  {
                    label: resourceForm.gradoId
                      ? 'Selecciona una materia'
                      : 'Selecciona primero el grupo',
                    value: '',
                  },
                  ...subjectsForResourceGroup.map((subject) => ({
                    label: subject.nombre,
                    value: String(subject.id),
                  })),
                ]}
                disabled={!resourceForm.gradoId}
                required
              />
            </div>

            {selectedResourceSubject && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Destinatario
                </p>
                <p className="mt-1 font-bold text-blue-950">
                  {selectedResourceSubject.maestro?.name || 'Sin maestro'}
                </p>
                <p className="text-sm text-blue-800">
                  {selectedResourceSubject.nombre} -{' '}
                  {selectedResourceSubject.grado?.nombre}
                </p>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm text-gray-700">
                Descripcion opcional
              </label>
              <textarea
                value={resourceForm.descripcion}
                onChange={(event) =>
                  setResourceForm((current) => ({
                    ...current,
                    descripcion: event.target.value,
                  }))
                }
                rows={4}
                maxLength={5000}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Explica para que se utilizara este material."
              />
            </div>

            <Select
              label="Tipo de recurso"
              value={resourceForm.tipo}
              onChange={(event) =>
                setResourceForm((current) => ({
                  ...current,
                  tipo: event.target.value as 'enlace' | 'pdf',
                  enlace: '',
                  archivo: null,
                }))
              }
              options={[
                { label: 'Enlace web', value: 'enlace' },
                { label: 'Archivo PDF', value: 'pdf' },
              ]}
            />

            {resourceForm.tipo === 'enlace' ? (
              <Input
                label="Enlace"
                type="url"
                value={resourceForm.enlace}
                onChange={(event) =>
                  setResourceForm((current) => ({
                    ...current,
                    enlace: event.target.value,
                  }))
                }
                maxLength={2048}
                placeholder="https://..."
                required
              />
            ) : (
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  Archivo PDF {editingResource?.tipo === 'pdf' && '(opcional para conservar el actual)'}
                </label>
                <input
                  key={`${editingResource?.uuid || 'nuevo'}-${resourceForm.tipo}`}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      archivo: event.target.files?.[0] || null,
                    }))
                  }
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-red-50 file:px-3 file:py-1.5 file:font-semibold file:text-red-800"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Solo PDF. Tamano maximo: 8 MB.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setResourceModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving || !selectedResourceSubject}
                className="bg-red-800 hover:bg-red-900"
              >
                {saving ? 'Guardando...' : 'Guardar recurso'}
              </Button>
            </div>
          </form>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}
