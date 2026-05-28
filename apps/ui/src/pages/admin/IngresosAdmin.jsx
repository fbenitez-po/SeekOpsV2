import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Pencil, Download, Upload, X, Plus, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ingresosApi, periodosApi, projectApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';

const periodoLabel = (mes, anio) => `${String(mes).padStart(2, '0')}-${anio}`;

export default function IngresosAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [searchParams] = useSearchParams();

  const [filtroPeriodoId, setFiltroPeriodoId] = useState(searchParams.get('periodo_id') ?? '');
  const [filtroProyectoId, setFiltroProyectoId] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [montoEdicion, setMontoEdicion] = useState('');
  const [importError, setImportError] = useState(null);
  const [importOk, setImportOk] = useState(null);

  const { data: ingresosRaw = [], isLoading } = useQuery({
    queryKey: ['ingresos', filtroPeriodoId],
    queryFn: () => ingresosApi.listar(filtroPeriodoId ? { periodo_id: filtroPeriodoId } : {}).then((r) => r.data),
  });

  const { data: periodosData = [] } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosApi.listar().then((r) => r.data),
  });

  const { data: proyectosData = [] } = useQuery({
    queryKey: ['proyectos-admin'],
    queryFn: () => projectApi.listar({ limit: 500 }).then((r) => r.data?.data || []),
  });

  const ingresos = filtroProyectoId
    ? ingresosRaw.filter((i) => i.proyecto_id === filtroProyectoId)
    : ingresosRaw;

  const mutActualizar = useMutation({
    mutationFn: ({ id, datos }) => ingresosApi.actualizar(id, datos),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ingresos'] }); setEditandoId(null); },
  });

  const mutEliminar = useMutation({
    mutationFn: (id) => ingresosApi.eliminar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ingresos'] }),
  });

  const mutImportar = useMutation({
    mutationFn: (filas) => ingresosApi.importar(filas),
    onSuccess: (res) => { queryClient.invalidateQueries({ queryKey: ['ingresos'] }); setImportOk(res.data); setImportError(null); },
    onError: (err) => { setImportError(err.response?.data?.error || 'Error al importar'); setImportOk(null); },
  });

  const periodosDisponibles = [...periodosData].sort((a, b) => b.anio - a.anio || b.mes - a.mes);

  const proyectosDisponibles = [...new Map(
    ingresosRaw.map((i) => [i.proyecto_id, { id: i.proyecto_id, code: i.proyecto_code, nombre: i.proyecto_nombre }])
  ).values()];

  function iniciarEdicion(ingreso) {
    setEditandoId(ingreso.id);
    setMontoEdicion(String(ingreso.monto));
  }

  function confirmarEdicion() {
    if (montoEdicion === '' || Number(montoEdicion) < 0) return;
    mutActualizar.mutate({ id: editandoId, datos: { monto: Number(montoEdicion) } });
  }

  function exportar() {
    const filas = ingresos.map((i) => ({
      code: i.proyecto_code,
      ingreso: i.monto,
      period: `01/${String(i.mes).padStart(2, '0')}/${i.anio}`,
    }));
    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ingresos');
    XLSX.writeFile(wb, 'ingresos.xlsx');
  }

  function manejarArchivo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setImportError(null);
    setImportOk(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'binary', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const datos = XLSX.utils.sheet_to_json(ws, { raw: false });
        const filas = datos.map((row) => ({
          code: row.code ?? row.Code ?? row.CODE,
          ingreso: row.ingreso ?? row.Ingreso ?? row.INGRESO,
          period: row.period ?? row.Period ?? row.PERIOD,
        }));
        mutImportar.mutate(filas);
      } catch {
        setImportError('No se pudo leer el archivo Excel');
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(archivo);
  }

  const hayFiltros = filtroPeriodoId || filtroProyectoId;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Ingresos</h1>
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={manejarArchivo} />
              <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2" disabled={mutImportar.isPending}>
                <Upload className="h-4 w-4" /> Importar
              </Button>
              <Button variant="outline" onClick={exportar} className="gap-2" disabled={ingresos.length === 0}>
                <Download className="h-4 w-4" /> Exportar
              </Button>
              <Button onClick={() => navigate('/admin/ingresos/crear')} className="gap-2">
                <Plus className="h-4 w-4" /> Añadir Ingreso
              </Button>
            </div>
          </div>
        </div>

        {importOk && (
          <div className="flex items-start justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <span>Importación completada: {importOk.insertados} insertados, {importOk.actualizados} actualizados{importOk.errores?.length > 0 && `, ${importOk.errores.length} con errores`}.</span>
            <button onClick={() => setImportOk(null)}><X className="h-4 w-4" /></button>
          </div>
        )}
        {importError && (
          <div className="flex items-start justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>{importError}</span>
            <button onClick={() => setImportError(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
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

          <select
            value={filtroProyectoId}
            onChange={(e) => setFiltroProyectoId(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos los proyectos</option>
            {proyectosDisponibles.map((p) => (
              <option key={p.id} value={p.id}>{p.code} — {p.nombre}</option>
            ))}
          </select>

          {hayFiltros && (
            <button type="button" onClick={() => { setFiltroPeriodoId(''); setFiltroProyectoId(''); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4 inline mr-1" />Borrar filtros
            </button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
            ) : ingresos.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No hay ingresos registrados.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Período</th>
                    <th className="px-4 py-3 text-left font-medium">Proyecto</th>
                    <th className="px-4 py-3 text-right font-medium">Ingreso</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ingresos.map((i) => (
                    <tr key={i.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{periodoLabel(i.mes, i.anio)}</td>
                      <td className="px-4 py-3 font-medium">{i.proyecto_code} — {i.proyecto_nombre}</td>
                      <td className="px-4 py-3 text-right">
                        {editandoId === i.id ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={montoEdicion}
                            onChange={(e) => setMontoEdicion(e.target.value)}
                            className="w-32 text-right ml-auto"
                            autoFocus
                          />
                        ) : (
                          Number(i.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {editandoId === i.id ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={confirmarEdicion} disabled={mutActualizar.isPending} title="Confirmar">
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditandoId(null)} title="Cancelar">
                                <X className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => iniciarEdicion(i)} title="Editar">
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => mutEliminar.mutate(i.id)} disabled={mutEliminar.isPending} title="Eliminar">
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
