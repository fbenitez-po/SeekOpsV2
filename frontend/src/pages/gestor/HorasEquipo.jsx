import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Eye, X } from 'lucide-react';
import { timeEntryApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { formatearFecha, ESTADO_LABELS } from '../../lib/utils';

function ModalObservar({ entrada, onCerrar, onConfirmar }) {
  const [comentario, setComentario] = useState('');
  const [sugerenciaHoras, setSugerenciaHoras] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-semibold">Observar horas</h2>
        <p className="text-sm text-muted-foreground">{entrada.usuario.nombres} {entrada.usuario.apellidos} — {entrada.semana}</p>

        <div className="space-y-2">
          <Label>Comentario de observación *</Label>
          <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3} placeholder="Explicá qué debe corregir..." />
        </div>
        <div className="space-y-2">
          <Label>Sugerencia de horas (opcional)</Label>
          <Input type="number" min="0" max="24" value={sugerenciaHoras} onChange={(e) => setSugerenciaHoras(e.target.value)} placeholder="ej: 6" />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button className="flex-1" disabled={!comentario} onClick={() => onConfirmar({ comentario_observacion: comentario, sugerencia_horas: sugerenciaHoras ? parseInt(sugerenciaHoras) : null })}>
            Observar
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
  const [modalObservar, setModalObservar] = useState(null);
  const [modalRechazar, setModalRechazar] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['horas-equipo', 'PENDIENTE'],
    queryFn: () => timeEntryApi.listar({ estado: 'PENDIENTE', limit: 50 }).then((r) => r.data),
  });

  const entradas = data?.data || [];

  const mutAprobar = useMutation({
    mutationFn: (id) => timeEntryApi.aprobar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horas-equipo'] }),
  });

  const mutObservar = useMutation({
    mutationFn: ({ id, datos }) => timeEntryApi.observar(id, datos),
    onSuccess: () => {
      setModalObservar(null);
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
          <h1 className="text-2xl font-bold">Horas del equipo</h1>
          <p className="text-muted-foreground">Aprobá, observá o rechazá las horas de tu equipo</p>
        </div>

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
                        className="gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={() => setModalObservar(entrada)}
                      >
                        <Eye className="h-3 w-3" /> Observar
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
      </div>

      {modalObservar && (
        <ModalObservar
          entrada={modalObservar}
          onCerrar={() => setModalObservar(null)}
          onConfirmar={(datos) => mutObservar.mutate({ id: modalObservar.id, datos })}
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
