import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Clock, Plus } from 'lucide-react';
import { timeEntryApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ESTADO_LABELS, formatearFecha, formatearRangoDeSemana, semanaADomingo } from '../../lib/utils';

const VARIANTE_ESTADO = {
  PENDIENTE: 'warning',
  APROBADO: 'success',
  OBSERVADO: 'info',
  RECHAZADO: 'destructive',
};

function TarjetaEntrada({ entrada, onClick }) {
  const lineas = entrada.lineas || [];
  const proyectosUnicos = [...new Set(lineas.map((l) => l.proyecto?.nombre).filter(Boolean))];

  return (
    <div
      className="cursor-pointer rounded-md border p-4 hover:bg-muted/50 transition-colors"
      onClick={() => onClick(entrada)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium leading-snug">
            {formatearRangoDeSemana(semanaADomingo(entrada.semana)) || entrada.semana}
          </p>
          {proyectosUnicos.length > 0 && (
            <p className="text-sm text-muted-foreground">{proyectosUnicos.join(' · ')}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {entrada.total_horas}h{entrada.total_extras > 0 ? ` + ${entrada.total_extras}h extra` : ''}
          </p>
          <p className="text-xs text-muted-foreground">{formatearFecha(entrada.fecha_carga)}</p>
        </div>
        <Badge variant={VARIANTE_ESTADO[entrada.estado]} className="shrink-0 mt-0.5">
          {ESTADO_LABELS[entrada.estado]}
        </Badge>
      </div>
    </div>
  );
}

export default function HomeSeeker() {
  const navigate = useNavigate();

  const { data: pendientes, isLoading: cargandoPendientes } = useQuery({
    queryKey: ['time-entries', 'PENDIENTE'],
    queryFn: () => timeEntryApi.listar({ estado: 'PENDIENTE' }).then((r) => r.data),
  });

  const { data: observadas } = useQuery({
    queryKey: ['time-entries', 'OBSERVADO'],
    queryFn: () => timeEntryApi.listar({ estado: 'OBSERVADO' }).then((r) => r.data),
  });

  const { data: historico } = useQuery({
    queryKey: ['time-entries', 'historico'],
    queryFn: () => timeEntryApi.listar({ limit: 10 }).then((r) => r.data),
  });

  function manejarClickEntrada(entrada) {
    if (entrada.estado === 'OBSERVADO') navigate(`/seeker/ajustar/${entrada.id}`);
  }

  const cantidadObservadas = observadas?.data?.length ?? 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mis horas</h1>
            <p className="text-muted-foreground">Registro semanal de horas trabajadas</p>
          </div>
          <Button onClick={() => navigate('/seeker/cargar')} className="gap-2">
            <Plus className="h-4 w-4" />
            Cargar horas
          </Button>
        </div>

        {cantidadObservadas > 0 && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-800">
              Tenés {cantidadObservadas} entrada{cantidadObservadas > 1 ? 's' : ''} observada{cantidadObservadas > 1 ? 's' : ''} para ajustar
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Pendientes de aprobación
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cargandoPendientes ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : pendientes?.data?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tenés horas pendientes</p>
              ) : (
                <div className="space-y-2">
                  {pendientes?.data?.map((e) => (
                    <TarjetaEntrada key={e.id} entrada={e} onClick={manejarClickEntrada} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Observadas — requieren ajuste
              </CardTitle>
            </CardHeader>
            <CardContent>
              {observadas?.data?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tenés horas observadas</p>
              ) : (
                <div className="space-y-2">
                  {observadas?.data?.map((e) => (
                    <TarjetaEntrada key={e.id} entrada={e} onClick={manejarClickEntrada} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {historico?.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay registros anteriores</p>
            ) : (
              <div className="space-y-2">
                {historico?.data?.map((e) => (
                  <TarjetaEntrada key={e.id} entrada={e} onClick={manejarClickEntrada} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
