import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, X, ArrowLeft } from 'lucide-react';
import { timeEntryApi, projectApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  formatearRangoDeSemana,
  formatearDiaMes,
  obtenerDomingoBase,
  obtenerFeriadosSemana,
  inicioADomingo,
  rangoSemana,
  aISODateLocal,
} from '../../lib/utils';

function obtenerDomingo(offset = 0) {
  const base = obtenerDomingoBase();
  base.setDate(base.getDate() + offset * 7);
  return base;
}

function nuevaLinea(proyectoId) {
  return {
    _key: `${Date.now()}-${Math.random()}`,
    proyecto_id: proyectoId,
    horas: '',
    horas_extra: '',
    mostrarExtras: false,
    comentario: '',
    categoria_ingreso_id: null,
  };
}

function calcularOffset(semanaInicioISO) {
  const targetDomingo = inicioADomingo(semanaInicioISO);
  if (!targetDomingo) return -1;
  const base = obtenerDomingoBase();
  const diffMs = targetDomingo.getTime() - base.getTime();
  return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
}

export default function CargarHoras() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const recarga = location.state ?? null;
  const initialOffset = recarga?.semanaInicio ? calcularOffset(recarga.semanaInicio) : -1;

  const [offsetSemana, setOffsetSemana] = useState(initialOffset);
  // Array de líneas: [{ _key, proyecto_id, horas, horas_extra, mostrarExtras, comentario, categoria_ingreso_id }]
  const [lineas, setLineas] = useState([]);
  const [error, setError] = useState('');
  const [mostrarAlertaSemana, setMostrarAlertaSemana] = useState(false);
  const [mostrarModalProyecto, setMostrarModalProyecto] = useState(false);

  const domingo = obtenerDomingo(offsetSemana);
  const feriadosSemana = obtenerFeriadosSemana(domingo);
  const horasEsperadas = (5 - feriadosSemana.length) * 8;

  const { data: proyectos } = useQuery({
    queryKey: ['proyectos-asignados'],
    queryFn: () => projectApi.listar({ activo: true }).then((r) => r.data.data),
  });

  // Pre-select rejected project when navigated from MisHoras/HomeSeeker
  useEffect(() => {
    if (!recarga?.proyectoId || !proyectos?.length) return;
    const existe = proyectos.find((p) => p.id === recarga.proyectoId);
    if (existe) {
      setLineas((prev) => {
        if (prev.some((l) => l.proyecto_id === recarga.proyectoId)) return prev;
        return [nuevaLinea(recarga.proyectoId)];
      });
    }
  }, [proyectos, recarga?.proyectoId]);

  const mutation = useMutation({
    mutationFn: (payload) => timeEntryApi.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      navigate('/seeker');
    },
    onError: (err) => setError(err.response?.data?.error || 'Error al guardar'),
  });

  function manejarClicProyecto(proyecto) {
    setError('');
    const esArea = Boolean(proyecto.area);

    setLineas((prev) => {
      if (!esArea) {
        // Toggle para proyectos no-área: agrega o quita la única línea
        if (prev.some((l) => l.proyecto_id === proyecto.id)) {
          return prev.filter((l) => l.proyecto_id !== proyecto.id);
        }
        return [...prev, nuevaLinea(proyecto.id)];
      }
      // Para proyectos de área: siempre agrega una nueva línea
      return [...prev, nuevaLinea(proyecto.id)];
    });
  }

  function eliminarLinea(key) {
    setLineas((prev) => prev.filter((l) => l._key !== key));
  }

  function actualizarLinea(key, campo, valor) {
    setLineas((prev) => prev.map((l) => (l._key === key ? { ...l, [campo]: valor } : l)));
  }

  function avanzarSemana() {
    if (offsetSemana >= -1) setMostrarAlertaSemana(true);
    else setOffsetSemana((o) => o + 1);
  }

  function manejarSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = lineas.map((l) => ({
      proyecto_id: l.proyecto_id,
      categoria_ingreso_id: l.categoria_ingreso_id || null,
      horas: parseFloat(l.horas) || 0,
      horas_extra: parseFloat(l.horas_extra) || 0,
      comentario: l.comentario,
    }));
    if (payload.length === 0) {
      setError('Selecciona al menos un proyecto para cargar horas.');
      return;
    }
    const lunes = new Date(domingo);
    lunes.setDate(domingo.getDate() - 6);
    mutation.mutate({
      semana_inicio: aISODateLocal(lunes),
      semana_fin: aISODateLocal(domingo),
      lineas: payload,
    });
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
          <p className="text-muted-foreground">Registra las horas trabajadas para la semana seleccionada</p>
        </div>

        {recarga?.semanaInicio && (
          <div className="max-w-2xl rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            Re-cargando proyecto rechazado para la semana <span className="font-semibold">{rangoSemana(recarga.semanaInicio)}</span>. Solo se enviará este proyecto.
          </div>
        )}

        <form onSubmit={manejarSubmit} className="max-w-2xl">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">

            {/* Selector de semana */}
            <div className="px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOffsetSemana((o) => o - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">
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
              <p className="text-xs text-slate-400 mb-2">Selecciona el o los proyectos en los que trabajaste esta semana</p>
              <div className="flex flex-wrap gap-2">
              {listaProyectos.map((proyecto) => {
                const esArea = Boolean(proyecto.area);
                const cantLineas = lineas.filter((l) => l.proyecto_id === proyecto.id).length;
                const activo = cantLineas > 0;
                return (
                  <button
                    key={proyecto.id}
                    type="button"
                    onClick={() => manejarClicProyecto(proyecto)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      activo
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {proyecto.nombre}
                    {/* No-área seleccionado: X para deseleccionar. Área: muestra cantidad si hay más de una */}
                    {activo && !esArea && <X className="h-3.5 w-3.5 opacity-70" />}
                    {activo && esArea && cantLineas > 1 && (
                      <span className="text-xs opacity-70">×{cantLineas}</span>
                    )}
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

            {/* Formularios de líneas seleccionadas */}
            {lineas.map((linea) => {
              const proyecto = listaProyectos.find((p) => p.id === linea.proyecto_id);
              if (!proyecto) return null;
              const esArea = Boolean(proyecto.area);
              const cantLineasProyecto = lineas.filter((l) => l.proyecto_id === proyecto.id).length;

              return (
                <div key={linea._key}>
                  <div className="px-3 py-2 flex items-center justify-between bg-slate-50">
                    <p className="text-sm text-slate-900">
                      <span className="font-mono text-xs text-slate-400 mr-2">{proyecto.codigo}</span>
                      <span className="font-medium">{proyecto.nombre}</span>
                      {/* Si hay múltiples líneas del mismo proyecto, muestra la categoría seleccionada como indicador */}
                      {esArea && cantLineasProyecto > 1 && linea.categoria_ingreso_id && (
                        <span className="ml-2 text-xs text-slate-500">
                          ({(proyecto.categorias_ingreso || []).find((c) => c.id === linea.categoria_ingreso_id)?.nombre || 'sin categoría'})
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => eliminarLinea(linea._key)}
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
                          value={linea.categoria_ingreso_id || ''}
                          onValueChange={(v) => actualizarLinea(linea._key, 'categoria_ingreso_id', v)}
                        >
                          <SelectTrigger className="bg-white h-7 text-xs flex-1">
                            <SelectValue placeholder="Selecciona categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {(proyecto.categorias_ingreso || []).map((c) => (
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
                          value={linea.horas}
                          onChange={(e) => actualizarLinea(linea._key, 'horas', e.target.value)}
                          required placeholder="0" className="bg-white h-7 text-sm w-16 text-center px-1"
                        />
                      </div>
                      {linea.mostrarExtras ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 shrink-0">Extras</span>
                          <Input
                            type="number" min="0" max="8" step="0.5"
                            value={linea.horas_extra}
                            onChange={(e) => actualizarLinea(linea._key, 'horas_extra', e.target.value)}
                            placeholder="0" className="bg-white h-7 text-sm w-16 text-center px-1"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => actualizarLinea(linea._key, 'mostrarExtras', true)}
                          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          + Horas extras
                        </button>
                      )}
                    </div>

                    <Textarea
                      value={linea.comentario}
                      onChange={(e) => actualizarLinea(linea._key, 'comentario', e.target.value)}
                      maxLength={500} placeholder="Comentario de las tareas realizadas..."
                      rows={1} className="bg-white text-xs resize-none" required
                    />
                  </div>
                </div>
              );
            })}

            {/* Botones — solo si hay al menos una línea */}
            {lineas.length > 0 && (
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
              Solo puedes cargar horas de semanas ya cerradas. La semana en curso y las futuras no están disponibles para carga.
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
              Solo aparecen los proyectos a los que fuiste asignado. Si crees que falta alguno, contacta a tu supervisor para que gestione el acceso.
            </p>
            <Button className="w-full" onClick={() => setMostrarModalProyecto(false)}>Entendido</Button>
          </div>
        </div>
      )}
    </Layout>
  );
}
