import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Eye, X } from 'lucide-react';
import { timeEntryApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { ESTADO_LABELS, formatearFecha } from '../../lib/utils';

const VARIANTE_ESTADO = {
  PENDIENTE: 'warning',
  APROBADO: 'success',
  APROBADO_CON_OBSERVACION: 'success',
  RECHAZADO: 'destructive',
};

function rollupLineas(lineas) {
  const estados = lineas.map((l) => l.estado);
  if (estados.includes('PENDIENTE')) return 'PENDIENTE';
  if (estados.includes('RECHAZADO')) return 'RECHAZADO';
  if (estados.includes('APROBADO_CON_OBSERVACION')) return 'APROBADO_CON_OBSERVACION';
  return 'APROBADO';
}

function ModalAccion({ tipo, solicitud, onCerrar, onConfirmar }) {
  const [comentario, setComentario] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-semibold">{tipo === 'observar' ? 'Observar' : 'Rechazar'} horas</h2>
        <p className="text-sm text-muted-foreground">
          {solicitud.nombres} {solicitud.apellidos} — {solicitud.semana} — {solicitud.proyecto_nombre}
        </p>
        <div className="space-y-2">
          <Label>{tipo === 'observar' ? 'Comentario de observación *' : 'Razón del rechazo *'}</Label>
          <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3} />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button
            className={`flex-1 ${tipo === 'rechazar' ? 'bg-destructive hover:bg-destructive/90' : ''}`}
            disabled={!comentario}
            onClick={() => onConfirmar(comentario)}
          >
            {tipo === 'observar' ? 'Observar' : 'Rechazar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TodasLasHoras() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [modal, setModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['todas-horas', estadoFiltro],
    queryFn: () => timeEntryApi.listar({ ...(estadoFiltro !== 'TODOS' ? { estado: estadoFiltro } : {}), limit: 50 }).then((r) => r.data),
  });

  const mutAprobar = useMutation({
    mutationFn: ({ id, proyecto_id }) => timeEntryApi.aprobar(id, { proyecto_id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todas-horas'] }),
  });

  const mutObservar = useMutation({
    mutationFn: ({ id, proyecto_id, comentario }) =>
      timeEntryApi.observar(id, { proyecto_id, comentario_observacion: comentario }),
    onSuccess: () => { setModal(null); queryClient.invalidateQueries({ queryKey: ['todas-horas'] }); },
  });

  const mutRechazar = useMutation({
    mutationFn: ({ id, proyecto_id, comentario }) =>
      timeEntryApi.rechazar(id, { proyecto_id, razon_rechazo: comentario, permitir_reenvio: true }),
    onSuccess: () => { setModal(null); queryClient.invalidateQueries({ queryKey: ['todas-horas'] }); },
  });

  // Flatten entries into per-project rows
  const solicitudes = useMemo(() => {
    if (!data?.data) return [];
    const rows = [];
    for (const e of data.data) {
      const porProyecto = new Map();
      for (const l of e.lineas ?? []) {
        const pid = l.proyecto?.id;
        if (!pid) continue;
        if (!porProyecto.has(pid)) porProyecto.set(pid, { proyecto: l.proyecto, lineas: [] });
        porProyecto.get(pid).lineas.push(l);
      }
      for (const [pid, g] of porProyecto) {
        const estado = rollupLineas(g.lineas);
        rows.push({
          entrada_id: e.id,
          proyecto_id: pid,
          proyecto_nombre: g.proyecto.nombre,
          nombres: e.usuario.nombres,
          apellidos: e.usuario.apellidos,
          semana: e.semana,
          fecha_carga: e.fecha_carga,
          horas: g.lineas.reduce((s, l) => s + l.horas, 0),
          horas_extra: g.lineas.reduce((s, l) => s + l.horas_extra, 0),
          estado,
        });
      }
    }
    return rows;
  }, [data]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </button>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Todas las horas</h1>
          <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              <SelectItem value="PENDIENTE">Pendiente</SelectItem>
              <SelectItem value="APROBADO">Aprobado</SelectItem>
              <SelectItem value="APROBADO_CON_OBSERVACION">Aprobado con obs.</SelectItem>
              <SelectItem value="RECHAZADO">Rechazado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
            ) : solicitudes.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No hay registros</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Seeker</th>
                    <th className="px-4 py-3 text-left font-medium">Semana</th>
                    <th className="px-4 py-3 text-left font-medium">Proyecto</th>
                    <th className="px-4 py-3 text-left font-medium">Horas</th>
                    <th className="px-4 py-3 text-left font-medium">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((s) => (
                    <tr key={`${s.entrada_id}-${s.proyecto_id}`} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{s.nombres} {s.apellidos}</td>
                      <td className="px-4 py-3">{s.semana}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.proyecto_nombre}</td>
                      <td className="px-4 py-3">{s.horas}h{s.horas_extra > 0 ? ` + ${s.horas_extra}h ext.` : ''}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatearFecha(s.fecha_carga)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={VARIANTE_ESTADO[s.estado]}>{ESTADO_LABELS[s.estado]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {s.estado === 'PENDIENTE' && (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm" variant="ghost" className="text-green-700"
                              disabled={mutAprobar.isPending}
                              onClick={() => mutAprobar.mutate({ id: s.entrada_id, proyecto_id: s.proyecto_id })}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm" variant="ghost" className="text-blue-700"
                              onClick={() => setModal({ tipo: 'observar', solicitud: s })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm" variant="ghost" className="text-red-700"
                              onClick={() => setModal({ tipo: 'rechazar', solicitud: s })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {modal && (
        <ModalAccion
          tipo={modal.tipo}
          solicitud={modal.solicitud}
          onCerrar={() => setModal(null)}
          onConfirmar={(comentario) => {
            const { entrada_id, proyecto_id } = modal.solicitud;
            if (modal.tipo === 'observar') {
              mutObservar.mutate({ id: entrada_id, proyecto_id, comentario });
            } else {
              mutRechazar.mutate({ id: entrada_id, proyecto_id, comentario });
            }
          }}
        />
      )}
    </Layout>
  );
}
