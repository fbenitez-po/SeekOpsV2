import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, CalendarRange, ChevronDown, AlertTriangle } from 'lucide-react';
import { projectionApi, projectApi, configApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

function seekerVacio() {
  return { id: crypto.randomUUID(), user_id: '', fecha_inicio: '', fecha_fin: '', horas_proyectadas: '', work_category_id: '', expandido: true };
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
  const [verTodasAlertas, setVerTodasAlertas] = useState(false);
  const [creandoMultiple, setCreandoMultiple] = useState(false);

  const { data: dataProyecciones, isLoading } = useQuery({
    queryKey: ['proyecciones'],
    queryFn: () => projectionApi.listar().then((r) => r.data.data),
  });

  const { data: dataAlertas } = useQuery({
    queryKey: ['proyecciones-alertas'],
    queryFn: () => projectionApi.alertas().then((r) => r.data.data),
  });

  const alertasSinProyeccion = dataAlertas || [];

  const { data: dataProyectos } = useQuery({
    queryKey: ['projects-gestor'],
    queryFn: () => projectApi.listar({ activo: 'true', limit: 100 }).then((r) => r.data.data),
  });

  const { data: dataCategorias } = useQuery({
    queryKey: ['categorias-cliente'],
    queryFn: () => configApi.workCategories().then((r) => r.data),
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
      seekers: [{ id: crypto.randomUUID(), user_id: proy.user_id, fecha_inicio: proy.fecha_inicio?.slice(0, 10) || '', fecha_fin: proy.fecha_fin?.slice(0, 10) || '', horas_proyectadas: String(proy.horas_proyectadas), work_category_id: proy.work_category_id || '' }],
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

  function toggleSeeker(id) {
    setForm((prev) => ({
      ...prev,
      seekers: prev.seekers.map((s) => (s.id === id ? { ...s, expandido: !s.expandido } : s)),
    }));
  }

  function agregarSeeker() {
    setError('');
    const incompleto = form.seekers.find(
      (s) => !s.user_id || !s.fecha_inicio || !s.fecha_fin || !s.horas_proyectadas
    );
    if (incompleto) {
      setForm((prev) => ({
        ...prev,
        seekers: prev.seekers.map((s) => (s.id === incompleto.id ? { ...s, expandido: true } : s)),
      }));
      document.getElementById(`seeker-card-${incompleto.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setError('Completa el seeker anterior antes de agregar otro.');
      return;
    }
    setForm((prev) => ({
      ...prev,
      seekers: [...prev.seekers.map((s) => ({ ...s, expandido: false })), seekerVacio()],
    }));
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
        horas_proyectadas: parseFloat(s.horas_proyectadas),
        work_category_id: s.work_category_id || null,
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
            horas_proyectadas: parseFloat(s.horas_proyectadas),
            work_category_id: s.work_category_id || null,
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
              Define cuántas horas tendrá asignado cada seeker por período
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
                      <option value="">Selecciona un proyecto</option>
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
                      const seekerSeleccionado = usuariosDisponibles.find((u) => u.id === seeker.user_id);
                      return (
                        <div key={seeker.id} id={`seeker-card-${seeker.id}`} className="rounded-lg border border-slate-200">
                          {/* Header colapsable */}
                          <div
                            className="flex items-center justify-between px-3 py-2.5 cursor-pointer select-none"
                            onClick={() => toggleSeeker(seeker.id)}
                          >
                            <div className="flex-1 min-w-0">
                              {seekerSeleccionado ? (
                                <p className="text-sm font-medium truncate">
                                  {seekerSeleccionado.nombres} {seekerSeleccionado.apellidos}
                                  {!seeker.expandido && seeker.horas_proyectadas && ` · ${seeker.horas_proyectadas}h`}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">Sin seeker seleccionado</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!editando && form.seekers.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); eliminarSeeker(seeker.id); }}
                                  className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                              <div className={`p-1 transition-transform duration-200 ${seeker.expandido ? 'rotate-180' : ''}`}>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </div>

                          {/* Contenido expandido */}
                          {seeker.expandido && (
                            <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3">
                              <div className="flex items-center gap-2">
                                <select
                                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                  value={seeker.user_id}
                                  onChange={(e) => actualizarSeeker(seeker.id, 'user_id', e.target.value)}
                                  required
                                  disabled={!!editando || !form.project_id}
                                >
                                  <option value="">
                                    {form.project_id ? 'Selecciona un seeker' : 'Primero elige un proyecto'}
                                  </option>
                                  {opciones.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.nombres} {u.apellidos}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Categoría</label>
                                <select
                                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                  value={seeker.work_category_id}
                                  onChange={(e) => actualizarSeeker(seeker.id, 'work_category_id', e.target.value)}
                                >
                                  <option value="">Sin categoría</option>
                                  {(dataCategorias || []).map((c) => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                  ))}
                                </select>
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
                                    min="0.5"
                                    max="9999"
                                    step="0.5"
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
                          )}
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

        {/* Alertas: cargas sin proyección vigente */}
        {alertasSinProyeccion.length > 0 && (
          <Card className="border-amber-300 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Cargas sin proyección vigente ({alertasSinProyeccion.length})
              </CardTitle>
              <p className="text-sm text-amber-700">
                Estos seekers registraron horas en proyectos sin proyección definida para ese período.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-amber-200 bg-amber-100/50">
                      <th className="px-4 py-2.5 text-left font-medium text-amber-800">Seeker</th>
                      <th className="px-4 py-2.5 text-left font-medium text-amber-800">Proyecto</th>
                      <th className="px-4 py-2.5 text-left font-medium text-amber-800">Semana</th>
                      <th className="px-4 py-2.5 text-right font-medium text-amber-800">Horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(verTodasAlertas ? alertasSinProyeccion : alertasSinProyeccion.slice(0, 2)).map((a) => (
                      <tr key={a.time_entry_id} className="border-t border-amber-100 hover:bg-amber-100/40">
                        <td className="px-4 py-2.5 font-medium text-amber-900">
                          {a.usuario_nombres} {a.usuario_apellidos}
                        </td>
                        <td className="px-4 py-2.5 text-amber-800">{a.proyecto_nombre}</td>
                        <td className="px-4 py-2.5 text-amber-700">{a.semana}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-amber-900">{a.horas_cargadas}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {alertasSinProyeccion.length > 2 && (
                <button
                  onClick={() => setVerTodasAlertas((v) => !v)}
                  className="w-full py-2.5 text-sm font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-100/50 transition-colors border-t border-amber-200"
                >
                  {verTodasAlertas ? 'Ver menos' : `Ver ${alertasSinProyeccion.length - 2} más`}
                </button>
              )}
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
                No hay proyecciones registradas. Crea la primera usando el botón de arriba.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Proyecto</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Seeker</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoría</th>
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
                        <td className="px-4 py-3 text-muted-foreground">
                          {p.categoria_nombre || '—'}
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
