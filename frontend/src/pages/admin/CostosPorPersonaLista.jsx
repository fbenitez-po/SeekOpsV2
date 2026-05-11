import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Plus, Pencil, Trash2, X, Upload, ChevronRight, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { costosPorPersonaApi, periodosApi, userApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

const periodoLabel = (mes, anio) => `${String(mes).padStart(2, '0')}-${anio}`;
const nombreCompleto = (c) => `${c.nombres} ${c.apellidos}`;
const fmt2 = (n) => Number(n ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });
const fmtPct = (n) => `${Number(n ?? 0).toFixed(1)}%`;

function calcular(c) {
  const totalHoras = c.dias_habiles * c.horas_por_dia;
  const costoPorHora = totalHoras > 0 ? Number(c.remuneracion) / totalHoras : 0;
  const horasUsadas = Number(c.horas_usadas ?? 0);
  const horasNoUsadas = Math.max(0, totalHoras - horasUsadas);
  const pctDirecto = totalHoras > 0 ? (horasUsadas / totalHoras) * 100 : 0;
  const pctIndirecto = totalHoras > 0 ? (horasNoUsadas / totalHoras) * 100 : 0;
  return { totalHoras, costoPorHora, horasUsadas, horasNoUsadas, pctDirecto, pctIndirecto };
}

function FilaDetalle({ c }) {
  const { totalHoras, costoPorHora, horasUsadas, horasNoUsadas, pctDirecto, pctIndirecto } = calcular(c);
  return (
    <tr className="bg-slate-50 border-b">
      <td colSpan={6} className="px-8 py-3">
        <div className="grid grid-cols-3 gap-x-10 gap-y-1 text-sm max-w-xl">
          <span className="text-muted-foreground">Total horas</span>
          <span className="col-span-2 font-medium">{totalHoras}</span>

          <span className="text-muted-foreground">Costo por hora</span>
          <span className="col-span-2 font-medium">{fmt2(costoPorHora)}</span>

          <span className="text-muted-foreground">Horas usadas</span>
          <span className="col-span-2 font-medium">{fmt2(horasUsadas)}</span>

          <span className="text-muted-foreground">Horas no usadas</span>
          <span className="col-span-2 font-medium">{fmt2(horasNoUsadas)}</span>

          <span className="text-muted-foreground">Costo directo</span>
          <span className="col-span-2 font-medium">{fmtPct(pctDirecto)}</span>

          <span className="text-muted-foreground">Costo indirecto</span>
          <span className="col-span-2 font-medium">{fmtPct(pctIndirecto)}</span>
        </div>
      </td>
    </tr>
  );
}

