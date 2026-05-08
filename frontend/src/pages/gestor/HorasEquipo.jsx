import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCheck, X, Bell, CircleCheck } from 'lucide-react';
import { timeEntryApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { formatearFecha, ESTADO_LABELS } from '../../lib/utils';

function ModalAprobarConObservacion({ entrada, onCerrar, onConfirmar }) {
  const [comentario, setComentario] = useState('');
  const [lineas, setLineas] = useState(
    entrada.lineas.map((l) => ({ id: l.id, horas: l.horas, horas_extra: l.horas_extra }))
  );

  function actualizarLinea(idx, campo, valor) {
    setLineas((prev) => prev.map((l, i) => i === idx ? { ...l, [campo]: valor === '' ? '' : Number(valor) } : l));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">Aprobar con observación</h2>
        <p className="text-sm text-muted-foreground">{entrada.usuario.nombres} {entrada.usuario.apellidos} — {entrada.semana}</p>
        <p className="text-sm text-muted-foreground">Las horas quedarán aprobadas con el comentario registrado.</p>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Horas por proyecto</Label>
          <div className="rounded-md border divide-y">
            {entrada.lineas.map((linea, idx) => (
              <div key={linea.id} className="flex items-center gap-3 p-3">
                <p className="flex-1 text-sm font-medium truncate">{linea.proyecto.nombre}</p>
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
          <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3} placeholder="Indicá qué observás sobre estas horas..." />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={!comentario} onClick={() => onConfirmar({ comentario_observacion: comentario, lineas })}>
            Aprobar con observación
          </Button>
        </div>
      </div>
    </div>
  );
}

function ModalRechazar({ entrada, onCerrar, onConfirmar }) {
  const [razon, setRazon] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-semibold">Rechazar horas</h2>
        <p className="text-sm text-muted-foreground">{entrada.usuario.nombres} {entrada.usuario.apellidos} — {entrada.semana}</p>

        <div className="space-y-2">
          <Label>Razón del rechazo *</Label>
          <Textarea value={razon} onChange={(e) => setRazon(e.target.value)} rows={3} placeholder="Explicá por qué se rechazan estas horas..." />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button variant="destructive" className="flex-1" disabled={!razon} onClick={() => onConfirmar({ razon_rechazo: razon, permitir_reenvio: false })}>
            Rechazar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function HorasEquipo() {
  const queryClient = useQueryClient();
  const [modalAprobarConObs, setModalAprobarConObs] = useState(null);
  const [modalRechazar, setModalRechazar] = useState(null);
  const [recordatoriosEnviados, setRecordatoriosEnviados] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['horas-equipo', 'PENDIENTE'],
    queryFn: () => timeEntryApi.listar({ estado: 'PENDIENTE', limit: 50 }).then((r) => r.data),
  });

  const { data: dataSeekers } = useQuery({
    queryKey: ['seekers-sin-carga'],
    queryFn: () => timeEntryApi.seekersSinCarga().then((r) => r.data),
  });

  const { data: dataAprobadas } = useQuery({
    queryKey: ['horas-equipo', 'APROBADO_CON_OBSERVACION'],
    queryFn: () => timeEntryApi.listar({ estado: 'APROBADO_CON_OBSERVACION', limit: 50 }).then((r) => r.data),
  });

  const entradas = data?.data || [];
  const entradasAprobadas = dataAprobadas?.data || [];
  const seekersSinCarga = dataSeekers?.data || [];

  const mutRecordatorio = useMutation({
    mutationFn: (userId) => timeEntryApi.enviarRecordatorio(userId),
    onSuccess: (_, userId) => {
      setRecordatoriosEnviados((prev) => ({ ...prev, [userId]: Date.now() }));
    },
  });

  function recordatorioReciente(userId) {
    const enviado = recordatoriosEnviados[userId];
    if (!enviado) return false;
    return Date.now() - enviado < 24 * 60 * 60 * 1000;
  }

  const mutAprobar = useMutation({
    mutationFn: (id) => timeEntryApi.aprobar(id),
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
          <p className="text-muted-foreground">Aprobá o rechazá las horas de tu equipo</p>
        </div>

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
                  <p className="text-sm font-medium text-green-800">Todo en orden — tu equipo está al día con las cargas</p>
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
                        esCritico
                          ? 'border-red-200 bg-red-50'
                          : 'border-yellow-200 bg-yellow-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className={`font-medium text-sm ${esCritico ? 'text-red-900' : 'text-yellow-900'}`}>
                          {item.usuario.nombres} {item.usuario.apellidos}
                        </p>
                        <p className={`text-xs ${esCritico ? 'text-red-700' : 'text-yellow-700'}`}>
                          {item.semanas_sin_carga} semana{item.semanas_sin_carga !== 1 ? 's' : ''} sin carga
                          {item.proyectos_pendientes?.length > 0 && (
                            <> · Pendiente en: <span className="font-medium">{item.proyectos_pendientes.map((p) => p.nombre).join(', ')}</span></>
                          )}
                          {!esCritico && item.proyectos_otros?.length > 0 && (
                            <> · Cargó en: <span className="font-medium">{item.proyectos_otros.join(', ')}</span></>
                          )}
                        </p>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pendientes de aprobación ({entradas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : entradas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay horas pendientes de aprobación</p>
            ) : (
              <div className="space-y-3">
                {entradas.map((entrada) => (
                  <div key={entrada.id} className="rounded-md border p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{entrada.usuario.nombres} {entrada.usuario.apellidos}</p>
                        <p className="text-sm text-muted-foreground">
                          {entrada.semana} · {entrada.total_horas}h normales · {entrada.total_extras}h extras
                        </p>
                        <p className="text-xs text-muted-foreground">{formatearFecha(entrada.fecha_carga)}</p>
                        <div className="mt-2 space-y-1">
                          {entrada.lineas.map((l) => (
                            <p key={l.id} className="text-xs text-muted-foreground">
                              {l.proyecto.nombre}: {l.horas}h{l.horas_extra > 0 ? ` + ${l.horas_extra}h extras` : ''}
                              {l.comentario ? ` — ${l.comentario}` : ''}
                            </p>
                          ))}
                        </div>
                      </div>
                      <Badge variant="warning">{ESTADO_LABELS[entrada.estado]}</Badge>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="gap-1 bg-green-600 hover:bg-green-700"
                        onClick={() => mutAprobar.mutate(entrada.id)}
                        disabled={mutAprobar.isPending}
                      >
                        <Check className="h-3 w-3" /> Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 border-teal-300 text-teal-700 hover:bg-teal-50"
                        onClick={() => setModalAprobarConObs(entrada)}
                      >
                        <CheckCheck className="h-3 w-3" /> Aprobar con obs.
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => setModalRechazar(entrada)}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Aprobadas con observación ({entradasAprobadas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entradasAprobadas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay entradas aprobadas con observación</p>
            ) : (
              <div className="space-y-3">
                {entradasAprobadas.map((entrada) => {
                  const obs = entrada.aprobaciones?.find((a) => a.accion === 'APROBADO_CON_OBSERVACION');
                  return (
                    <div key={entrada.id} className="rounded-md border border-teal-200 bg-teal-50 p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{entrada.usuario.nombres} {entrada.usuario.apellidos}</p>
                          <p className="text-sm text-muted-foreground">
                            {entrada.semana} · {entrada.total_horas}h normales · {entrada.total_extras}h extras
                          </p>
                          <p className="text-xs text-muted-foreground">{formatearFecha(entrada.fecha_carga)}</p>
                          {obs?.comentario && (
                            <p className="text-xs text-teal-700 mt-1">Obs: {obs.comentario}</p>
                          )}
                        </div>
                        <Badge className="bg-teal-100 text-teal-800 shrink-0">Aprobado con obs.</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {modalAprobarConObs && (
        <ModalAprobarConObservacion
          entrada={modalAprobarConObs}
          onCerrar={() => setModalAprobarConObs(null)}
          onConfirmar={(datos) => mutAprobarConObs.mutate({ id: modalAprobarConObs.id, datos })}
        />
      )}

      {modalRechazar && (
        <ModalRechazar
          entrada={modalRechazar}
          onCerrar={() => setModalRechazar(null)}
          onConfirmar={(datos) => mutRechazar.mutate({ id: modalRechazar.id, datos })}
        />
      )}
    </Layout>
  );
}
