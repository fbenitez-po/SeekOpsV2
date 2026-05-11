import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp, Receipt, ShoppingCart, Lock, LockOpen, ChevronRight, UserRound } from 'lucide-react';
import { periodosApi, ingresosApi, gastosAdminApi, costosVentaApi, costosPorPersonaApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatMonto(valor) {
  return Number(valor ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });
}

function TarjetaTotal({ titulo, monto, icono: Icon, color, onClick }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
        <div className={`rounded-md p-2 ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{formatMonto(monto)}</p>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-0.5">
          Ver detalle <ChevronRight className="h-3 w-3" />
        </p>
      </CardContent>
    </Card>
  );
}

export default function PeriodoDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: periodos = [] } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosApi.listar().then((r) => r.data),
  });

  const periodo = periodos.find((p) => p.id === id);

  const { data: ingresos = [] } = useQuery({
    queryKey: ['ingresos', id],
    queryFn: () => ingresosApi.listar({ periodo_id: id }).then((r) => r.data),
  });

  const { data: gastos = [] } = useQuery({
    queryKey: ['gastos-admin', id],
    queryFn: () => gastosAdminApi.listar({ periodo_id: id }).then((r) => r.data),
  });

  const { data: costosVenta = [] } = useQuery({
    queryKey: ['costos-venta', id],
    queryFn: () => costosVentaApi.listar({ periodo_id: id }).then((r) => r.data),
  });

  const { data: costosPorPersona = [] } = useQuery({
    queryKey: ['costos-por-persona', id],
    queryFn: () => costosPorPersonaApi.listar({ periodo_id: id }).then((r) => r.data),
  });

  const mutToggle = useMutation({
    mutationFn: () => periodosApi.toggle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['periodos'] }),
  });

  const totalIngresos = ingresos.reduce((acc, i) => acc + Number(i.monto ?? 0), 0);
  const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto ?? 0), 0);
  const totalCostosVenta = costosVenta.reduce((acc, c) => acc + Number(c.monto ?? 0), 0);
  const totalCostosPorPersona = costosPorPersona.reduce((acc, c) => acc + Number(c.remuneracion ?? 0), 0);

  const periodosOrdenados = [...periodos].sort((a, b) => b.anio - a.anio || b.mes - a.mes);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/periodos')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a Períodos
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold">
                  {periodo ? `${MESES[periodo.mes - 1]} ${periodo.anio}` : '—'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {periodo?.esta_cerrado ? (
                    <Badge variant="secondary">Cerrado</Badge>
                  ) : (
                    <Badge variant="success">Abierto</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Selector de período */}
              <select
                value={id}
                onChange={(e) => navigate(`/admin/periodos/${e.target.value}`)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {periodosOrdenados.map((p) => (
                  <option key={p.id} value={p.id}>
                    {MESES[p.mes - 1]} {p.anio}
                  </option>
                ))}
              </select>

              {periodo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => mutToggle.mutate()}
                  disabled={mutToggle.isPending}
                  className="gap-1.5"
                >
                  {periodo.esta_cerrado ? (
                    <><LockOpen className="h-4 w-4" /> Abrir período</>
                  ) : (
                    <><Lock className="h-4 w-4" /> Cerrar período</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Cards de totales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <TarjetaTotal
            titulo="Total ingresos"
            monto={totalIngresos}
            icono={TrendingUp}
            color="bg-green-500"
            onClick={() => navigate(`/admin/ingresos?periodo_id=${id}`)}
          />
          <TarjetaTotal
            titulo="Total costos de venta"
            monto={totalCostosVenta}
            icono={ShoppingCart}
            color="bg-blue-500"
            onClick={() => navigate(`/admin/costos-venta?periodo_id=${id}`)}
          />
          <TarjetaTotal
            titulo="Total gastos administrativos"
            monto={totalGastos}
            icono={Receipt}
            color="bg-orange-500"
            onClick={() => navigate(`/admin/gastos-admin?periodo_id=${id}`)}
          />
          <TarjetaTotal
            titulo="Total costo por persona"
            monto={totalCostosPorPersona}
            icono={UserRound}
            color="bg-purple-500"
            onClick={() => navigate(`/admin/costos-por-persona?periodo_id=${id}`)}
          />
        </div>
      </div>
    </Layout>
  );
}
