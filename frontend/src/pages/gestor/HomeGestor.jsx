import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Clock, Plus, Users } from 'lucide-react';
import { timeEntryApi } from '../../services/api';
import useAuthStore from '../../store/authStore';
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

function TarjetaEntradaPropia({ entrada, onClick }) {
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

export default function HomeGestor() {
  const navigate = useNavigate();
  const { usuario, esSeeker } = useAuthStore();

  const { data: dataPendientes } = useQuery({
    queryKey: ['time-entries-gestor', 'PENDIENTE'],
    queryFn: () => timeEntryApi.listar({ estado: 'PENDIENTE', limit: 50 }).then((r) => r.data),
  });

  const { data: dataObservadas } = useQuery({
    queryKey: ['time-entries-gestor', 'OBSERVADO'],
    queryFn: () => timeEntryApi.listar({ estado: 'OBSERVADO', limit: 50 }).then((r) => r.data),
    enabled: esSeeker(),
  });

  const { data: dataHistorial } = useQuery({
    queryKey: ['time-entries-gestor', 'historico'],
    queryFn: () => timeEntryApi.listar({ limit: 20 }).then((r) => r.data),
    enabled: esSeeker(),
  });

  const todasPendientes = dataPendientes?.data || [];
  const pendientesEquipo = todasPendientes;
  const misPendientes = todasPendientes.filter((e) => e.usuario.id === usuario?.id);
  const misObservadas = (dataObservadas?.data || []).filter((e) => e.usuario.id === usuario?.id);
  const miHistorial = (dataHistorial?.data || []).filter((e) => e.usuario.id === usuario?.id);

  const cantidadObservadas = misObservadas.length;

  function manejarClickEntradaPropia(entrada) {
    if (entrada.estado === 'OBSERVADO') navigate(`/seeker/ajustar/${entrada.id}`);
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Inicio</h1>
            <p className="text-muted-foreground">Bienvenido, {usuario?.nombres}</p>
          </div>
          <Button onClick={() => navigate('/gestor/cargar')} className="gap-2">
            <Plus className="h-4 w-4" />
            Cargar mis horas
          </Button>
        </div>

        <Card
          className="cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => navigate('/gestor/equipo')}
        >
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Users className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="font-semibold">Horas del equipo pendientes</p>
                <p className="text-sm text-muted-foreground">
                  {pendientesEquipo.length === 0
                    ? 'No hay horas pendientes de aprobación'
                    : `${pendientesEquipo.length} entrada${pendientesEquipo.length > 1 ? 's' : ''} esperando tu revisión`}
                </p>
              </div>
            </div>
            {pendientesEquipo.length > 0 && (
              <Badge variant="warning">{pendientesEquipo.length}</Badge>
            )}
          </CardContent>
        </Card>

        {esSeeker() && (
          <div className="space-y-6 border-t pt-6">
            <h2 className="text-lg font-semibold">Mis horas</h2>

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
                    Mis pendientes de aprobación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {misPendientes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tenés horas pendientes</p>
                  ) : (
                    <div className="space-y-2">
                      {misPendientes.map((e) => (
                        <TarjetaEntradaPropia key={e.id} entrada={e} onClick={manejarClickEntradaPropia} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Observadas — requieren ajuste</CardTitle>
                </CardHeader>
                <CardContent>
                  {misObservadas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tenés horas observadas</p>
                  ) : (
                    <div className="space-y-2">
                      {misObservadas.map((e) => (
                        <TarjetaEntradaPropia key={e.id} entrada={e} onClick={manejarClickEntradaPropia} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mi historial reciente</CardTitle>
              </CardHeader>
              <CardContent>
                {miHistorial.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay registros anteriores</p>
                ) : (
                  <div className="space-y-2">
                    {miHistorial.map((e) => (
                      <TarjetaEntradaPropia key={e.id} entrada={e} onClick={manejarClickEntradaPropia} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
