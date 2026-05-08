import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { timeEntryApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
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

function TarjetaEntrada({ entrada }) {
  const lineas = entrada.lineas || [];
  const proyectosUnicos = [...new Set(lineas.map((l) => l.proyecto?.nombre).filter(Boolean))];
  const obs = entrada.estado === 'APROBADO_CON_OBSERVACION'
    ? entrada.aprobaciones?.find((a) => a.accion === 'APROBADO_CON_OBSERVACION')
    : null;

  return (
    <div className="rounded-md border p-4">
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
          {obs?.comentario && (
            <p className="text-xs text-teal-700 mt-1 border-l-2 border-teal-300 pl-2">{obs.comentario}</p>
          )}
        </div>
        <Badge variant={VARIANTE_ESTADO[entrada.estado]} className="shrink-0 mt-0.5">
          {ESTADO_LABELS[entrada.estado]}
        </Badge>
      </div>
    </div>
  );
}

export default function MisHoras() {
  const navigate = useNavigate();

  const { data: entradas, isLoading } = useQuery({
    queryKey: ['time-entries', 'todas'],
    queryFn: () => timeEntryApi.listar({ limit: 100 }).then((r) => r.data),
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button
            onClick={() => navigate('/seeker')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </button>
          <h1 className="text-2xl font-bold">Mis horas</h1>
          <p className="text-muted-foreground">Historial completo de horas registradas</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Todas las entradas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : !entradas?.data?.length ? (
              <p className="text-sm text-muted-foreground">No hay registros de horas aún</p>
            ) : (
              <div className="space-y-2">
                {entradas.data.map((e) => (
                  <TarjetaEntrada key={e.id} entrada={e} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
