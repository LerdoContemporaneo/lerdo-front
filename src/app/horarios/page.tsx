'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';

import AppLayout from '../components/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import WeeklyScheduleGrid from '../components/schedules/WeeklyScheduleGrid';
import { useAuth } from '../hooks/useAuth';
import {
  gradeService,
  levelService,
  subjectService,
  userService,
  type AcademicGroup,
  type AcademicTeacher,
  type EducationalLevel,
  type Subject,
} from '../services/schoolService';
import {
  scheduleService,
  type AcademicLoad,
  type Classroom,
  type ClassroomType,
  type SchoolPeriod,
  type SchoolSchedule,
  type ScheduleBlock,
  type TeacherAvailability,
} from '../services/scheduleService';

const DAY_OPTIONS = [
  [1, 'Lunes'],
  [2, 'Martes'],
  [3, 'Miércoles'],
  [4, 'Jueves'],
  [5, 'Viernes'],
  [6, 'Sábado'],
] as const;

const ROOM_TYPES: Array<{ value: ClassroomType; label: string }> = [
  { value: 'aula', label: 'Aula' },
  { value: 'computo', label: 'Centro de cómputo' },
  { value: 'laboratorio', label: 'Laboratorio' },
  { value: 'taller', label: 'Taller' },
  { value: 'auditorio', label: 'Auditorio' },
];

type Teacher = AcademicTeacher & { niveles?: EducationalLevel[] };

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100';
const primaryButton = 'rounded-lg bg-red-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButton = 'rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50';
const dangerButton = 'rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50';

const message = async (title: string, text: string, icon: 'success' | 'error' | 'warning' = 'success') => {
  await Swal.fire({ title, text, icon, confirmButtonColor: '#630330' });
};

const errorDetails = (error: unknown) => {
  const current = error as Error & { conflictos?: string[] };
  return {
    text: current?.message || 'Ocurrió un error inesperado.',
    conflicts: Array.isArray(current?.conflictos) ? current.conflictos : [],
  };
};

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-gray-950">{title}</h2>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">{children}</span>;
}

