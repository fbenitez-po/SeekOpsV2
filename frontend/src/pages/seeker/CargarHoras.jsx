import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, X, ArrowLeft } from 'lucide-react';
import { timeEntryApi, projectApi, configApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  formatearSemana,
  formatearRangoDeSemana,
  formatearDiaMes,
  obtenerDomingoBase,
  obtenerFeriadosSemana,
} from '../../lib/utils';

function obtenerDomingo(offset = 0) {
  const base = obtenerDomingoBase();
  base.setDate(base.getDate() + offset * 7);
  return base;
}

export default function CargarHoras() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [offsetSemana, setOffsetSemana] = useState(-1);
  // { [proyecto_id]: { horas, horas_extra, comentario, categoria_ingreso_id } }
  const [seleccionados, setSeleccionados] = useState({});
  const [error, setError] = useState('');
  const [mostrarAlertaSemana, setMostrarAlertaSemana] = useState(false);
  const [mostrarModalProyecto, setMostrarModalProyecto] = useState(false);

  const domingo = obtenerDomingo(offsetSemana);
  const semana = formatearSemana(domingo);
  const feriadosSemana = obtenerFeriadosSemana(domingo);
  const horasEsperadas = (5 - feriadosSemana.length) * 8;

  const { data: proyectos } = useQuery({
    queryKey: ['proyectos-asignados'],
    queryFn: () => projectApi.listar({ activo: true }).then((r) => r.data.data),
  });

  const { data: categorias } = useQuery({
    queryKey: ['categorias-ingreso'],
    queryFn: () => configApi.categoriasIngreso().then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (payload) => timeEntryApi.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      navigate('/seeker');
    },
    onError: (err) => setError(err.response?.data?.error || 'Error al guardar'),
  });

  function toggleProyecto(id) {
    setError('');
    setSeleccionados((prev) => {
      if (prev[id]) {
        const siguiente = { ...prev };
        delete siguiente[id];
        return siguiente;
      }
      return { ...prev, [id]: { horas: '', horas_extra: '', mostrarExtras: false, comentario: '', categoria_ingreso_id: null } };
    });
  }

  function actualizarCampo(id, campo, valor) {
    setSeleccionados((prev) => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }));
  }

  function avanzarSemana() {
    if (offsetSemana >= -1) setMostrarAlertaSemana(true);
    else setOffsetSemana((o) => o + 1);
  }

  function manejarSubmit(e) {
    e.preventDefault();
    setError('');
    const lineas = Object.entries(seleccionados).map(([proyecto_id, d]) => ({
      proyecto_id,
      categoria_ingreso_id: d.categoria_ingreso_id || null,
      horas: parseFloat(d.horas) || 0,
      horas_extra: parseFloat(d.horas_extra) || 0,
      comentario: d.comentario,
    }));
    if (lineas.length === 0) {
      setError('Seleccioná al menos un proyecto para cargar horas.');
      return;
    }
    mutation.mutate({ semana, lineas });
  }

  const listaProyectos = proyectos || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button
            type="button"
            onClick={() => navigate('/seeker')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </button>
          <h1 className="text-2xl font-bold">Cargar horas</h1>
          <p className="text-muted-foreground">Registrá las horas trabajadas para la semana seleccionada</p>
        </div>

        <form onSubmit={manejarSubmit} className="max-w-2xl">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">

            {/* Selector de semana */}
            <div className="px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOffsetSemana((o) => o - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground">{semana}</p>
                  <p className="text-sm font-semibold text-foreground leading-tight">{formatearRangoDeSemana(domingo)}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={avanzarSemana}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {feriadosSemana.length > 0 && (
                <div className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 px-2.5 py-1.5 flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-yellow-800">
                    Horas esperadas: <span className="font-semibold">{horasEsperadas}h</span>
                    {' · '}Feriado{feriadosSemana.length > 1 ? 's' : ''}: {feriadosSemana.map((f) => `${f.nombre} (${formatearDiaMes(f.fecha)})`).join(', ')}
                  </p>
                </div>
              )}
              {feriadosSemana.length === 0 && (
                <p className="text-center text-xs text-slate-400 mt-1">Horas esperadas: <span className="font-semibold text-slate-600">{horasEsperadas}h</span></p>
              )}
            </div>

            {/* Chips de proyectos */}
            <div className="px-3 pt-3 pb-2.5">
              <p className="text-xs text-slate-400 mb-2">Seleccioná el o los proyectos en los que trabajaste esta semana</p>
              <div className="flex flex-wrap gap-2">
              {listaProyectos.map((proyecto) => {
                const activo = Boolean(seleccionados[proyecto.id]);
                return (
                  <button
                    key={proyecto.id}
                    type="button"
                    onClick={() => toggleProyecto(proyecto.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      activo
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {proyecto.nombre}
                    {activo && <X className="h-3.5 w-3.5 opacity-70" />}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setMostrarModalProyecto(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-sm text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-all bg-white"
              >
                ¿No lo ves?
              </button>
              </div>
            </div>

            {/* Formularios de proyectos seleccionados */}
            {listaProyectos
              .filter((p) => seleccionados[p.id])
              .map((proyecto) => {
                const d = seleccionados[proyecto.id];
                const esArea = proyecto.categoria_ingreso?.nombre === 'Area';

                return (
                  <div key={proyecto.id}>
                    <div className="px-3 py-2 flex items-center justify-between bg-slate-50">
                      <p className="text-sm text-slate-900">
                        <span className="font-mono text-xs text-slate-400 mr-2">{proyecto.codigo}</span>
                        <span className="font-medium">{proyecto.nombre}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleProyecto(proyecto.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors ml-2 shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="px-3 pb-3 pt-2 space-y-2">
                      {esArea && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 shrink-0">Categoría</span>
                          <Select
                            value={d.categoria_ingreso_id || ''}
                            onValueChange={(v) => actualizarCampo(proyecto.id, 'categoria_ingreso_id', v)}
                          >
                            <SelectTrigger className="bg-white h-7 text-xs flex-1">
                              <SelectValue placeholder="Seleccioná categoría" />
                            </SelectTrigger>
                            <SelectContent>
                              {(categorias || []).map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 shrink-0">Horas</span>
                          <Input
                            type="number" min="0" max={horasEsperadas} step="0.5"
                            value={d.horas}
                            onChange={(e) => actualizarCampo(proyecto.id, 'horas', e.target.value)}
                            required placeholder="0" className="bg-white h-7 text-sm w-16 text-center px-1"
                          />
                        </div>
                        {d.mostrarExtras ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 shrink-0">Extras</span>
                            <Input
                              type="number" min="0" max="8" step="0.5"
                              value={d.horas_extra}
                              onChange={(e) => actualizarCampo(proyecto.id, 'horas_extra', e.target.value)}
                              placeholder="0" className="bg-white h-7 text-sm w-16 text-center px-1"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => actualizarCampo(proyecto.id, 'mostrarExtras', true)}
                            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            + Horas extras
                          </button>
                        )}
                      </div>

                      <Textarea
                        value={d.comentario}
                        onChange={(e) => actualizarCampo(proyecto.id, 'comentario', e.target.value)}
                        maxLength={500} placeholder="Comentario de las tareas realizadas..."
                        rows={1} className="bg-white text-xs resize-none" required
                      />
                    </div>
                  </div>
                );
              })}

            {/* Botones — solo si hay al menos un proyecto seleccionado */}
            {Object.keys(seleccionados).length > 0 && (
              <div className="px-3 py-2.5 flex gap-3">
                <Button type="button" variant="outline" className="flex-1 h-8 text-sm" onClick={() => navigate('/seeker')}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 h-8 text-sm" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Guardando...' : 'Guardar horas'}
                </Button>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
        </form>
      </div>

      {/* Modal semana no disponible */}
      {mostrarAlertaSemana && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 mb-2">Semana no disponible</h3>
            <p className="text-sm text-slate-600 mb-5">
              Solo podés cargar horas de semanas ya cerradas. La semana en curso y las futuras no están disponibles para carga.
            </p>
            <Button className="w-full" onClick={() => setMostrarAlertaSemana(false)}>Entendido</Button>
          </div>
        </div>
      )}

      {/* Modal proyecto no encontrado */}
      {mostrarModalProyecto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 mb-2">¿No ves tu proyecto?</h3>
            <p className="text-sm text-slate-600 mb-5">
              Solo aparecen los proyectos a los que fuiste asignado. Si creés que falta alguno, contactá a tu supervisor para que gestione el acceso.
            </p>
            <Button className="w-full" onClick={() => setMostrarModalProyecto(false)}>Entendido</Button>
          </div>
        </div>
      )}
    </Layout>
  );
}
