import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Plus, XCircle } from 'lucide-react';
import { timeEntryApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ESTADO_LABELS, rangoSemana } from '../../lib/utils';

const VARIANTE_ESTADO = {
  PENDIENTE: 'warning',
  APROBADO: 'success',
  APROBADO_CON_OBSERVACION: 'success',
  RECHAZADO: 'destructive',
};

function agruparPorProyecto(lineas) {
  const map = new Map();
  for (const l of lineas ?? []) {
    const pid = l.proyecto?.id;
    if (!pid) continue;
    if (!map.has(pid)) map.set(pid, { ...l.proyecto, estados: [] });
    map.get(pid).estados.push(l.estado);
  }
  return [...map.values()].map((g) => {
    const es = g.estados;
    const estado = es.includes('PENDIENTE') ? 'PENDIENTE'
      : es.includes('RECHAZADO') ? 'RECHAZADO'
      : es.includes('APROBADO_CON_OBSERVACION') ? 'APROBADO_CON_OBSERVACION'
      : 'APROBADO';
    return { ...g, estado };
  });
}

function TarjetaEntrada({ entrada, onRecargar }) {
  const grupos = agruparPorProyecto(entrada.lineas);
  const hayMixto = grupos.some((g) => g.estado !== grupos[0].estado);

  return (
    <div className="rounded-md border px-3 py-2 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug truncate">
            {rangoSemana(entrada.semana_inicio)}
          </p>
          <p className="text-xs text-muted-foreground">
            {entrada.total_horas}h{entrada.total_extras > 0 ? ` + ${entrada.total_extras}h extra` : ''}
          </p>
        </div>
        <Badge variant={VARIANTE_ESTADO[entrada.estado]} className="shrink-0 text-xs">
          {ESTADO_LABELS[entrada.estado]}
        </Badge>
      </div>

      {(hayMixto || grupos.length > 1) && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {grupos.map((g) => (
            <div key={g.id} className="flex items-center gap-1">
              <Badge variant={VARIANTE_ESTADO[g.estado]} className="text-xs">
                {g.codigo ?? g.nombre}
              </Badge>
              {g.estado === 'RECHAZADO' && onRecargar && (
                <button
                  onClick={() => onRecargar(entrada.semana_inicio, g.id)}
                  className="text-xs text-destructive underline underline-offset-2 hover:text-destructive/80"
                >
                  Re-cargar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
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

  const { data: rechazadas } = useQuery({
    queryKey: ['time-entries', 'RECHAZADO'],
    queryFn: () => timeEntryApi.listar({ estado: 'RECHAZADO' }).then((r) => r.data),
  });

  const { data: aprobadas } = useQuery({
    queryKey: ['time-entries', 'APROBADO_CON_OBSERVACION'],
    queryFn: () => timeEntryApi.listar({ estado: 'APROBADO_CON_OBSERVACION' }).then((r) => r.data),
  });

  const { data: historico } = useQuery({
    queryKey: ['time-entries', 'historico'],
    queryFn: () => timeEntryApi.listar({ limit: 3 }).then((r) => r.data),
  });

  function handleRecargar(semanaInicio, proyectoId) {
    navigate('/seeker/cargar', { state: { semanaInicio, proyectoId } });
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
          {/* Semanas sin cargar */}
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
                    {semanasSinCarga.semanas.slice(0, 2).map((s) => (
                      <li key={s.semana_inicio} className="text-xs text-muted-foreground">· {rangoSemana(s.semana_inicio)}</li>
                    ))}
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

          {/* Pendientes de aprobación */}
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
                <p className="text-sm text-muted-foreground">No tienes horas pendientes</p>
              ) : (
                <div className="space-y-2">
                  {pendientes?.data?.slice(0, 2).map((e) => (
                    <TarjetaEntrada key={e.id} entrada={e} onRecargar={handleRecargar} />
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

          {/* Proyectos rechazados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <XCircle className="h-4 w-4 text-destructive" />
                Proyectos rechazados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!rechazadas || rechazadas?.data?.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin proyectos rechazados</p>
              ) : (
                <div className="space-y-2">
                  {rechazadas?.data?.slice(0, 2).map((e) => (
                    <TarjetaEntrada key={e.id} entrada={e} onRecargar={handleRecargar} />
                  ))}
                  {rechazadas?.data?.length > 2 && (
                    <button
                      onClick={() => navigate('/seeker/mis-horas')}
                      className="w-full pt-1 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                    >
                      Ver {rechazadas.data.length - 2} más →
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Aprobadas con observación */}
        {aprobadas?.data?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aprobadas con observación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {aprobadas.data.slice(0, 3).map((e) => (
                  <TarjetaEntrada key={e.id} entrada={e} />
                ))}
                {aprobadas.data.length > 3 && (
                  <button
                    onClick={() => navigate('/seeker/mis-horas')}
                    className="w-full pt-1 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                  >
                    Ver {aprobadas.data.length - 3} más →
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historial reciente */}
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
                  <TarjetaEntrada key={e.id} entrada={e} onRecargar={handleRecargar} />
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
