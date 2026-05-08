import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, CalendarRange } from 'lucide-react';
import { projectionApi, projectApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

function seekerVacio() {
  return { id: crypto.randomUUID(), user_id: '', fecha_inicio: '', fecha_fin: '', horas_proyectadas: '' };
}

function formatFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const FORM_VACIO = {
  project_id: '',
  notas: '',
  seekers: [seekerVacio()],
};

export default function ProyeccionesHoras() {
  const qc = useQueryClient();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState('');
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [creandoMultiple, setCreandoMultiple] = useState(false);

  const { data: dataProyecciones, isLoading } = useQuery({
    queryKey: ['proyecciones'],
    queryFn: () => projectionApi.listar().then((r) => r.data.data),
  });

  const { data: dataProyectos } = useQuery({
    queryKey: ['projects-gestor'],
    queryFn: () => projectApi.listar({ activo: 'true', limit: 100 }).then((r) => r.data.data),
  });

  const { data: dataProyectoDetalle } = useQuery({
    queryKey: ['project-detalle', form.project_id],
    queryFn: () => projectApi.obtener(form.project_id).then((r) => r.data),
    enabled: !!form.project_id,
  });

  const usuariosDisponibles = dataProyectoDetalle?.usuarios || [];

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
      fecha_inicio: proy.fecha_inicio?.slice(0, 10) || '',
      fecha_fin: proy.fecha_fin?.slice(0, 10) || '',
      notas: proy.notas || '',
      seekers: [{ id: crypto.randomUUID(), user_id: proy.user_id, fecha_inicio: proy.fecha_inicio?.slice(0, 10) || '', fecha_fin: proy.fecha_fin?.slice(0, 10) || '', horas_proyectadas: String(proy.horas_proyectadas) }],
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

  function actualizarSeeker(id, campo, valor) {
    setForm((prev) => ({
      ...prev,
      seekers: prev.seekers.map((s) => (s.id === id ? { ...s, [campo]: valor } : s)),
    }));
  }

  function agregarSeeker() {
    setForm((prev) => ({ ...prev, seekers: [...prev.seekers, seekerVacio()] }));
  }

  function eliminarSeeker(id) {
    setForm((prev) => ({ ...prev, seekers: prev.seekers.filter((s) => s.id !== id) }));
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');

    if (editando) {
      const s = form.seekers[0];
      const datos = {
        project_id: form.project_id,
        user_id: s.user_id,
        fecha_inicio: s.fecha_inicio,
        fecha_fin: s.fecha_fin,
        horas_proyectadas: parseInt(s.horas_proyectadas),
        notas: form.notas || null,
      };
      mutActualizar.mutate({ id: editando.id, datos });
      return;
    }

    setCreandoMultiple(true);
    try {
      await Promise.all(
        form.seekers.map((s) =>
          projectionApi.crear({
            project_id: form.project_id,
            user_id: s.user_id,
            fecha_inicio: s.fecha_inicio,
            fecha_fin: s.fecha_fin,
            horas_proyectadas: parseInt(s.horas_proyectadas),
            notas: form.notas || null,
          })
        )
      );
      qc.invalidateQueries({ queryKey: ['proyecciones'] });
      qc.invalidateQueries({ queryKey: ['proyecciones-alertas'] });
      cerrarFormulario();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setCreandoMultiple(false);
    }
  }

  const proyecciones = dataProyecciones || [];
  const guardando = mutActualizar.isPending || creandoMultiple;

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

                <div className="space-y-4">
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

                  {/* Seekers */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Seekers *</label>
                    {form.seekers.map((seeker) => {
                      const seleccionados = form.seekers.map((s) => s.user_id).filter(Boolean);
                      const opciones = usuariosDisponibles.filter(
                        (u) => u.id === seeker.user_id || !seleccionados.includes(u.id)
                      );
                      return (
                        <div key={seeker.id} className="rounded-lg border border-slate-200 p-3 space-y-3">
                          <div className="flex items-center gap-2">
                            <select
                              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                              value={seeker.user_id}
                              onChange={(e) => actualizarSeeker(seeker.id, 'user_id', e.target.value)}
                              required
                              disabled={!!editando || !form.project_id}
                            >
                              <option value="">
                                {form.project_id ? 'Seleccioná un seeker' : 'Primero elegí un proyecto'}
                              </option>
                              {opciones.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.nombres} {u.apellidos}
                                </option>
                              ))}
                            </select>
                            {!editando && form.seekers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => eliminarSeeker(seeker.id)}
                                className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Fecha inicio *</label>
                              <input
                                type="date"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                value={seeker.fecha_inicio}
                                onChange={(e) => actualizarSeeker(seeker.id, 'fecha_inicio', e.target.value)}
                                required
                                disabled={!!editando}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Fecha fin *</label>
                              <input
                                type="date"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                value={seeker.fecha_fin}
                                onChange={(e) => actualizarSeeker(seeker.id, 'fecha_fin', e.target.value)}
                                min={seeker.fecha_inicio || undefined}
                                required
                                disabled={!!editando}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Horas proyectadas *</label>
                              <input
                                type="number"
                                min="1"
                                max="9999"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                placeholder="Ej: 160"
                                value={seeker.horas_proyectadas}
                                onChange={(e) => actualizarSeeker(seeker.id, 'horas_proyectadas', e.target.value)}
                                required
                                disabled={!!editando}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {!editando && (
                      <button
                        type="button"
                        onClick={agregarSeeker}
                        disabled={!form.project_id}
                        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Agregar seeker
                      </button>
                    )}
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
