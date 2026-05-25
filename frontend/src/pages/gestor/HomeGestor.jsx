import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Plus, Users } from 'lucide-react';
import { timeEntryApi, projectionApi } from '../../services/api';
import useAuthStore from '../../store/authStore';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ESTADO_LABELS, formatearFecha, rangoSemana } from '../../lib/utils';

const VARIANTE_ESTADO = {
  PENDIENTE: 'warning',
  APROBADO: 'success',
  APROBADO_CON_OBSERVACION: 'success',
  RECHAZADO: 'destructive',
};

function TarjetaEntradaPropia({ entrada, onClick }) {
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
            {rangoSemana(entrada.semana_inicio)}
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

export default function HomeGestor() {
  const navigate = useNavigate();
  const { usuario, esSeeker } = useAuthStore();

  const { data: dataAlertas } = useQuery({
    queryKey: ['proyecciones-alertas'],
    queryFn: () => projectionApi.alertas().then((r) => r.data.data),
  });

  const { data: dataPendientes } = useQuery({
    queryKey: ['time-entries-gestor', 'PENDIENTE'],
    queryFn: () => timeEntryApi.listar({ estado: 'PENDIENTE', limit: 50 }).then((r) => r.data),
  });

  const { data: dataSeekersSinCarga } = useQuery({
    queryKey: ['seekers-sin-carga'],
    queryFn: () => timeEntryApi.seekersSinCarga().then((r) => r.data),
  });

  const { data: dataAprobadas } = useQuery({
    queryKey: ['time-entries-gestor', 'APROBADO_CON_OBSERVACION'],
    queryFn: () => timeEntryApi.listar({ estado: 'APROBADO_CON_OBSERVACION', limit: 50 }).then((r) => r.data),
    enabled: esSeeker(),
  });

  const { data: dataHistorial } = useQuery({
    queryKey: ['time-entries-gestor', 'historico'],
    queryFn: () => timeEntryApi.listar({ limit: 20 }).then((r) => r.data),
    enabled: esSeeker(),
  });

  const { data: semanasSinCarga } = useQuery({
    queryKey: ['time-entries-gestor', 'semanas-sin-carga'],
    queryFn: () => timeEntryApi.semanasSinCarga().then((r) => r.data),
    enabled: esSeeker(),
  });

  const alertasSinProyeccion = dataAlertas || [];
  const todasPendientes = dataPendientes?.data || [];
  const pendientesEquipo = todasPendientes;
  const seekersSinCarga = dataSeekersSinCarga?.data || [];
  const totalHorasEquipo = pendientesEquipo.length + seekersSinCarga.length;
  const misPendientes = todasPendientes.filter((e) => e.usuario.id === usuario?.id);
  const misAprobadas = (dataAprobadas?.data || []).filter((e) => e.usuario.id === usuario?.id);
  const miHistorial = (dataHistorial?.data || []).filter((e) => e.usuario.id === usuario?.id);

  function manejarClickEntradaPropia(_entrada) {
    // Sin acción — aprobadas con observación son de solo lectura
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

        {/* Alertas en fila */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {alertasSinProyeccion.length > 0 && (
            <Card
              className="cursor-pointer border-amber-300 bg-amber-50 hover:bg-amber-100/70 transition-colors"
              onClick={() => navigate('/gestor/proyecciones')}
            >
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      {alertasSinProyeccion.length} sin proyección vigente
                    </p>
                    <p className="text-xs text-amber-700">Ver detalle en Proyecciones</p>
                  </div>
                </div>
                <Badge className="shrink-0 bg-amber-200 text-amber-900 hover:bg-amber-200">
                  {alertasSinProyeccion.length}
                </Badge>
              </CardContent>
            </Card>
          )}

          <Card
            className="cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => navigate('/gestor/equipo')}
          >
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <Users className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Mis equipos</p>
                  {totalHorasEquipo === 0 ? (
                    <p className="text-xs text-muted-foreground">Todo el equipo está al día</p>
                  ) : (
                    <div className="flex items-center gap-3 mt-0.5">
                      {seekersSinCarga.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span className="text-amber-800 font-medium">{seekersSinCarga.length}</span>
                          <span className="text-muted-foreground">sin cargar</span>
                        </span>
                      )}
                      {pendientesEquipo.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                          <span className="text-blue-800 font-medium">{pendientesEquipo.length}</span>
                          <span className="text-muted-foreground">pendientes</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {totalHorasEquipo > 0 && (
                <Badge variant="secondary" className="shrink-0 font-semibold">{totalHorasEquipo}</Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {esSeeker() && (
          <div className="space-y-6 border-t pt-6">
            <h2 className="text-lg font-semibold">Mis horas</h2>

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
                        {semanasSinCarga.semanas.slice(0, 2).map((s) => (
                          <li key={s.semana_inicio} className="text-xs text-muted-foreground">· {rangoSemana(s.semana_inicio)}</li>
                        ))}
                        {semanasSinCarga.total > 2 && (
                          <li className="text-xs text-muted-foreground">
                            · y {semanasSinCarga.total - 2} semana{semanasSinCarga.total - 2 > 1 ? 's' : ''} más
                          </li>
                        )}
                      </ul>
                      <Button size="sm" onClick={() => navigate('/gestor/cargar')} className="w-full">
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
                    Mis pendientes de aprobación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {misPendientes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tienes horas pendientes</p>
                  ) : (
                    <div className="space-y-2">
                      {misPendientes.slice(0, 2).map((e) => (
                        <TarjetaEntradaPropia key={e.id} entrada={e} onClick={manejarClickEntradaPropia} />
                      ))}
                      {misPendientes.length > 2 && (
                        <button
                          onClick={() => navigate('/gestor/mis-horas')}
                          className="w-full pt-1 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                        >
                          Ver {misPendientes.length - 2} más →
                        </button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Aprobadas con observación</CardTitle>
                </CardHeader>
                <CardContent>
                  {misAprobadas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tienes horas aprobadas con observación</p>
                  ) : (
                    <div className="space-y-2">
                      {misAprobadas.slice(0, 2).map((e) => (
                        <TarjetaEntradaPropia key={e.id} entrada={e} onClick={manejarClickEntradaPropia} />
                      ))}
                      {misAprobadas.length > 2 && (
                        <button
                          onClick={() => navigate('/gestor/mis-horas')}
                          className="w-full pt-1 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                        >
                          Ver {misAprobadas.length - 2} más →
                        </button>
                      )}
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
                    {miHistorial.slice(0, 3).map((e) => (
                      <TarjetaEntradaPropia key={e.id} entrada={e} onClick={manejarClickEntradaPropia} />
                    ))}
                    <button
                      onClick={() => navigate('/gestor/mis-horas')}
                      className="w-full pt-1 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                    >
                      Ver historial completo →
                    </button>
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
