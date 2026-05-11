import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { costosVentaApi, periodosApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const periodoLabel = (mes, anio) => `${String(mes).padStart(2, '0')}-${anio}`;
const formVacio = { periodo_id: '', codigo: '', descripcion: '', monto: '' };

export default function CostosVentaCrear() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(formVacio);

  const { data: periodosData = [] } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosApi.listar().then((r) => r.data),
  });

  const mutCrear = useMutation({
    mutationFn: (datos) => costosVentaApi.crear(datos),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['costos-venta'] }); navigate('/admin/costos-venta'); },
  });

  const mutCrearYAnadir = useMutation({
    mutationFn: (datos) => costosVentaApi.crear(datos),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['costos-venta'] }); setForm((f) => ({ ...f, codigo: '', descripcion: '', monto: '' })); },
  });

  const valido = form.periodo_id && form.codigo.trim() && form.monto !== '';
  const error = mutCrear.error?.response?.data?.error || mutCrearYAnadir.error?.response?.data?.error;

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
          <h1 className="text-2xl font-bold">Añadir Costo de Venta</h1>
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
              <Input
                placeholder="Ej: CV001"
                value={form.codigo}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
              />

              <label className="text-sm font-medium">Descripción:</label>
              <Input
                placeholder="Descripción opcional"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              />

              <label className="text-sm font-medium">Monto:</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.monto}
                onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
                className="max-w-[160px]"
              />
            </div>

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => mutCrearYAnadir.mutate(datos())} disabled={!valido || mutCrearYAnadir.isPending}>
                Guardar y añadir otro
              </Button>
              <Button onClick={() => mutCrear.mutate(datos())} disabled={!valido || mutCrear.isPending}>
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
