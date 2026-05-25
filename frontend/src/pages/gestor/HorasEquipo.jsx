import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCheck, X, Bell, CircleCheck, TriangleAlert } from 'lucide-react';
import { timeEntryApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { formatearFecha, ESTADO_LABELS, rangoSemana } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

const VARIANTE_ESTADO = {
  PENDIENTE: 'warning',
  APROBADO: 'success',
  APROBADO_CON_OBSERVACION: 'success',
  RECHAZADO: 'destructive',
};

function ModalAprobarConObservacion({ solicitud, onCerrar, onConfirmar }) {
  const [comentario, setComentario] = useState('');
  const [lineas, setLineas] = useState(
    solicitud.lineas.map((l) => ({ id: l.id, horas: l.horas, horas_extra: l.horas_extra })),
  );

  function actualizarLinea(idx, campo, valor) {
    setLineas((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [campo]: valor === '' ? '' : Number(valor) } : l)),
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">Aprobar con observación</h2>
        <p className="text-sm text-muted-foreground">
          {solicitud.usuario.nombres} {solicitud.usuario.apellidos} — {rangoSemana(solicitud.semana_inicio)} — {solicitud.proyecto_nombre}
        </p>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Horas por línea</Label>
          <div className="rounded-md border divide-y">
            {solicitud.lineas.map((linea, idx) => (
              <div key={linea.id} className="flex items-center gap-3 p-3">
                <p className="flex-1 text-sm font-medium truncate">
                  {linea.categoria_ingreso?.nombre ?? 'Sin categoría'}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground text-center">Horas</p>
                    <Input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      className="w-16 h-8 text-center text-sm"
                      value={lineas[idx].horas}
                      onChange={(e) => actualizarLinea(idx, 'horas', e.target.value)}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground text-center">Extra</p>
                    <Input
                      type="number"
                      min="0"
                      max="8"
                      step="0.5"
                      className="w-16 h-8 text-center text-sm"
                      value={lineas[idx].horas_extra}
                      onChange={(e) => actualizarLinea(idx, 'horas_extra', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Comentario de observación *</Label>
          <Textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={3}
            placeholder="Indica qué observas sobre estas horas..."
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-teal-600 hover:bg-teal-700"
            disabled={!comentario}
            onClick={() =>
              onConfirmar({
                proyecto_id: solicitud.proyecto_id,
                categoria_ingreso_id: solicitud.categoria_id,
                comentario_observacion: comentario,
                lineas,
              })
            }
          >
            Aprobar con observación
          </Button>
        </div>
      </div>
    </div>
  );
}

function ModalRechazar({ solicitud, onCerrar, onConfirmar }) {
  const [razon, setRazon] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-semibold">Rechazar horas</h2>
        <p className="text-sm text-muted-foreground">
          {solicitud.usuario.nombres} {solicitud.usuario.apellidos} — {rangoSemana(solicitud.semana_inicio)} — {solicitud.proyecto_nombre}
        </p>

        <div className="space-y-2">
          <Label>Razón del rechazo *</Label>
          <Textarea
            value={razon}
            onChange={(e) => setRazon(e.target.value)}
            rows={3}
            placeholder="Explica por qué se rechazan estas horas..."
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={!razon}
            onClick={() =>
              onConfirmar({ proyecto_id: solicitud.proyecto_id, categoria_ingreso_id: solicitud.categoria_id, razon_rechazo: razon, permitir_reenvio: true })
            }
          >
            Rechazar
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Flatten entries into "solicitudes": one per (entry, project, category) for area projects,
 *  one per (entry, project) for regular projects. */
function buildSolicitudes(entries, gestorId) {
  const solicitudes = [];
  for (const entrada of entries) {
    const seen = new Set();
    for (const linea of entrada.lineas) {
      if (linea.proyecto.manager_id !== gestorId) continue;
      if (linea.estado !== 'PENDIENTE') continue;

      const key = `${linea.proyecto.id}:${linea.categoria_ingreso?.id ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);

      solicitudes.push({
        id: entrada.id,
        semana_inicio: entrada.semana_inicio,
        fecha_carga: entrada.fecha_carga,
        usuario: entrada.usuario,
        proyecto_id: linea.proyecto.id,
        proyecto_nombre: linea.proyecto.nombre,
        categoria_id: linea.categoria_ingreso?.id ?? null,
        categoria_nombre: linea.categoria_ingreso?.nombre ?? null,
        lineas: [linea],
        total_horas: linea.horas,
        total_extras: linea.horas_extra,
      });
    }
  }
  return solicitudes;
}

export default function HorasEquipo() {
  const { usuario } = useAuthStore();
  const gestorId = usuario?.id;
  const queryClient = useQueryClient();
  const [modalAprobarConObs, setModalAprobarConObs] = useState(null);
  const [modalRechazar, setModalRechazar] = useState(null);
  const [recordatoriosEnviados, setRecordatoriosEnviados] = useState({});

  // Fetch entries that have pending lines in gestor's projects (backend filters by line status)
  const { data, isLoading } = useQuery({
    queryKey: ['horas-equipo', 'PENDIENTE'],
    queryFn: () => timeEntryApi.listar({ estado: 'PENDIENTE', limit: 100 }).then((r) => r.data),
  });

  const { data: dataSeekers } = useQuery({
    queryKey: ['seekers-sin-carga'],
    queryFn: () => timeEntryApi.seekersSinCarga().then((r) => r.data),
  });

  const entradas = data?.data ?? [];
  const seekersSinCarga = dataSeekers?.data ?? [];

  const solicitudes = useMemo(
    () => buildSolicitudes(entradas, gestorId),
    [entradas, gestorId],
  );

  const mutRecordatorio = useMutation({
    mutationFn: (userId) => timeEntryApi.enviarRecordatorio(userId),
    onSuccess: (_, userId) => {
      setRecordatoriosEnviados((prev) => ({ ...prev, [userId]: Date.now() }));
    },
  });

  function recordatorioReciente(userId) {
    const enviado = recordatoriosEnviados[userId];
    return enviado ? Date.now() - enviado < 24 * 60 * 60 * 1000 : false;
  }

  const mutAprobar = useMutation({
    mutationFn: ({ id, proyecto_id, categoria_id }) =>
      timeEntryApi.aprobar(id, { proyecto_id, categoria_ingreso_id: categoria_id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horas-equipo'] }),
  });

  const mutAprobarConObs = useMutation({
    mutationFn: ({ id, datos }) => timeEntryApi.aprobarConObservacion(id, datos),
    onSuccess: () => {
      setModalAprobarConObs(null);
      queryClient.invalidateQueries({ queryKey: ['horas-equipo'] });
    },
  });

  const mutRechazar = useMutation({
    mutationFn: ({ id, datos }) => timeEntryApi.rechazar(id, datos),
    onSuccess: () => {
      setModalRechazar(null);
      queryClient.invalidateQueries({ queryKey: ['horas-equipo'] });
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mis equipos</h1>
          <p className="text-muted-foreground">Aprueba o rechaza las horas de tu equipo por proyecto</p>
        </div>

        {/* Seekers sin carga */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Seekers con carga pendiente ({seekersSinCarga.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {seekersSinCarga.length === 0 ? (
              <div className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3">
                <CircleCheck className="h-5 w-5 shrink-0 text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  Todo en orden — tu equipo está al día con las cargas
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {seekersSinCarga.map((item) => {
                  const esCritico = item.severidad === 'CRITICO';
                  const yaEnviado = recordatorioReciente(item.usuario.id);
                  return (
                    <div
                      key={item.usuario.id}
                      className={`rounded-md border p-4 flex items-center justify-between gap-4 ${
                        esCritico ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <p className={`font-medium text-sm ${esCritico ? 'text-red-900' : 'text-yellow-900'}`}>
                          {item.usuario.nombres} {item.usuario.apellidos}
                        </p>
                        <p className={`text-xs flex items-center gap-1 ${esCritico ? 'text-red-700' : 'text-yellow-700'}`}>
                          <TriangleAlert className="h-3 w-3 shrink-0" />
                          {item.semanas_sin_carga} semana{item.semanas_sin_carga !== 1 ? 's' : ''} sin carga
                          {item.proyectos_pendientes?.length > 0 && (
                            <>
                              {' '}· Pendiente en:{' '}
                              <span className="font-medium">
                                {item.proyectos_pendientes.map((p) => p.nombre).join(', ')}
                              </span>
                            </>
                          )}
                        </p>
                        {!esCritico && item.proyectos_otros?.length > 0 && (
                          <p className="text-xs text-yellow-700">
                            {item.proyectos_otros.map((p, i) => (
                              <span key={p.nombre}>
                                {i > 0 && ' · '}
                                Cargó {p.semanas} semana{p.semanas !== 1 ? 's' : ''} en:{' '}
                                <span className="font-medium">{p.nombre}</span>
                              </span>
                            ))}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`shrink-0 gap-1.5 ${
                          esCritico
                            ? 'border-red-300 text-red-700 hover:bg-red-100'
                            : 'border-yellow-300 text-yellow-800 hover:bg-yellow-100'
                        }`}
                        disabled={yaEnviado || mutRecordatorio.isPending}
                        onClick={() => mutRecordatorio.mutate(item.usuario.id)}
                      >
                        <Bell className="h-3 w-3" />
                        {yaEnviado ? 'Recordatorio enviado' : 'Enviar recordatorio'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Solicitudes pendientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Solicitudes pendientes de aprobación ({solicitudes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : solicitudes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay horas pendientes de aprobación</p>
            ) : (
              <div className="space-y-3">
                {solicitudes.map((sol) => (
                  <div key={`${sol.id}-${sol.proyecto_id}-${sol.categoria_id ?? ''}`} className="rounded-md border p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {sol.usuario.nombres} {sol.usuario.apellidos}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-700">{sol.proyecto_nombre}</p>
                          {sol.categoria_nombre && (
                            <span className="text-xs text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                              {sol.categoria_nombre}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rangoSemana(sol.semana_inicio)} · {sol.total_horas}h normales
                          {sol.total_extras > 0 ? ` · ${sol.total_extras}h extras` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatearFecha(sol.fecha_carga)}</p>
                        {sol.lineas[0]?.comentario && (
                          <p className="text-xs text-muted-foreground mt-1">— {sol.lineas[0].comentario}</p>
                        )}
                      </div>
                      <Badge variant="warning">{ESTADO_LABELS['PENDIENTE']}</Badge>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="gap-1 bg-green-600 hover:bg-green-700"
                        onClick={() => mutAprobar.mutate({ id: sol.id, proyecto_id: sol.proyecto_id, categoria_id: sol.categoria_id })}
                        disabled={mutAprobar.isPending}
                      >
                        <Check className="h-3 w-3" /> Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 border-teal-300 text-teal-700 hover:bg-teal-50"
                        onClick={() => setModalAprobarConObs(sol)}
                      >
                        <CheckCheck className="h-3 w-3" /> Aprobar con obs.
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => setModalRechazar(sol)}
                      >
                        <X className="h-3 w-3" /> Rechazar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {modalAprobarConObs && (
        <ModalAprobarConObservacion
          solicitud={modalAprobarConObs}
          onCerrar={() => setModalAprobarConObs(null)}
          onConfirmar={(datos) => mutAprobarConObs.mutate({ id: modalAprobarConObs.id, datos })}
        />
      )}

      {modalRechazar && (
        <ModalRechazar
          solicitud={modalRechazar}
          onCerrar={() => setModalRechazar(null)}
          onConfirmar={(datos) => mutRechazar.mutate({ id: modalRechazar.id, datos })}
        />
      )}
    </Layout>
  );
}
