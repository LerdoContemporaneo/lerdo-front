'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { homeworkService } from '../services/schoolService'; // Asegúrate de haberlo agregado arriba
import ProtectedRoute from '../components/ProtectedRoute';

export default function TareasPage() {
  const [tareas, setTareas] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar tareas
  const loadTareas = async () => {
    const data = await homeworkService.getAll();
    setTareas(data);
  };

  useEffect(() => { loadTareas(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    // Objeto basado en tu archivo .rest
    const payload = {
        titulo: formData.get('titulo'),
        descripcion: formData.get('descripcion'),
        fechaAsignacion: formData.get('fechaAsignacion'),
        fechaEntrega: formData.get('fechaEntrega'),
        alumnoId: formData.get('alumnoId') // Esto debería ser un Select de alumnos idealmente
    };

    try {
        await homeworkService.create(payload);
        alert("Tarea asignada correctamente 📚");
        setIsModalOpen(false);
        loadTareas();
    } catch (error) {
        alert("Error al asignar tarea");
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
                <Button onClick={() => setIsModalOpen(true)} className="bg-red-900 text-white">
                    + Nueva Tarea
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <Table 
                    columns={[
                        { key: 'titulo', header: 'Título' },
                        { key: 'fechaEntrega', header: 'Entrega' },
                        { key: 'alumnoId', header: 'ID Alumno' }, // Mejorar esto para mostrar nombre luego
                        { 
                            key: 'actions', 
                            header: 'Acciones', 
                            render: (r: any) => (
                                <Button 
                                    variant="danger" 
                                    className="text-xs bg-red-50 text-red-700" 
                                    onClick={() => {
                                        if(confirm("¿Borrar tarea?")) {
                                            homeworkService.delete(r.uuid || r.id).then(loadTareas);
                                        }
                                    }}
                                >
                                    Eliminar
                                </Button>
                            )
                        }
                    ]} 
                    data={tareas} 
                />
            </div>
        </div>

        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Asignar Nueva Tarea">
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <Input label="Título de la Tarea" name="titulo" required placeholder="Ej. Ejercicios de Matemáticas" />
            
            {/* TextArea simulado con Input por ahora, o cambia a textarea real */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <textarea 
                    name="descripcion" 
                    className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-red-500 outline-none" 
                    rows={3} 
                    required 
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input label="Fecha Asignación" name="fechaAsignacion" type="date" required />
                <Input label="Fecha Entrega" name="fechaEntrega" type="date" required />
            </div>

            {/* OJO: Aquí deberías poner un Select con los alumnos que cargues de studentService */}
            <Input label="ID del Alumno (Temporal)" name="alumnoId" type="number" required placeholder="1" />

            <Button type="submit" className="w-full bg-red-900 text-white" disabled={loading}>
                {loading ? "Asignando..." : "Asignar Tarea"}
            </Button>
          </form>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}