import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { timeEntryApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { formatearFechaHora } from '../../lib/utils';

export default function AjustarHoras() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [lineas, setLineas] = useState([]);
  const [error, setError] = useState('');

  const { data: entrada, isLoading } = useQuery({
    queryKey: ['time-entry', id],
    queryFn: () => timeEntryApi.obtener(id).then((r) => r.data),
  });

  useEffect(() => {
    if (entrada) {
      setLineas(entrada.lineas.map((l) => ({
        id: l.id,
        proyecto_nombre: l.proyecto.nombre,
        horas: l.horas,
        horas_extra: l.horas_extra,
        comentario: l.comentario,
        expandido: true,
      })));
    }
  }, [entrada]);

  function toggleLinea(id) {
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, expandido: !l.expandido } : l)));
  }

  const mutation = useMutation({
    mutationFn: (datos) => timeEntryApi.ajustar(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      navigate('/seeker');
    },
    onError: (err) => setError(err.response?.data?.error || 'Error al guardar'),
  });

  function actualizarLinea(lineaId, campo, valor) {
    setLineas((prev) => prev.map((l) => (l.id === lineaId ? { ...l, [campo]: valor } : l)));
  }

  function manejarSubmit(e) {
    e.preventDefault();
    mutation.mutate({
      lineas: lineas.map((l) => ({
        id: l.id,
        horas: parseFloat(l.horas) || 0,
        horas_extra: parseFloat(l.horas_extra) || 0,
        comentario: l.comentario,
      })),
    });
  }

  if (isLoading) return <Layout><p className="text-muted-foreground">Cargando...</p></Layout>;

  const ultimaObservacion = entrada?.aprobaciones?.slice().reverse().find((a) => a.accion === 'OBSERVADO');

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Ajustar horas</h1>
          <p className="text-muted-foreground">Semana: {entrada?.semana}</p>
        </div>

        {ultimaObservacion && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm text-blue-800">Observación del gestor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-blue-900">{ultimaObservacion.comentario}</p>
              {ultimaObservacion.sugerencia_horas !== null && (
                <p className="text-sm text-blue-700">
                  Sugerencia: {ultimaObservacion.sugerencia_horas}h normales
                  {ultimaObservacion.sugerencia_extras !== null && ` · ${ultimaObservacion.sugerencia_extras}h extras`}
                </p>
              )}
              <p className="text-xs text-blue-600">
                {ultimaObservacion.realizado_por.nombres} {ultimaObservacion.realizado_por.apellidos} · {formatearFechaHora(ultimaObservacion.fecha)}
              </p>
            </CardContent>
          </Card>
        )}

        <form onSubmit={manejarSubmit} className="space-y-4">
          {lineas.map((linea) => (
            <Card key={linea.id}>
              <CardHeader
                className="flex flex-row items-center justify-between pb-2 cursor-pointer select-none"
                onClick={() => toggleLinea(linea.id)}
              >
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-medium">{linea.proyecto_nombre}</CardTitle>
                  {!linea.expandido && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {linea.horas}h normales{linea.horas_extra > 0 ? ` · ${linea.horas_extra}h extras` : ''}
                    </p>
                  )}
                </div>
                <div className={`p-1 transition-transform duration-200 ${linea.expandido ? 'rotate-180' : ''}`}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              {linea.expandido && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Horas (0-24)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={linea.horas}
                        onChange={(e) => actualizarLinea(linea.id, 'horas', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Horas extras (0-8)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="8"
                        step="0.5"
                        value={linea.horas_extra}
                        onChange={(e) => actualizarLinea(linea.id, 'horas_extra', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Comentario</Label>
                    <Textarea
                      value={linea.comentario}
                      onChange={(e) => actualizarLinea(linea.id, 'comentario', e.target.value)}
                      maxLength={500}
                      rows={2}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/seeker')}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Guardar ajuste'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