export default function CostosPorPersonaLista() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const inputRef = useRef(null);

  const [filtroPeriodoId, setFiltroPeriodoId] = useState(searchParams.get('periodo_id') ?? '');
  const [expandidos, setExpandidos] = useState(new Set());
  const [importError, setImportError] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const { data: costos = [], isLoading } = useQuery({
    queryKey: ['costos-por-persona', filtroPeriodoId],
    queryFn: () => costosPorPersonaApi.listar(filtroPeriodoId ? { periodo_id: filtroPeriodoId } : {}).then((r) => r.data),
  });

  const { data: periodosData = [] } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosApi.listar().then((r) => r.data),
  });

  const { data: usuariosData = [] } = useQuery({
    queryKey: ['usuarios-activos'],
    queryFn: () => userApi.listar({ limit: 1000 }).then((r) => r.data.data.filter((u) => u.activo)),
  });

  const mutEliminar = useMutation({
    mutationFn: (id) => costosPorPersonaApi.eliminar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['costos-por-persona'] }),
  });

  const mutImportar = useMutation({
    mutationFn: (filas) => costosPorPersonaApi.importar(filas),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['costos-por-persona'] });
      setImportResult(res.data);
      setImportError(null);
    },
    onError: (err) => {
      setImportError(err.response?.data?.error || 'Error al importar');
    },
  });

  const periodosDisponibles = [...periodosData].sort((a, b) => b.anio - a.anio || b.mes - a.mes);

  function toggleExpandido(id) {
    setExpandidos((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exportar() {
    const filas = costos.map((c) => {
      const { totalHoras, costoPorHora, horasUsadas, horasNoUsadas, pctDirecto, pctIndirecto } = calcular(c);
      return {
        periodo: periodoLabel(c.mes, c.anio),
        usuario: nombreCompleto(c),
        email: c.email,
        remuneracion: c.remuneracion,
        dias_habiles: c.dias_habiles,
        horas_por_dia: c.horas_por_dia,
        total_horas: totalHoras,
        costo_por_hora: costoPorHora.toFixed(4),
        horas_usadas: horasUsadas,
        horas_no_usadas: horasNoUsadas,
        costo_directo_pct: pctDirecto.toFixed(1),
        costo_indirecto_pct: pctIndirecto.toFixed(1),
      };
    });
    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Costos por Persona');
    XLSX.writeFile(wb, 'costos_por_persona.xlsx');
  }

  function procesarArchivo(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;
    e.target.value = '';
    setImportError(null);
    setImportResult(null);

    if (!filtroPeriodoId) {
      setImportError('Selecciona un período antes de importar.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        const filasMapeadas = [];
        const errores = [];

        rows.forEach((row, i) => {
          // Normalizar claves a minúsculas para tolerar cualquier capitalización
          const norm = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));
          const dni = String(norm.dni ?? '').trim();
          const remuneracion = norm.remuneracion;
          const dias_habiles = norm.dias;
          const horas_por_dia = norm.horas !== undefined ? Number(norm.horas) : 8;

          if (!dni || remuneracion === undefined || dias_habiles === undefined) {
            errores.push(`Fila ${i + 2}: faltan columnas requeridas (DNI, REMUNERACION, DIAS)`);
            return;
          }
          const usuario = usuariosData.find((u) => String(u.numero_documento).trim() === dni);
          if (!usuario) { errores.push(`Fila ${i + 2}: DNI "${dni}" no encontrado o usuario inactivo`); return; }

          filasMapeadas.push({
            periodo_id: filtroPeriodoId,
            user_id: usuario.id,
            remuneracion: Number(remuneracion),
            dias_habiles: Number(dias_habiles),
            horas_por_dia,
          });
        });

        if (errores.length) { setImportError(errores.join('\n')); return; }
        mutImportar.mutate(filasMapeadas);
      } catch {
        setImportError('No se pudo leer el archivo. Verifica que sea un .xlsx válido.');
      }
    };
    reader.readAsArrayBuffer(archivo);
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Costo por Persona</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => inputRef.current?.click()} className="gap-2" disabled={mutImportar.isPending}>
                <Upload className="h-4 w-4" /> {mutImportar.isPending ? 'Importando...' : 'Importar'}
              </Button>
              <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={procesarArchivo} />
              <Button variant="outline" onClick={exportar} className="gap-2" disabled={costos.length === 0}>
                <Download className="h-4 w-4" /> Exportar
              </Button>
              <Button onClick={() => navigate('/admin/costos-por-persona/crear')} className="gap-2">
                <Plus className="h-4 w-4" /> Añadir
              </Button>
            </div>
          </div>
        </div>

        {importError && (
          <div className="rounded-lg border border-destructive/30 bg-red-50 p-4">
            <p className="text-sm font-medium text-destructive mb-1">Error al importar</p>
            <pre className="text-xs text-destructive/80 whitespace-pre-wrap">{importError}</pre>
          </div>
        )}
        {importResult && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-800">
              Importación completada: <strong>{importResult.insertados}</strong> registro(s) procesado(s).
              {importResult.errores?.length > 0 && ` ${importResult.errores.length} error(es).`}
            </p>
          </div>
        )}

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
              <p className="p-6 text-sm text-muted-foreground">No hay registros de costo por persona.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium w-8"></th>
                    <th className="px-4 py-3 text-left font-medium">Período</th>
                    <th className="px-4 py-3 text-left font-medium">Usuario</th>
                    <th className="px-4 py-3 text-right font-medium">Remuneración</th>
                    <th className="px-4 py-3 text-right font-medium">Días</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {costos.map((c) => {
                    const abierto = expandidos.has(c.id);
                    return (
                      <>
                        <tr
                          key={c.id}
                          className="border-b hover:bg-muted/30 cursor-pointer"
                          onClick={() => toggleExpandido(c.id)}
                        >
                          <td className="px-4 py-3 text-muted-foreground">
                            {abierto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{periodoLabel(c.mes, c.anio)}</td>
                          <td className="px-4 py-3 font-medium">{nombreCompleto(c)}</td>
                          <td className="px-4 py-3 text-right">{fmt2(c.remuneracion)}</td>
                          <td className="px-4 py-3 text-right">{c.dias_habiles}</td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/costos-por-persona/${c.id}/editar`)} title="Editar">
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => mutEliminar.mutate(c.id)} disabled={mutEliminar.isPending} title="Eliminar">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {abierto && <FilaDetalle key={`${c.id}-detalle`} c={c} />}
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
