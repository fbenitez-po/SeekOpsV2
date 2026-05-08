import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Plus } from 'lucide-react';
import { timeEntryApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ESTADO_LABELS, formatearFecha, formatearRangoDeSemana, semanaADomingo } from '../../lib/utils';

const VARIANTE_ESTADO = {
  PENDIENTE: 'warning',
  APROBADO: 'success',
  APROBADO_CON_OBSERVACION: 'success',
  OBSERVADO: 'info',
  RECHAZADO: 'destructive',
};

function TarjetaEntrada({ entrada, onClick }) {
  const lineas = entrada.lineas || [];
  const proyectosUnicos = [...new Set(lineas.map((l) => l.proyecto?.nombre).filter(Boolean))];
  const obs = entrada.estado === 'APROBADO_CON_OBSERVACION'
    ? entrada.aprobaciones?.find((a) => a.accion === 'APROBADO_CON_OBSERVACION')
    : null;

  return (
    <div
      className="cursor-pointer rounded-md border px-3 py-2 hover:bg-muted/50 transition-colors"
      onClick={() => onClick(entrada)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug truncate">
            {formatearRangoDeSemana(semanaADomingo(entrada.semana)) || entrada.semana}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {proyectosUnicos.length > 0 ? proyectosUnicos.join(' · ') + ' · ' : ''}
            {entrada.total_horas}h{entrada.total_extras > 0 ? ` + ${entrada.total_extras}h extra` : ''}
          </p>
          {obs?.comentario && (
            <p className="text-xs text-teal-700 mt-0.5 border-l-2 border-teal-300 pl-2 truncate">{obs.comentario}</p>
          )}
        </div>
        <Badge variant={VARIANTE_ESTADO[entrada.estado]} className="shrink-0 text-xs">
          {ESTADO_LABELS[entrada.estado]}
        </Badge>
      </div>
    </div>
  );
}

export default function HomeSeeker() {
  const navigate = useNavigate();

  const { data: semanasSinCarga } = useQuery({
    queryKey: ['time-entries', 'semanas-sin-carga'],
    queryFn: () => timeEntryApi.semanasSinCarga().then((r) => r.data),
  });

  const { data: pendientes, isLoading: cargandoPendientes } = useQuery({
    queryKey: ['time-entries', 'PENDIENTE'],
    queryFn: () => timeEntryApi.listar({ estado: 'PENDIENTE' }).then((r) => r.data),
  });

  const { data: aprobadas } = useQuery({
    queryKey: ['time-entries', 'APROBADO_CON_OBSERVACION'],
    queryFn: () => timeEntryApi.listar({ estado: 'APROBADO_CON_OBSERVACION' }).then((r) => r.data),
  });

  const { data: historico } = useQuery({
    queryKey: ['time-entries', 'historico'],
    queryFn: () => timeEntryApi.listar({ limit: 3 }).then((r) => r.data),
  });

  function manejarClickEntrada(_entrada) {
    // Las entradas aprobadas con observación son de solo lectura — sin acción al hacer clic
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Inicio</h1>
            <p className="text-muted-foreground">Resumen de tus horas</p>
          </div>
          <Button onClick={() => navigate('/seeker/cargar')} className="gap-2">
            <Plus className="h-4 w-4" />
            Cargar horas
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Semanas sin cargar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!semanasSinCarga || semanasSinCarga.total === 0 ? (
                <p className="text-sm text-muted-foreground">Estás al día</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-amber-700">
                    {semanasSinCarga.total} semana{semanasSinCarga.total > 1 ? 's' : ''} pendiente{semanasSinCarga.total > 1 ? 's' : ''}
                  </p>
                  <ul className="space-y-1">
                    {semanasSinCarga.semanas.slice(0, 2).map((semana) => {
                      const domingo = semanaADomingo(semana);
                      const rango = domingo ? formatearRangoDeSemana(domingo) : semana;
                      return (
                        <li key={semana} className="text-xs text-muted-foreground">· {rango}</li>
                      );
                    })}
                    {semanasSinCarga.total > 2 && (
                      <li className="text-xs text-muted-foreground">
                        · y {semanasSinCarga.total - 2} semana{semanasSinCarga.total - 2 > 1 ? 's' : ''} más
                      </li>
                    )}
                  </ul>
                  <Button size="sm" onClick={() => navigate('/seeker/cargar')} className="w-full">
                    Cargar horas
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

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
                  {pendientes?.data?.slice(0, 2).map((e) => (
                    <TarjetaEntrada key={e.id} entrada={e} onClick={manejarClickEntrada} />
                  ))}
                  {pendientes?.data?.length > 2 && (
                    <button
                      onClick={() => navigate('/seeker/mis-horas')}
                      className="w-full pt-1 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                    >
                      Ver {pendientes.data.length - 2} más →
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Aprobadas con observación
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!aprobadas || aprobadas?.data?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tenés horas aprobadas con observación</p>
              ) : (
                <div className="space-y-2">
                  {aprobadas?.data?.slice(0, 2).map((e) => (
                    <TarjetaEntrada key={e.id} entrada={e} onClick={manejarClickEntrada} />
                  ))}
                  {aprobadas?.data?.length > 2 && (
                    <button
                      onClick={() => navigate('/seeker/mis-horas')}
                      className="w-full pt-1 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                    >
                      Ver {aprobadas.data.length - 2} más →
                    </button>
                  )}
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
                <button
                  onClick={() => navigate('/seeker/mis-horas')}
                  className="w-full pt-1 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  Ver historial completo →
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
