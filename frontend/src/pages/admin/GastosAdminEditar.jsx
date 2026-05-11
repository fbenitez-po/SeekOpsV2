import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { gastosAdminApi, periodosApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const periodoLabel = (mes, anio) => `${String(mes).padStart(2, '0')}-${anio}`;

export default function GastosAdminEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);

  const { data: gasto } = useQuery({
    queryKey: ['gasto-admin', id],
    queryFn: () => gastosAdminApi.obtener(id).then((r) => r.data),
  });

  const { data: periodosData = [] } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosApi.listar().then((r) => r.data),
  });

  useEffect(() => {
    if (gasto) {
      setForm({ periodo_id: gasto.periodo_id, codigo: gasto.codigo, descripcion: gasto.descripcion || '', monto: String(gasto.monto) });
    }
  }, [gasto]);

  const mutActualizar = useMutation({
    mutationFn: (datos) => gastosAdminApi.actualizar(id, datos),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gastos-admin'] }); navigate('/admin/gastos-admin'); },
  });

  if (!form) return <Layout><p className="p-6 text-sm text-muted-foreground">Cargando...</p></Layout>;

  const valido = form.periodo_id && form.codigo.trim() && form.monto !== '';
  const error = mutActualizar.error?.response?.data?.error;

  function guardar() {
    if (!valido) return;
    mutActualizar.mutate({ periodo_id: form.periodo_id, codigo: form.codigo.trim(), descripcion: form.descripcion.trim() || null, monto: Number(form.monto) });
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin/gastos-admin')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver a Gastos Administrativos
          </button>
          <h1 className="text-2xl font-bold">Editar Gasto Administrativo</h1>
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

            <div className="flex gap-2 mt-6">
              <Button onClick={guardar} disabled={!valido || mutActualizar.isPending}>
                Guardar cambios
              </Button>
              <Button variant="outline" onClick={() => navigate('/admin/gastos-admin')}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
