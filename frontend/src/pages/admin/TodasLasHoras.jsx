import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Eye, X } from 'lucide-react';
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
  RECHAZADO: 'destructive',
};

function ModalAccion({ tipo, entrada, onCerrar, onConfirmar }) {
  const [comentario, setComentario] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-semibold">{tipo === 'observar' ? 'Observar' : 'Rechazar'} horas</h2>
        <p className="text-sm text-muted-foreground">{entrada.usuario.nombres} {entrada.usuario.apellidos} — {entrada.semana}</p>
        <div className="space-y-2">
          <Label>{tipo === 'observar' ? 'Comentario de observación *' : 'Razón del rechazo *'}</Label>
          <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3} />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button className={`flex-1 ${tipo === 'rechazar' ? 'bg-destructive hover:bg-destructive/90' : ''}`} disabled={!comentario} onClick={() => onConfirmar(comentario)}>
            {tipo === 'observar' ? 'Observar' : 'Rechazar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TodasLasHoras() {
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState('TODOS');
  const [modal, setModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['todas-horas', estado],
    queryFn: () => timeEntryApi.listar({ ...(estado !== 'TODOS' ? { estado } : {}), limit: 50 }).then((r) => r.data),
  });

  const mutAprobar = useMutation({
    mutationFn: (id) => timeEntryApi.aprobar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todas-horas'] }),
  });

  const mutObservar = useMutation({
    mutationFn: ({ id, comentario }) => timeEntryApi.observar(id, { comentario_observacion: comentario }),
    onSuccess: () => { setModal(null); queryClient.invalidateQueries({ queryKey: ['todas-horas'] }); },
  });

  const mutRechazar = useMutation({
    mutationFn: ({ id, comentario }) => timeEntryApi.rechazar(id, { razon_rechazo: comentario }),
    onSuccess: () => { setModal(null); queryClient.invalidateQueries({ queryKey: ['todas-horas'] }); },
  });

  const entradas = data?.data || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Todas las horas</h1>
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              <SelectItem value="PENDIENTE">Pendiente</SelectItem>
              <SelectItem value="APROBADO">Aprobado</SelectItem>
              <SelectItem value="RECHAZADO">Rechazado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
            ) : entradas.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No hay registros</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Seeker</th>
                    <th className="px-4 py-3 text-left font-medium">Semana</th>
                    <th className="px-4 py-3 text-left font-medium">Horas</th>
                    <th className="px-4 py-3 text-left font-medium">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {entradas.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{e.usuario.nombres} {e.usuario.apellidos}</td>
                      <td className="px-4 py-3">{e.semana}</td>
                      <td className="px-4 py-3">{e.total_horas}h + {e.total_extras}h ext.</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatearFecha(e.fecha_carga)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={VARIANTE_ESTADO[e.estado]}>{ESTADO_LABELS[e.estado]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {e.estado === 'PENDIENTE' && (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="text-green-700" onClick={() => mutAprobar.mutate(e.id)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-blue-700" onClick={() => setModal({ tipo: 'observar', entrada: e })}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-700" onClick={() => setModal({ tipo: 'rechazar', entrada: e })}>
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
          entrada={modal.entrada}
          onCerrar={() => setModal(null)}
          onConfirmar={(comentario) => {
            if (modal.tipo === 'observar') mutObservar.mutate({ id: modal.entrada.id, comentario });
            else mutRechazar.mutate({ id: modal.entrada.id, comentario });
          }}
        />
      )}
    </Layout>
  );
}
