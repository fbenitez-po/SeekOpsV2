import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { costosVentaApi, periodosApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const periodoLabel = (mes, anio) => `${String(mes).padStart(2, '0')}-${anio}`;

export default function CostosVentaEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);

  const { data: costo } = useQuery({
    queryKey: ['costo-venta', id],
    queryFn: () => costosVentaApi.obtener(id).then((r) => r.data),
  });

  const { data: periodosData = [] } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosApi.listar().then((r) => r.data),
  });

  useEffect(() => {
    if (costo) {
      setForm({ periodo_id: costo.periodo_id, codigo: costo.codigo, descripcion: costo.descripcion || '', monto: String(costo.monto) });
    }
  }, [costo]);

  const mutActualizar = useMutation({
    mutationFn: (datos) => costosVentaApi.actualizar(id, datos),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['costos-venta'] }); navigate('/admin/costos-venta'); },
  });

  const mutActualizarYSeguir = useMutation({
    mutationFn: (datos) => costosVentaApi.actualizar(id, datos),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['costos-venta'] }); },
  });

  const mutEliminar = useMutation({
    mutationFn: () => costosVentaApi.eliminar(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['costos-venta'] }); navigate('/admin/costos-venta'); },
  });

  if (!form) return <Layout><p className="p-6 text-sm text-muted-foreground">Cargando...</p></Layout>;

  const valido = form.periodo_id && form.codigo.trim() && form.monto !== '';
  const error = mutActualizar.error?.response?.data?.error || mutActualizarYSeguir.error?.response?.data?.error;

  function datos() {
    return { periodo_id: form.periodo_id, codigo: form.codigo.trim(), descripcion: form.descripcion.trim() || null, monto: Number(form.monto) };
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin/costos-venta')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver a Costos de Venta
          </button>
          <h1 className="text-2xl font-bold">Modificar Costo de Venta</h1>
          {costo && <p className="text-sm text-muted-foreground mt-0.5 font-mono">{costo.codigo}</p>}
        </div>

        <Card className="max-w-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-4 items-center">
              <label className="text-sm font-medium">Período:</label>
              <select
                value={form.periodo_id}
                onChange={(e) => setForm((f) => ({ ...f, periodo_id: e.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seleccionar período...</option>
                {periodosData.map((p) => (
                  <option key={p.id} value={p.id}>{periodoLabel(p.mes, p.anio)} — {MESES[p.mes - 1]} {p.anio}</option>
                ))}
              </select>

              <label className="text-sm font-medium">Código:</label>
              <Input value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} />

              <label className="text-sm font-medium">Descripción:</label>
              <Input value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción opcional" />

              <label className="text-sm font-medium">Monto:</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.monto}
                onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
                className="max-w-[160px]"
              />
            </div>

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            <div className="flex items-center justify-between mt-6">
              <Button variant="destructive" onClick={() => mutEliminar.mutate()} disabled={mutEliminar.isPending}>
                Eliminar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => mutActualizarYSeguir.mutate(datos())} disabled={!valido || mutActualizarYSeguir.isPending}>
                  Guardar y continuar editando
                </Button>
                <Button onClick={() => mutActualizar.mutate(datos())} disabled={!valido || mutActualizar.isPending}>
                  Guardar y añadir otro
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
