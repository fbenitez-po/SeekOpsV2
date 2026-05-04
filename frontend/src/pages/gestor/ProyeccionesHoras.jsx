import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, CalendarRange } from 'lucide-react';
import { projectionApi, projectApi, userApi } from '../../services/api';
import useAuthStore from '../../store/authStore';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

function formatFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const FORM_VACIO = {
  project_id: '',
  user_id: '',
  fecha_inicio: '',
  fecha_fin: '',
  horas_proyectadas: '',
  notas: '',
};

export default function ProyeccionesHoras() {
  const { usuario } = useAuthStore();
  const qc = useQueryClient();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null); // proyección completa si se edita
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState('');
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);

  const { data: dataProyecciones, isLoading } = useQuery({
    queryKey: ['proyecciones'],
    queryFn: () => projectionApi.listar().then((r) => r.data.data),
  });

  const { data: dataProyectos } = useQuery({
    queryKey: ['projects-gestor'],
    queryFn: () => projectApi.listar({ activo: 'true', limit: 100 }).then((r) => r.data.data),
  });

  const { data: dataUsuarios } = useQuery({
    queryKey: ['users-todos'],
    queryFn: () => userApi.listar({ activo: 'true', limit: 200 }).then((r) => r.data.data),
    enabled: !!form.project_id,
  });

  // Filtrar usuarios asignados al proyecto seleccionado
  const proyectoSeleccionado = (dataProyectos || []).find((p) => p.id === form.project_id);
  const usuariosDelProyecto = proyectoSeleccionado?.usuarios || (dataUsuarios || []);

  const mutCrear = useMutation({
    mutationFn: (datos) => projectionApi.crear(datos),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proyecciones'] });
      qc.invalidateQueries({ queryKey: ['proyecciones-alertas'] });
      cerrarFormulario();
    },
    onError: (err) => setError(err.response?.data?.error || 'Error al guardar'),
  });

  const mutActualizar = useMutation({
    mutationFn: ({ id, datos }) => projectionApi.actualizar(id, datos),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proyecciones'] });
      qc.invalidateQueries({ queryKey: ['proyecciones-alertas'] });
      cerrarFormulario();
    },
    onError: (err) => setError(err.response?.data?.error || 'Error al guardar'),
  });

  const mutEliminar = useMutation({
    mutationFn: (id) => projectionApi.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proyecciones'] });
      qc.invalidateQueries({ queryKey: ['proyecciones-alertas'] });
      setConfirmarEliminar(null);
    },
  });

  function abrirCrear() {
    setEditando(null);
    setForm(FORM_VACIO);
    setError('');
    setMostrarFormulario(true);
  }

  function abrirEditar(proy) {
    setEditando(proy);
    setForm({
      project_id: proy.project_id,
      user_id: proy.user_id,
      fecha_inicio: proy.fecha_inicio?.slice(0, 10) || '',
      fecha_fin: proy.fecha_fin?.slice(0, 10) || '',
      horas_proyectadas: String(proy.horas_proyectadas),
      notas: proy.notas || '',
    });
    setError('');
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setEditando(null);
    setForm(FORM_VACIO);
    setError('');
  }

  function cambiarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function guardar(e) {
    e.preventDefault();
    setError('');

    const datos = {
      project_id: form.project_id,
      user_id: form.user_id,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      horas_proyectadas: parseInt(form.horas_proyectadas),
      notas: form.notas || null,
    };

    if (editando) {
      mutActualizar.mutate({ id: editando.id, datos });
    } else {
      mutCrear.mutate(datos);
    }
  }

  const proyecciones = dataProyecciones || [];
  const guardando = mutCrear.isPending || mutActualizar.isPending;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Proyecciones de horas</h1>
            <p className="text-muted-foreground">
              Definí cuántas horas tendrá asignado cada seeker por período
            </p>
          </div>
          <Button onClick={abrirCrear} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva proyección
          </Button>
        </div>

        {/* Formulario inline */}
        {mostrarFormulario && (
          <Card className="border-2" style={{ borderColor: '#0f172a' }}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {editando ? 'Editar proyección' : 'Nueva proyección'}
                </CardTitle>
                <button onClick={cerrarFormulario} className="rounded-md p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={guardar} className="space-y-4">
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Proyecto */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Proyecto *</label>
                    <select
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={form.project_id}
                      onChange={(e) => cambiarCampo('project_id', e.target.value)}
                      required
                      disabled={!!editando}
                    >
                      <option value="">Seleccioná un proyecto</option>
                      {(dataProyectos || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.codigo} — {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Usuario */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Seeker *</label>
                    <select
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={form.user_id}
                      onChange={(e) => cambiarCampo('user_id', e.target.value)}
                      required
                      disabled={!!editando || !form.project_id}
                    >
                      <option value="">
                        {form.project_id ? 'Seleccioná un seeker' : 'Primero elegí un proyecto'}
                      </option>
                      {(dataUsuarios || []).map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombres} {u.apellidos}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fecha inicio */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Fecha inicio *</label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={form.fecha_inicio}
                      onChange={(e) => cambiarCampo('fecha_inicio', e.target.value)}
                      required
                    />
                  </div>

                  {/* Fecha fin */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Fecha fin *</label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={form.fecha_fin}
                      onChange={(e) => cambiarCampo('fecha_fin', e.target.value)}
                      min={form.fecha_inicio || undefined}
                      required
                    />
                  </div>

                  {/* Horas proyectadas */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Horas proyectadas *</label>
                    <input
                      type="number"
                      min="1"
                      max="9999"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="Ej: 160"
                      value={form.horas_proyectadas}
                      onChange={(e) => cambiarCampo('horas_proyectadas', e.target.value)}
                      required
                    />
                  </div>

                  {/* Notas */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Notas</label>
                    <input
                      type="text"
                      maxLength={500}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="Opcional"
                      value={form.notas}
                      onChange={(e) => cambiarCampo('notas', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={cerrarFormulario}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={guardando}>
                    {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear proyección'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tabla de proyecciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarRange className="h-4 w-4" />
              Proyecciones registradas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
            ) : proyecciones.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                No hay proyecciones registradas. Creá la primera usando el botón de arriba.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Proyecto</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Seeker</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Período</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Horas</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Notas</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proyecciones.map((p) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <p className="font-medium">{p.proyecto_nombre}</p>
                          <p className="text-xs text-muted-foreground">{p.proyecto_codigo}</p>
                        </td>
                        <td className="px-4 py-3">
                          {p.usuario_nombres} {p.usuario_apellidos}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatFecha(p.fecha_inicio)} → {formatFecha(p.fecha_fin)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{p.horas_proyectadas}h</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                          {p.notas || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => abrirEditar(p)}
                              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                              title="Editar"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmarEliminar(p)}
                              className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal confirmación eliminar */}
        {confirmarEliminar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
              <h3 className="mb-2 font-semibold">¿Eliminar proyección?</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Se eliminará la proyección de{' '}
                <span className="font-medium">
                  {confirmarEliminar.usuario_nombres} {confirmarEliminar.usuario_apellidos}
                </span>{' '}
                en <span className="font-medium">{confirmarEliminar.proyecto_nombre}</span>. Esta
                acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmarEliminar(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => mutEliminar.mutate(confirmarEliminar.id)}
                  disabled={mutEliminar.isPending}
                >
                  {mutEliminar.isPending ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
