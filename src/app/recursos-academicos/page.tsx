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
  type AcademicGroup,
  type AcademicResource,
  type AcademicResourcePayload,
} from '../services/schoolService';

type ResourceFormState = {
  titulo: string;
  descripcion: string;
  tipo: 'enlace' | 'pdf';
  gradoId: string;
  enlace: string;
  archivo: File | null;
};

const EMPTY_RESOURCE_FORM: ResourceFormState = {
  titulo: '',
  descripcion: '',
  tipo: 'enlace',
  gradoId: '',
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

const groupLabel = (group: AcademicGroup) => {
  const level = group.nivel?.nombre ? ` · ${group.nivel.nombre}` : '';
  return `${group.nombre}${level}`;
};

export default function AcademicResourcesPage() {
  const { user } = useAuth();
  const canManage =
    user?.role === 'administrador' || user?.role === 'coordinador';

  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingUuid, setDownloadingUuid] = useState<string | null>(null);

  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] =
    useState<AcademicResource | null>(null);
  const [resourceForm, setResourceForm] = useState<ResourceFormState>(
    EMPTY_RESOURCE_FORM
  );

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('todos');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [groupData, resourceData] = await Promise.all([
        gradeService.getAll(),
        academicResourceService.getAll(),
      ]);

      setGroups(
        (groupData as AcademicGroup[]).sort((a, b) =>
          a.nombre.localeCompare(b.nombre, 'es')
        )
      );
      setResources(resourceData);
    } catch (error) {
      console.error('Error cargando recursos academicos:', error);
      await Swal.fire({
        icon: 'error',
        title: 'No fue posible cargar los recursos',
        text: getErrorMessage(error, 'Verifica la conexion con el servidor.'),
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedGroup = useMemo(
    () =>
      groups.find((group) => String(group.id) === resourceForm.gradoId) ??
      null,
    [groups, resourceForm.gradoId]
  );

  const filteredResources = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const group = resource.grado;
      const matchesSearch =
        !normalized ||
        resource.titulo.toLowerCase().includes(normalized) ||
        (resource.descripcion || '').toLowerCase().includes(normalized) ||
        (group?.nombre || '').toLowerCase().includes(normalized) ||
        (group?.nivel?.nombre || '').toLowerCase().includes(normalized) ||
        (group?.maestro?.name || '').toLowerCase().includes(normalized);
      const matchesGroup =
        groupFilter === 'todos' || String(resource.gradoId) === groupFilter;
      const matchesType =
        typeFilter === 'todos' || resource.tipo === typeFilter;

      return matchesSearch && matchesGroup && matchesType;
    });
  }, [resources, search, groupFilter, typeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, groupFilter, typeFilter]);

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
      groups: new Set(resources.map((resource) => resource.gradoId)).size,
    }),
    [resources]
  );

  const openCreateResource = async () => {
    if (!canManage) return;

    if (groups.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'No hay grupos disponibles',
        text: 'Primero crea un grupo dentro de uno de tus niveles educativos.',
      });
      return;
    }

    if (!groups.some((group) => group.maestroId && group.maestro)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Los grupos no tienen maestro',
        text: 'Asigna un maestro a un grupo antes de publicar recursos.',
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
      gradoId: String(resource.gradoId),
      enlace: resource.enlace || '',
      archivo: null,
    });
    setResourceModalOpen(true);
  };

  const saveResource = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const gradoId = Number(resourceForm.gradoId);

    if (
      resourceForm.titulo.trim().length < 2 ||
      !Number.isInteger(gradoId) ||
      gradoId <= 0
    ) {
      await Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Escribe el titulo y selecciona un grupo.',
      });
      return;
    }

    if (!selectedGroup?.maestroId || !selectedGroup.maestro) {
      await Swal.fire({
        icon: 'warning',
        title: 'Grupo sin maestro',
        text: 'Asigna primero un maestro al grupo seleccionado.',
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
      gradoId,
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
        title: editingResource ? 'Recurso actualizado' : 'Recurso publicado',
        text: `Disponible para ${selectedGroup.maestro.name}.`,
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
      text: 'El maestro del grupo dejara de tener acceso al recurso.',
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
    <ProtectedRoute allowedRoles={['administrador', 'coordinador', 'maestro']}>
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
                  Selecciona un grupo y publica un enlace o PDF. El maestro
                  asignado actualmente al grupo lo recibira automaticamente.
                </p>
              </div>

              {canManage && (
                <Button
                  type="button"
                  onClick={() => void openCreateResource()}
                  className=" text-red-900"
                >
                  + Publicar recurso
                </Button>
              )}
            </div>
          </header>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Recursos visibles', metrics.resources, 'bg-red-50 text-red-800'],
              ['Archivos PDF', metrics.pdfs, 'bg-blue-50 text-blue-800'],
              ['Enlaces', metrics.links, 'bg-emerald-50 text-emerald-800'],
              ['Grupos con recursos', metrics.groups, 'bg-amber-50 text-amber-800'],
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
                <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                label="Buscar"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Titulo, grupo, nivel o maestro"
              />
              <Select
                label="Grupo"
                value={groupFilter}
                onChange={(event) => setGroupFilter(event.target.value)}
                options={[
                  { label: 'Todos los grupos', value: 'todos' },
                  ...groups.map((group) => ({
                    label: groupLabel(group),
                    value: String(group.id),
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
                  ? 'Publica el primer enlace o PDF para uno de tus grupos.'
                  : 'Cuando Coordinacion publique material para tus grupos aparecera aqui.'}
              </p>
            </div>
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleResources.map((resource) => {
                  const group = resource.grado;
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
                            {group?.nombre || 'Sin grupo'}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-gray-500">Nivel</dt>
                          <dd className="text-right font-semibold text-gray-800">
                            {group?.nivel?.nombre || 'Sin nivel'}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-gray-500">Maestro en turno</dt>
                          <dd className="text-right font-semibold text-gray-800">
                            {group?.maestro?.name || 'Sin maestro'}
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

            <Select
              label="Grupo destinatario"
              value={resourceForm.gradoId}
              onChange={(event) =>
                setResourceForm((current) => ({
                  ...current,
                  gradoId: event.target.value,
                }))
              }
              options={[
                { label: 'Selecciona un grupo', value: '' },
                ...groups.map((group) => ({
                  label: `${groupLabel(group)} · ${
                    group.maestro?.name || 'SIN MAESTRO'
                  }`,
                  value: String(group.id),
                })),
              ]}
              required
            />

            {selectedGroup && (
              <div
                className={`rounded-xl border p-4 ${
                  selectedGroup.maestro
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-amber-200 bg-amber-50'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Maestro destinatario automatico
                </p>
                <p className="mt-1 font-bold text-gray-950">
                  {selectedGroup.maestro?.name || 'Este grupo no tiene maestro'}
                </p>
                <p className="text-sm text-gray-700">
                  {selectedGroup.nombre} ·{' '}
                  {selectedGroup.nivel?.nombre || 'Sin nivel'}
                </p>
                {!selectedGroup.maestro && (
                  <p className="mt-2 text-sm font-medium text-amber-800">
                    Asigna un maestro desde Administracion de grupos para poder
                    publicar.
                  </p>
                )}
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
                  Archivo PDF{' '}
                  {editingResource?.tipo === 'pdf' &&
                    '(opcional para conservar el actual)'}
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
                disabled={saving || !selectedGroup?.maestro}
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
