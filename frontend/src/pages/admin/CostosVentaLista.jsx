import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Plus, Pencil, Trash2, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { costosVentaApi, periodosApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

const periodoLabel = (mes, anio) => `${String(mes).padStart(2, '0')}-${anio}`;

export default function CostosVentaLista() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [filtroPeriodoId, setFiltroPeriodoId] = useState(searchParams.get('periodo_id') ?? '');

  const { data: costos = [], isLoading } = useQuery({
    queryKey: ['costos-venta', filtroPeriodoId],
    queryFn: () => costosVentaApi.listar(filtroPeriodoId ? { periodo_id: filtroPeriodoId } : {}).then((r) => r.data),
  });

  const { data: periodosData = [] } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosApi.listar().then((r) => r.data),
  });

  const mutEliminar = useMutation({
    mutationFn: (id) => costosVentaApi.eliminar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['costos-venta'] }),
  });

  const periodosDisponibles = [...periodosData].sort((a, b) => b.anio - a.anio || b.mes - a.mes);

  function exportar() {
    const filas = costos.map((c) => ({
      periodo: periodoLabel(c.mes, c.anio),
      codigo: c.codigo,
      descripcion: c.descripcion || '',
      monto: c.monto,
    }));
    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Costos de Venta');
    XLSX.writeFile(wb, 'costos_venta.xlsx');
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Costos de Venta</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportar} className="gap-2" disabled={costos.length === 0}>
                <Download className="h-4 w-4" /> Exportar
              </Button>
              <Button onClick={() => navigate('/admin/costos-venta/crear')} className="gap-2">
                <Plus className="h-4 w-4" /> Añadir Costo
              </Button>
            </div>
          </div>
        </div>

        {/* Filtro por período */}
        <div className="flex items-center gap-3">
          <select
            value={filtroPeriodoId}
            onChange={(e) => setFiltroPeriodoId(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos los períodos</option>
            {periodosDisponibles.map((p) => (
              <option key={p.id} value={String(p.id)}>{periodoLabel(p.mes, p.anio)}</option>
            ))}
          </select>
          {filtroPeriodoId && (
            <button type="button" onClick={() => setFiltroPeriodoId('')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4 inline mr-1" />Borrar filtro
            </button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
            ) : costos.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No hay costos de venta registrados.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Período</th>
                    <th className="px-4 py-3 text-left font-medium">Código</th>
                    <th className="px-4 py-3 text-left font-medium">Descripción</th>
                    <th className="px-4 py-3 text-right font-medium">Monto</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {costos.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{periodoLabel(c.mes, c.anio)}</td>
                      <td className="px-4 py-3 font-medium">{c.codigo}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.descripcion || '—'}</td>
                      <td className="px-4 py-3 text-right">{Number(c.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/costos-venta/${c.id}/editar`)} title="Editar">
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => mutEliminar.mutate(c.id)} disabled={mutEliminar.isPending} title="Eliminar">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