export default function SchedulesPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'administrador' || user?.role === 'coordinador';

  const [levels, setLevels] = useState<EducationalLevel[]>([]);
  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<SchoolPeriod[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [availability, setAvailability] = useState<TeacherAvailability[]>([]);
  const [loads, setLoads] = useState<AcademicLoad[]>([]);
  const [schedules, setSchedules] = useState<SchoolSchedule[]>([]);

  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [activeTab, setActiveTab] = useState<'horario' | 'configuracion'>('horario');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);

  const [periodForm, setPeriodForm] = useState({ nombre: '', nivelId: '', fechaInicio: '', fechaFin: '' });
  const [roomForm, setRoomForm] = useState({ nombre: '', edificio: '', capacidad: '30', tipo: 'aula' as ClassroomType, nivelId: '' });
  const [blockForm, setBlockForm] = useState({ horaInicio: '07:00', horaFin: '15:10', duracionMinutos: '50', cambioMinutos: '0', recesoInicio: '11:20', recesoFin: '11:50' });
  const [availabilityForm, setAvailabilityForm] = useState({ maestroId: '', diaSemana: '3', horaInicio: '07:00', horaFin: '11:00', tipo: 'disponible' as TeacherAvailability['tipo'] });
  const [subjectForm, setSubjectForm] = useState({ nombre: '', maestroId: '' });
  const [loadForm, setLoadForm] = useState({ materiaId: '', sesionesSemana: '2', bloquesPorSesion: '1', maximoPorDia: '1', tipoSalon: 'cualquiera' as AcademicLoad['tipoSalon'] });
  const [generatorForm, setGeneratorForm] = useState({ dias: [3, 4, 5], horaInicio: '07:00', horaFin: '11:00', maximoConsecutivas: '3', evitarHuecos: true });

  const selectedPeriod = periods.find((item) => String(item.id) === selectedPeriodId);
  const availableGroups = useMemo(() => {
    const byId = new Map<number, AcademicGroup>();
    groups.forEach((group) => byId.set(Number(group.id), group));
    schedules.forEach((schedule) => {
      if (schedule.grado) byId.set(Number(schedule.grado.id), schedule.grado);
    });
    return [...byId.values()];
  }, [groups, schedules]);
  const periodGroups = useMemo(
    () => availableGroups.filter((group) => !selectedPeriod || Number(group.nivelId) === Number(selectedPeriod.nivelId)),
    [availableGroups, selectedPeriod],
  );
  const selectedGroup = periodGroups.find((item) => String(item.id) === selectedGroupId);
  const groupSubjects = useMemo(
    () => subjects.filter((subject) => Number(subject.gradoId) === Number(selectedGroupId)),
    [subjects, selectedGroupId],
  );
  const levelTeachers = useMemo(() => {
    if (!selectedPeriod) return teachers;
    return teachers.filter((teacher) =>
      !teacher.niveles?.length || teacher.niveles.some((level) => Number(level.id) === Number(selectedPeriod.nivelId)),
    );
  }, [teachers, selectedPeriod]);
  const activeSchedule = schedules.find(
    (schedule) => Number(schedule.periodoId) === Number(selectedPeriodId) && Number(schedule.gradoId) === Number(selectedGroupId),
  );

  const loadBaseData = async () => {
    try {
      setLoading(true);
      const [levelsData, groupsData, subjectsData, periodsData, usersData] = await Promise.all([
        levelService.getAll(),
        gradeService.getAll(),
        subjectService.getAll(),
        scheduleService.getPeriods(),
        canManage ? userService.getAll() : Promise.resolve([]),
      ]);
      const loadedPeriods = Array.isArray(periodsData) ? periodsData : [];
      const loadedGroups = Array.isArray(groupsData) ? groupsData as AcademicGroup[] : [];
      setLevels(levelsData);
      setGroups(loadedGroups);
      setSubjects(subjectsData);
      setPeriods(loadedPeriods);
      setTeachers((Array.isArray(usersData) ? usersData : []).filter((item: Teacher) => item.role === 'maestro'));

      if (!selectedPeriodId && loadedPeriods.length) {
        setSelectedPeriodId(String(loadedPeriods[0].id));
        const firstGroup = loadedGroups.find((group) => Number(group.nivelId) === Number(loadedPeriods[0].nivelId));
        if (firstGroup) setSelectedGroupId(String(firstGroup.id));
      }
    } catch (error) {
      const detail = errorDetails(error);
      await message('No fue posible cargar horarios', detail.text, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPeriodData = async () => {
    const periodoId = Number(selectedPeriodId);
    if (!periodoId) {
      setBlocks([]);
      setClassrooms([]);
      setAvailability([]);
      setSchedules([]);
      return;
    }
    try {
      const [blockData, classroomData, availabilityData, scheduleData] = await Promise.all([
        scheduleService.getBlocks(periodoId),
        scheduleService.getClassrooms(selectedPeriod?.nivelId),
        scheduleService.getAvailability(periodoId),
        scheduleService.getSchedules({ periodoId }),
      ]);
      setBlocks(blockData);
      setClassrooms(classroomData);
      setAvailability(availabilityData);
      setSchedules(scheduleData);
    } catch (error) {
      const detail = errorDetails(error);
      await message('No fue posible cargar el periodo', detail.text, 'error');
    }
  };

  const loadGroupData = async () => {
    const periodoId = Number(selectedPeriodId);
    const gradoId = Number(selectedGroupId);
    if (!periodoId || !gradoId) {
      setLoads([]);
      return;
    }
    try {
      setLoads(await scheduleService.getLoads({ periodoId, gradoId }));
    } catch (error) {
      const detail = errorDetails(error);
      await message('No fue posible cargar la carga académica', detail.text, 'error');
    }
  };

  useEffect(() => {
    if (user) void loadBaseData();
  }, [user?.id]);

  useEffect(() => {
    if (selectedPeriodId) void loadPeriodData();
  }, [selectedPeriodId]);

  useEffect(() => {
    if (selectedPeriodId && selectedGroupId) void loadGroupData();
  }, [selectedPeriodId, selectedGroupId]);

  useEffect(() => {
    if (!selectedPeriod) return;
    setRoomForm((current) => ({ ...current, nivelId: String(selectedPeriod.nivelId) }));
    if (!periodGroups.some((group) => String(group.id) === selectedGroupId)) {
      setSelectedGroupId(periodGroups[0] ? String(periodGroups[0].id) : '');
    }
  }, [selectedPeriodId, groups.length, schedules.length]);

  const perform = async (action: () => Promise<void>) => {
    try {
      setSaving(true);
      setConflicts([]);
      await action();
    } catch (error) {
      const detail = errorDetails(error);
      setConflicts(detail.conflicts);
      await message('No fue posible completar la operación', detail.text, 'error');
    } finally {
      setSaving(false);
    }
  };

  const createPeriod = (event: React.FormEvent) => {
    event.preventDefault();
    void perform(async () => {
      await scheduleService.createPeriod({
        nombre: periodForm.nombre,
        nivelId: Number(periodForm.nivelId),
        fechaInicio: periodForm.fechaInicio,
        fechaFin: periodForm.fechaFin,
        activo: true,
      });
      setPeriodForm({ nombre: '', nivelId: '', fechaInicio: '', fechaFin: '' });
      await loadBaseData();
      await message('Periodo creado', 'Ya puedes configurar sus bloques y restricciones.');
    });
  };

  const createRoom = (event: React.FormEvent) => {
    event.preventDefault();
    void perform(async () => {
      await scheduleService.createClassroom({
        nombre: roomForm.nombre,
        edificio: roomForm.edificio || null,
        capacidad: Number(roomForm.capacidad),
        tipo: roomForm.tipo,
        nivelId: Number(roomForm.nivelId),
        activo: true,
      });
      setRoomForm((current) => ({ ...current, nombre: '', edificio: '', capacidad: '30' }));
      await loadPeriodData();
      await message('Salón creado', 'El generador ya puede tomarlo como opción.');
    });
  };

  const generateBlocks = (event: React.FormEvent) => {
    event.preventDefault();
    void perform(async () => {
      const response = await scheduleService.generateBlocks({
        periodoId: Number(selectedPeriodId),
        horaInicio: blockForm.horaInicio,
        horaFin: blockForm.horaFin,
        duracionMinutos: Number(blockForm.duracionMinutos),
        cambioMinutos: Number(blockForm.cambioMinutos),
        recesoInicio: blockForm.recesoInicio || undefined,
        recesoFin: blockForm.recesoFin || undefined,
      });
      setBlocks(response.bloques);
      await message('Bloques generados', `Se crearon ${response.bloques.length} bloques para el periodo.`);
    });
  };

  const createAvailability = (event: React.FormEvent) => {
    event.preventDefault();
    void perform(async () => {
      await scheduleService.createAvailability({
        periodoId: Number(selectedPeriodId),
        maestroId: Number(availabilityForm.maestroId || user?.id),
        diaSemana: Number(availabilityForm.diaSemana),
        horaInicio: availabilityForm.horaInicio,
        horaFin: availabilityForm.horaFin,
        tipo: availabilityForm.tipo,
      });
      await loadPeriodData();
      await message('Restricción guardada', 'Se tomará en cuenta en la siguiente generación.');
    });
  };

  const createSubject = (event: React.FormEvent) => {
    event.preventDefault();
    void perform(async () => {
      const created = await subjectService.create({
        nombre: subjectForm.nombre,
        gradoId: Number(selectedGroupId),
        maestroId: Number(subjectForm.maestroId),
      });
      setSubjects(await subjectService.getAll());
      setLoadForm((current) => ({ ...current, materiaId: String(created.id) }));
      setSubjectForm({ nombre: '', maestroId: '' });
      await message('Materia creada', 'Ahora define cuántas sesiones requiere por semana.');
    });
  };

  const createLoad = (event: React.FormEvent) => {
    event.preventDefault();
    void perform(async () => {
      const subject = subjects.find((item) => String(item.id) === loadForm.materiaId);
      if (!subject) throw new Error('Selecciona una materia válida.');
      await scheduleService.createLoad({
        periodoId: Number(selectedPeriodId),
        gradoId: Number(selectedGroupId),
        materiaId: subject.id,
        maestroId: subject.maestroId,
        sesionesSemana: Number(loadForm.sesionesSemana),
        bloquesPorSesion: Number(loadForm.bloquesPorSesion),
        maximoPorDia: Number(loadForm.maximoPorDia),
        tipoSalon: loadForm.tipoSalon,
      });
      setLoadForm((current) => ({ ...current, materiaId: '' }));
      await loadGroupData();
      await message('Carga agregada', 'La materia está lista para entrar al generador.');
    });
  };

  const generateSchedule = () => {
    void perform(async () => {
      const response = await scheduleService.generateSchedule({
        periodoId: Number(selectedPeriodId),
        gradoId: Number(selectedGroupId),
        dias: generatorForm.dias,
        horaInicio: generatorForm.horaInicio,
        horaFin: generatorForm.horaFin,
        maximoConsecutivas: Number(generatorForm.maximoConsecutivas),
        evitarHuecos: generatorForm.evitarHuecos,
      });
      setSchedules((current) => [
        response.horario,
        ...current.filter((item) => item.id !== response.horario.id),
      ]);
      await message(
        'Horario generado',
        `${response.resumen.sesiones} sesiones y ${response.resumen.bloques} bloques quedaron en borrador.`,
      );
    });
  };

  const publishSchedule = () => {
    if (!activeSchedule) return;
    void perform(async () => {
      const response = await scheduleService.publishSchedule(activeSchedule.uuid);
      setSchedules((current) => current.map((item) => item.id === response.horario.id ? response.horario : item));
      await message('Horario publicado', 'Los maestros ya pueden consultar sus clases.');
    });
  };

  const removeSchedule = () => {
    if (!activeSchedule) return;
    void perform(async () => {
      const confirmation = await Swal.fire({
        title: '¿Eliminar este horario?',
        text: 'Se eliminará el borrador o publicación de este grupo para que puedas ajustar su carga.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#991b1b',
      });
      if (!confirmation.isConfirmed) return;
      await scheduleService.deleteSchedule(activeSchedule.uuid);
      setSchedules((current) => current.filter((item) => item.id !== activeSchedule.id));
      await message('Horario eliminado', 'Ya puedes modificar la carga académica del grupo.');
    });
  };

  const removeAvailability = (item: TeacherAvailability) => {
    void perform(async () => {
      await scheduleService.deleteAvailability(item.uuid);
      await loadPeriodData();
    });
  };

  const removeLoad = (item: AcademicLoad) => {
    void perform(async () => {
      await scheduleService.deleteLoad(item.uuid);
      await loadGroupData();
    });
  };

  return (
    <ProtectedRoute allowedRoles={['administrador', 'coordinador', 'maestro']}>
      <AppLayout>
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="rounded-2xl bg-gradient-to-br from-gray-950 via-red-950 to-red-900 p-6 text-white shadow-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200">Planeación académica</p>
            <h1 className="mt-2 text-3xl font-bold">Horarios y asignación de salones</h1>
            <p className="mt-2 max-w-3xl text-sm text-red-100">
              {canManage
                ? 'Define restricciones, carga académica y disponibilidad. El sistema busca una combinación sin cruces y la deja en borrador antes de publicarla.'
                : 'Consulta aquí tus clases publicadas, sus grupos, horarios y salones asignados.'}
            </p>
          </header>

          <section className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-2">
            <label>
              <Label>Periodo escolar</Label>
              <select className={inputClass} value={selectedPeriodId} onChange={(event) => setSelectedPeriodId(event.target.value)}>
                <option value="">Selecciona un periodo</option>
                {periods.map((period) => <option key={period.id} value={period.id}>{period.nombre} · {period.nivel?.nombre}</option>)}
              </select>
            </label>
            <label>
              <Label>Grupo / grado</Label>
              <select className={inputClass} value={selectedGroupId} onChange={(event) => setSelectedGroupId(event.target.value)}>
                <option value="">Selecciona un grupo</option>
                {periodGroups.map((group) => <option key={group.id} value={group.id}>{group.nombre}</option>)}
              </select>
            </label>
          </section>

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-14 text-center font-semibold text-gray-500">Cargando módulo de horarios…</div>
          ) : !periods.length ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
                No hay periodos escolares. {canManage ? 'Crea el primero para comenzar.' : 'Solicita al coordinador que configure uno.'}
              </div>
              {canManage && (
                <Panel title="Crear el primer periodo escolar" description="Después podrás configurar salones, bloques, materias y restricciones.">
                  <form className="grid gap-3 sm:grid-cols-2" onSubmit={createPeriod}>
                    <label className="sm:col-span-2"><Label>Nombre</Label><input required className={inputClass} placeholder="Ej. Septiembre–Diciembre 2026" value={periodForm.nombre} onChange={(event) => setPeriodForm({ ...periodForm, nombre: event.target.value })} /></label>
                    <label><Label>Nivel</Label><select required className={inputClass} value={periodForm.nivelId} onChange={(event) => setPeriodForm({ ...periodForm, nivelId: event.target.value })}><option value="">Selecciona</option>{levels.map((level) => <option key={level.id} value={level.id}>{level.nombre}</option>)}</select></label>
                    <div />
                    <label><Label>Fecha inicial</Label><input required className={inputClass} type="date" value={periodForm.fechaInicio} onChange={(event) => setPeriodForm({ ...periodForm, fechaInicio: event.target.value })} /></label>
                    <label><Label>Fecha final</Label><input required className={inputClass} type="date" value={periodForm.fechaFin} onChange={(event) => setPeriodForm({ ...periodForm, fechaFin: event.target.value })} /></label>
                    <button className={`${primaryButton} sm:col-span-2`} disabled={saving}>Crear periodo</button>
                  </form>
                </Panel>
              )}
            </div>
          ) : (
            <>
              {canManage && (
                <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
                  <button className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === 'horario' ? 'bg-white text-red-900 shadow-sm' : 'text-gray-600'}`} onClick={() => setActiveTab('horario')}>Horario</button>
                  <button className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === 'configuracion' ? 'bg-white text-red-900 shadow-sm' : 'text-gray-600'}`} onClick={() => setActiveTab('configuracion')}>Configuración y restricciones</button>
                </div>
              )}

              {activeTab === 'horario' || !canManage ? (
                <div className="space-y-6">
                  {canManage && (
                    <Panel title="Parámetros del generador" description="Ejemplo solicitado: miércoles a viernes de 7:00 a 11:00.">
                      <div className="grid gap-4 lg:grid-cols-4">
                        <div className="lg:col-span-2">
                          <Label>Días permitidos</Label>
                          <div className="flex flex-wrap gap-2">
                            {DAY_OPTIONS.map(([value, label]) => (
                              <label key={value} className={`cursor-pointer rounded-full border px-3 py-2 text-xs font-semibold ${generatorForm.dias.includes(value) ? 'border-red-800 bg-red-50 text-red-900' : 'border-gray-200 text-gray-500'}`}>
                                <input className="sr-only" type="checkbox" checked={generatorForm.dias.includes(value)} onChange={() => setGeneratorForm((current) => ({ ...current, dias: current.dias.includes(value) ? current.dias.filter((day) => day !== value) : [...current.dias, value].sort() }))} />
                                {label}
                              </label>
                            ))}
                          </div>
                        </div>
                        <label><Label>Desde</Label><input className={inputClass} type="time" value={generatorForm.horaInicio} onChange={(event) => setGeneratorForm({ ...generatorForm, horaInicio: event.target.value })} /></label>
                        <label><Label>Hasta</Label><input className={inputClass} type="time" value={generatorForm.horaFin} onChange={(event) => setGeneratorForm({ ...generatorForm, horaFin: event.target.value })} /></label>
                        <label><Label>Máximo de bloques consecutivos</Label><input className={inputClass} type="number" min="1" max="10" value={generatorForm.maximoConsecutivas} onChange={(event) => setGeneratorForm({ ...generatorForm, maximoConsecutivas: event.target.value })} /></label>
                        <label className="flex items-center gap-2 self-end rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"><input type="checkbox" checked={generatorForm.evitarHuecos} onChange={(event) => setGeneratorForm({ ...generatorForm, evitarHuecos: event.target.checked })} /> Evitar huecos cuando sea posible</label>
                        <div className="flex items-end gap-2 lg:col-span-2">
                          <button className={primaryButton} disabled={saving || !selectedPeriodId || !selectedGroupId || !loads.length || !blocks.length} onClick={generateSchedule}>{activeSchedule ? 'Regenerar borrador' : 'Generar horario'}</button>
                          {activeSchedule?.estado === 'borrador' && <button className={secondaryButton} disabled={saving} onClick={publishSchedule}>Publicar</button>}
                          {activeSchedule && <button className={dangerButton} disabled={saving} onClick={removeSchedule}>Eliminar horario</button>}
                          {activeSchedule && <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${activeSchedule.estado === 'publicado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{activeSchedule.estado}</span>}
                        </div>
                      </div>
                    </Panel>
                  )}

                  {conflicts.length > 0 && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
                      <p className="font-bold">Restricciones que impiden generar el horario:</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">{conflicts.map((item) => <li key={item}>{item}</li>)}</ul>
                    </div>
                  )}

                  <div>
                    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-bold text-gray-950">{selectedGroup?.nombre || 'Horario semanal'}</h2>
                        <p className="text-sm text-gray-500">{selectedPeriod?.nombre || 'Selecciona periodo y grupo'} · {activeSchedule ? `${activeSchedule.clases.length} bloques asignados` : 'Aún sin horario'}</p>
                      </div>
                    </div>
                    <WeeklyScheduleGrid blocks={blocks} schedule={activeSchedule} />
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 xl:grid-cols-2">
                  <Panel title="1. Periodo escolar" description="Crea un periodo por nivel educativo.">
                    <form className="grid gap-3 sm:grid-cols-2" onSubmit={createPeriod}>
                      <label className="sm:col-span-2"><Label>Nombre</Label><input required className={inputClass} placeholder="Ej. Septiembre–Diciembre 2026" value={periodForm.nombre} onChange={(event) => setPeriodForm({ ...periodForm, nombre: event.target.value })} /></label>
                      <label><Label>Nivel</Label><select required className={inputClass} value={periodForm.nivelId} onChange={(event) => setPeriodForm({ ...periodForm, nivelId: event.target.value })}><option value="">Selecciona</option>{levels.map((level) => <option key={level.id} value={level.id}>{level.nombre}</option>)}</select></label>
                      <div />
                      <label><Label>Fecha inicial</Label><input required className={inputClass} type="date" value={periodForm.fechaInicio} onChange={(event) => setPeriodForm({ ...periodForm, fechaInicio: event.target.value })} /></label>
                      <label><Label>Fecha final</Label><input required className={inputClass} type="date" value={periodForm.fechaFin} onChange={(event) => setPeriodForm({ ...periodForm, fechaFin: event.target.value })} /></label>
                      <button className={`${primaryButton} sm:col-span-2`} disabled={saving}>Crear periodo</button>
                    </form>
                  </Panel>

                  <Panel title="2. Salones disponibles" description="La capacidad y el tipo se validan automáticamente.">
                    <form className="grid gap-3 sm:grid-cols-2" onSubmit={createRoom}>
                      <label><Label>Nombre</Label><input required className={inputClass} placeholder="Ej. CC-01" value={roomForm.nombre} onChange={(event) => setRoomForm({ ...roomForm, nombre: event.target.value })} /></label>
                      <label><Label>Edificio</Label><input className={inputClass} placeholder="Edificio A" value={roomForm.edificio} onChange={(event) => setRoomForm({ ...roomForm, edificio: event.target.value })} /></label>
                      <label><Label>Capacidad</Label><input required className={inputClass} type="number" min="1" value={roomForm.capacidad} onChange={(event) => setRoomForm({ ...roomForm, capacidad: event.target.value })} /></label>
                      <label><Label>Tipo</Label><select className={inputClass} value={roomForm.tipo} onChange={(event) => setRoomForm({ ...roomForm, tipo: event.target.value as ClassroomType })}>{ROOM_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
                      <button className={`${primaryButton} sm:col-span-2`} disabled={saving || !roomForm.nivelId}>Agregar salón</button>
                    </form>
                    <div className="mt-4 flex flex-wrap gap-2">{classrooms.map((room) => <span key={room.id} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">{room.nombre} · {room.capacidad} · {room.tipo}</span>)}</div>
                  </Panel>

                  <Panel title="3. Bloques del día" description="Se pueden regenerar mientras no existan clases guardadas en el periodo.">
                    <form className="grid gap-3 sm:grid-cols-3" onSubmit={generateBlocks}>
                      <label><Label>Inicio</Label><input required className={inputClass} type="time" value={blockForm.horaInicio} onChange={(event) => setBlockForm({ ...blockForm, horaInicio: event.target.value })} /></label>
                      <label><Label>Fin</Label><input required className={inputClass} type="time" value={blockForm.horaFin} onChange={(event) => setBlockForm({ ...blockForm, horaFin: event.target.value })} /></label>
                      <label><Label>Duración (min)</Label><input required className={inputClass} type="number" min="10" max="180" value={blockForm.duracionMinutos} onChange={(event) => setBlockForm({ ...blockForm, duracionMinutos: event.target.value })} /></label>
                      <label><Label>Cambio (min)</Label><input required className={inputClass} type="number" min="0" max="60" value={blockForm.cambioMinutos} onChange={(event) => setBlockForm({ ...blockForm, cambioMinutos: event.target.value })} /></label>
                      <label><Label>Inicio receso</Label><input className={inputClass} type="time" value={blockForm.recesoInicio} onChange={(event) => setBlockForm({ ...blockForm, recesoInicio: event.target.value })} /></label>
                      <label><Label>Fin receso</Label><input className={inputClass} type="time" value={blockForm.recesoFin} onChange={(event) => setBlockForm({ ...blockForm, recesoFin: event.target.value })} /></label>
                      <button className={`${primaryButton} sm:col-span-3`} disabled={saving || !selectedPeriodId}>Generar bloques</button>
                    </form>
                    <p className="mt-3 text-xs text-gray-500">Bloques actuales: {blocks.length}</p>
                  </Panel>

                  <Panel title="4. Disponibilidad docente" description="Disponible limita al maestro a esa ventana; no disponible bloquea; preferido mejora la prioridad.">
                    <form className="grid gap-3 sm:grid-cols-2" onSubmit={createAvailability}>
                      <label className="sm:col-span-2"><Label>Maestro</Label><select required className={inputClass} value={availabilityForm.maestroId} onChange={(event) => setAvailabilityForm({ ...availabilityForm, maestroId: event.target.value })}><option value="">Selecciona</option>{levelTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label>
                      <label><Label>Día</Label><select className={inputClass} value={availabilityForm.diaSemana} onChange={(event) => setAvailabilityForm({ ...availabilityForm, diaSemana: event.target.value })}>{DAY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                      <label><Label>Tipo</Label><select className={inputClass} value={availabilityForm.tipo} onChange={(event) => setAvailabilityForm({ ...availabilityForm, tipo: event.target.value as TeacherAvailability['tipo'] })}><option value="disponible">Disponible</option><option value="preferido">Preferido</option><option value="no_disponible">No disponible</option></select></label>
                      <label><Label>Desde</Label><input required className={inputClass} type="time" value={availabilityForm.horaInicio} onChange={(event) => setAvailabilityForm({ ...availabilityForm, horaInicio: event.target.value })} /></label>
                      <label><Label>Hasta</Label><input required className={inputClass} type="time" value={availabilityForm.horaFin} onChange={(event) => setAvailabilityForm({ ...availabilityForm, horaFin: event.target.value })} /></label>
                      <button className={`${primaryButton} sm:col-span-2`} disabled={saving || !selectedPeriodId}>Guardar restricción</button>
                    </form>
                    <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">{availability.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-2 text-xs"><span><strong>{item.maestro?.name}</strong> · {DAY_OPTIONS.find(([day]) => day === item.diaSemana)?.[1]} · {item.horaInicio.slice(0, 5)}–{item.horaFin.slice(0, 5)} · {item.tipo}</span><button className={dangerButton} type="button" onClick={() => removeAvailability(item)}>Quitar</button></div>)}</div>
                  </Panel>

                  <Panel title="5. Materias y maestro" description={`Crea las materias del grupo ${selectedGroup?.nombre || 'seleccionado'} y asigna su docente.`}>
                    <form className="grid gap-3 sm:grid-cols-2" onSubmit={createSubject}>
                      <label><Label>Materia</Label><input required className={inputClass} placeholder="Ej. Programación II" value={subjectForm.nombre} onChange={(event) => setSubjectForm({ ...subjectForm, nombre: event.target.value })} /></label>
                      <label><Label>Maestro</Label><select required className={inputClass} value={subjectForm.maestroId} onChange={(event) => setSubjectForm({ ...subjectForm, maestroId: event.target.value })}><option value="">Selecciona</option>{levelTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label>
                      <button className={`${secondaryButton} sm:col-span-2`} disabled={saving || !selectedGroupId}>Crear materia y asignar maestro</button>
                    </form>
                  </Panel>

                  <Panel title="6. Carga académica" description="Indica cuántas veces por semana debe aparecer cada materia.">
                    <form className="grid gap-3 sm:grid-cols-2" onSubmit={createLoad}>
                      <label className="sm:col-span-2"><Label>Materia</Label><select required className={inputClass} value={loadForm.materiaId} onChange={(event) => setLoadForm({ ...loadForm, materiaId: event.target.value })}><option value="">Selecciona</option>{groupSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.nombre} · {subject.maestro?.name || levelTeachers.find((teacher) => teacher.id === subject.maestroId)?.name}</option>)}</select></label>
                      <label><Label>Sesiones por semana</Label><input required className={inputClass} type="number" min="1" max="20" value={loadForm.sesionesSemana} onChange={(event) => setLoadForm({ ...loadForm, sesionesSemana: event.target.value })} /></label>
                      <label><Label>Bloques por sesión</Label><input required className={inputClass} type="number" min="1" max="4" value={loadForm.bloquesPorSesion} onChange={(event) => setLoadForm({ ...loadForm, bloquesPorSesion: event.target.value })} /></label>
                      <label><Label>Máximo de sesiones al día</Label><input required className={inputClass} type="number" min="1" max="8" value={loadForm.maximoPorDia} onChange={(event) => setLoadForm({ ...loadForm, maximoPorDia: event.target.value })} /></label>
                      <label><Label>Tipo de salón</Label><select className={inputClass} value={loadForm.tipoSalon} onChange={(event) => setLoadForm({ ...loadForm, tipoSalon: event.target.value as AcademicLoad['tipoSalon'] })}><option value="cualquiera">Cualquiera</option>{ROOM_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
                      <button className={`${primaryButton} sm:col-span-2`} disabled={saving || !selectedPeriodId || !selectedGroupId}>Agregar a la carga</button>
                    </form>
                    <div className="mt-4 space-y-2">{loads.map((load) => <div key={load.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm"><span><strong>{load.materia?.nombre}</strong><br /><span className="text-xs text-gray-500">{load.maestro?.name} · {load.sesionesSemana} sesión(es) · {load.bloquesPorSesion} bloque(s)</span></span><button className={dangerButton} type="button" onClick={() => removeLoad(load)}>Quitar</button></div>)}</div>
                  </Panel>
                </div>
              )}
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
