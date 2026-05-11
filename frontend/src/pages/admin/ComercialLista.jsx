import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Pencil, Download, Plus, X, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { comercialApi, projectApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

function duracionSemanas(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) return '—';
  const diff = new Date(fechaFin) - new Date(fechaInicio);
  const semanas = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  return semanas > 0 ? semanas : '—';
}

export default function ComercialLista() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filtroProyectoId, setFiltroProyectoId] = useState('');
  const [confirmarEliminarId, setConfirmarEliminarId] = useState(null);

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ['comercial', filtroProyectoId],
    queryFn: () => comercialApi.listar(filtroProyectoId ? { proyecto_id: filtroProyectoId } : {}).then((r) => r.data),
  });

  const { data: proyectosRaw = [] } = useQuery({
    queryKey: ['proyectos-admin'],
    queryFn: () => projectApi.listar({ activo: 'true', limit: 500 }).then((r) => r.data?.data || []),
  });

  const proyectosEnLista = [...new Map(
    registros.map((r) => [r.proyecto_id, { id: r.proyecto_id, code: r.proyecto_code, nombre: r.proyecto_nombre }])
  ).values()];

  const mutEliminar = useMutation({
    mutationFn: (id) => comercialApi.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comercial'] });
      setConfirmarEliminarId(null);
    },
  });

  function exportar() {
    const filas = registros.map((r) => ({
      'Fecha Registro': r.fecha_registro?.slice(0, 10),
      'Proyecto': `${r.proyecto_code} — ${r.proyecto_nombre}`,
      'Responsable': `${r.responsable_nombres} ${r.responsable_apellidos}`,
      'Precio': Number(r.precio),
      'Moneda': r.moneda,
      'Tipo': r.proyecto_tipo || '',
      'Duración (sem.)': duracionSemanas(r.fecha_inicio, r.fecha_fin),
      'Documento': r.tipo_documento_nombre || '',
      'Estado contrato': r.estado_contrato ? 'Sí' : 'No',
      'Facturación': r.facturacion ? 'Sí' : 'No',
      'Evidencia': r.evidencia_nombre || '',
      'División': r.proyecto_division || '',
    }));
    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comercial');
    XLSX.writeFile(wb, 'comercial.xlsx');
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Comercial</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportar} className="gap-2" disabled={registros.length === 0}>
                <Download className="h-4 w-4" /> Exportar
              </Button>
              <Button onClick={() => navigate('/admin/comercial/crear')} className="gap-2">
                <Plus className="h-4 w-4" /> Nuevo
              </Button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filtroProyectoId}
            onChange={(e) => setFiltroProyectoId(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos los proyectos</option>
            {proyectosEnLista.map((p) => (
              <option key={p.id} value={p.id}>{p.code} — {p.nombre}</option>
            ))}
          </select>

          {filtroProyectoId && (
            <button type="button" onClick={() => setFiltroProyectoId('')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4 inline mr-1" />Borrar filtro
            </button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
            ) : registros.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No hay registros comerciales.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium">Proyecto</th>
                    <th className="px-4 py-3 text-left font-medium">Responsable</th>
                    <th className="px-4 py-3 text-right font-medium">Precio</th>
                    <th className="px-4 py-3 text-left font-medium">Documento</th>
                    <th className="px-4 py-3 text-center font-medium">Contrato</th>
                    <th className="px-4 py-3 text-center font-medium">Facturación</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {r.fecha_registro?.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <span className="text-xs text-muted-foreground mr-1">{r.proyecto_code}</span>
                        {r.proyecto_nombre}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.responsable_nombres} {r.responsable_apellidos}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {Number(r.precio).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.tipo_documento_nombre || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.estado_contrato
                          ? <Check className="h-4 w-4 text-green-600 mx-auto" />
                          : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.facturacion
                          ? <Check className="h-4 w-4 text-green-600 mx-auto" />
                          : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {confirmarEliminarId === r.id ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => mutEliminar.mutate(r.id)} disabled={mutEliminar.isPending} title="Confirmar eliminar">
                                <Check className="h-4 w-4 text-destructive" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setConfirmarEliminarId(null)} title="Cancelar">
                                <X className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/comercial/${r.id}/editar`)} title="Editar">
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setConfirmarEliminarId(r.id)} title="Eliminar">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
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
