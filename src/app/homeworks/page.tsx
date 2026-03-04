'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { homeworkService, studentService } from '../services/schoolService'; 
import ProtectedRoute from '../components/ProtectedRoute';

export default function TareasPage() {
  const [tareas, setTareas] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]); // 👈 Estado para los alumnos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingTarea, setEditingTarea] = useState<any | null>(null); // 👈 Estado para saber si editamos

  // Cargar tareas y alumnos al mismo tiempo
  const loadData = async () => {
    try {
        const [tareasData, studentsData] = await Promise.all([
            homeworkService.getAll(),
            studentService.getAll()
        ]);
        setTareas(tareasData);
        setStudents(studentsData);
    } catch (error) {
        console.error("Error cargando datos", error);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenCreate = () => {
      setEditingTarea(null);
      setIsModalOpen(true);
  };

  const handleOpenEdit = (tarea: any) => {
      setEditingTarea(tarea);
      setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const payload = {
        titulo: formData.get('titulo'),
        descripcion: formData.get('descripcion'),
        fechaAsignacion: formData.get('fechaAsignacion'),
        fechaEntrega: formData.get('fechaEntrega'),
        alumnoId: Number(formData.get('alumnoId')) // 👈 Convertido a número para el backend
    };

    try {
        if (editingTarea) {
            // Usa el UUID o ID dependiendo de cómo lo devuelva tu backend
            await homeworkService.update(editingTarea.uuid || editingTarea.id, payload);
            alert("Tarea actualizada correctamente ✏️");
        } else {
            await homeworkService.create(payload);
            alert("Tarea asignada correctamente 📚");
        }
        setIsModalOpen(false);
        loadData();
    } catch (error) {
        alert("Error al guardar la tarea");
    } finally {
        setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['maestro', 'administrador']}>
      <AppLayout>
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-red-900">Asignación de Tareas</h1>
                <Button onClick={handleOpenCreate} className="bg-red-900 hover:bg-red-800 text-white shadow-md">
                    + Nueva Tarea
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <Table 
                    columns={[
                        { key: 'titulo', header: 'Título' },
                        { 
                          key: 'fechaEntrega', 
                          header: 'Entrega',
                          render: (r: any) => new Date(r.fechaEntrega).toLocaleDateString()
                        },
                        { 
                          key: 'alumno', 
                          header: 'Alumno', 
                          render: (r: any) => {
                            // Si tu backend devuelve el alumno anidado (r.alumno.nombre), genial. 
                            // Si solo devuelve alumnoId, lo buscamos en la lista que descargamos:
                            const alumno = r.alumno || students.find(s => s.id === r.alumnoId);
                            return alumno ? `${alumno.nombre} ${alumno.apellido}` : `ID: ${r.alumnoId}`;
                          } 
                        },
                        { 
                            key: 'actions', 
                            header: 'Acciones', 
                            render: (r: any) => (
                              <div className="flex gap-2">
                                <Button 
                                    variant="primary" 
                                    className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100" 
                                    onClick={() => handleOpenEdit(r)}
                                >
                                    Editar
                                </Button>
                                <Button 
                                    variant="danger" 
                                    className="text-xs bg-red-50 text-red-700 hover:bg-red-100" 
                                    onClick={() => {
                                        if(confirm("¿Borrar tarea? Mapi no podrá recuperarla. 🦝")) {
                                            homeworkService.delete(r.uuid || r.id).then(loadData);
                                        }
                                    }}
                                >
                                    Eliminar
                                </Button>
                              </div>
                            )
                        }
                    ]} 
                    data={tareas} 
                />
            </div>
        </div>

        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTarea ? "Editar Tarea" : "Asignar Nueva Tarea"}>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <Input 
                label="Título de la Tarea" 
                name="titulo" 
                defaultValue={editingTarea?.titulo} 
                required 
                placeholder="Ej. Ejercicios de Matemáticas" 
            />
            
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <textarea 
                    name="descripcion" 
                    defaultValue={editingTarea?.descripcion}
                    className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-red-500 outline-none text-sm" 
                    rows={3} 
                    required 
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Usamos slice(0,10) por si la fecha viene con horas desde la base de datos (YYYY-MM-DDTHH:MM) */}
                <Input label="Fecha Asignación" name="fechaAsignacion" type="date" defaultValue={editingTarea?.fechaAsignacion?.slice(0, 10)} required />
                <Input label="Fecha Entrega" name="fechaEntrega" type="date" defaultValue={editingTarea?.fechaEntrega?.slice(0, 10)} required />
            </div>

            {/* 👈 AQUÍ EL SELECT DE ALUMNOS */}
            <Select 
                label="Alumno Asignado" 
                name="alumnoId" 
                required 
                defaultValue={editingTarea?.alumnoId || ''}
                options={students.map(s => ({
                    label: `${s.nombre} ${s.apellido} (${s.matricula})`,
                    value: s.id.toString()
                }))}
            />

            <Button type="submit" className="w-full bg-red-900 hover:bg-red-800 text-white" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Tarea"}
            </Button>
          </form>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}