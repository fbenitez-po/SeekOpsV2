import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { timeEntryApi, projectApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ESTADO_LABELS, formatearRangoDeSemana, semanaADomingo } from '../../lib/utils';

const VARIANTE_ESTADO = {
  PENDIENTE: 'warning',
  APROBADO: 'success',
  APROBADO_CON_OBSERVACION: 'success',
  RECHAZADO: 'destructive',
};

function nroSemana(semana) {
  const match = semana?.match(/^S(\d+)\/(\d+)$/);
  return match ? parseInt(match[1]) : null;
}

function labelSemana(semana) {
  const nro = nroSemana(semana);
  const domingo = semanaADomingo(semana);
  const rango = domingo ? formatearRangoDeSemana(domingo) : semana;
  return nro ? `Semana ${nro} · ${rango}` : rango;
}

function rollupEstado(lineas) {
  const estados = lineas.map((l) => l.estado);
  if (estados.includes('PENDIENTE')) return 'PENDIENTE';
  if (estados.includes('RECHAZADO')) return 'RECHAZADO';
  if (estados.includes('APROBADO_CON_OBSERVACION')) return 'APROBADO_CON_OBSERVACION';
  return 'APROBADO';
}

function agruparPorLinea(lineas) {
  return lineas.map((l) => ({
    key: `${l.proyecto?.id}:${l.categoria_ingreso?.id ?? ''}`,
    proyecto_id: l.proyecto?.id,
    proyecto_nombre: l.proyecto?.nombre,
    proyecto_codigo: l.proyecto?.codigo,
    categoria_nombre: l.categoria_ingreso?.nombre ?? null,
    estado: l.estado,
    horas: l.horas,
    horas_extra: l.horas_extra,
    linea_id: l.id,
  }));
}

function proyectosParaBadges(lineasAgrupadas) {
  const seen = new Set();
  return lineasAgrupadas.filter((g) => {
    if (seen.has(g.proyecto_id)) return false;
    seen.add(g.proyecto_id);
    return true;
  });
}

function FilaSemana({ entrada, onRecargar }) {
  const [expandida, setExpandida] = useState(false);
  const lineasAgrupadas = useMemo(() => agruparPorLinea(entrada.lineas ?? []), [entrada.lineas]);
  const badges = useMemo(() => proyectosParaBadges(lineasAgrupadas), [lineasAgrupadas]);
  const hayRechazado = lineasAgrupadas.some((g) => g.estado === 'RECHAZADO');

  return (
    <>
      <tr
        className="hover:bg-slate-50 transition-colors cursor-pointer"
        onClick={() => setExpandida((v) => !v)}
      >
        <td className="px-6 py-3.5 w-6">
          {expandida
            ? <ChevronDown className="h-4 w-4 text-slate-400" />
            : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </td>
        <td className="px-3 py-3.5">
          <span className="font-medium text-slate-700">Semana {nroSemana(entrada.semana)}</span>
          <span className="block text-xs text-slate-400 mt-0.5">
            {formatearRangoDeSemana(semanaADomingo(entrada.semana))}
          </span>
        </td>
        <td className="px-6 py-3.5 text-slate-600">
          <div className="flex flex-wrap gap-1">
            {badges.map((g) => (
              <Badge key={g.proyecto_id} variant={VARIANTE_ESTADO[g.estado]} className="text-xs">
                {g.proyecto_codigo ?? g.proyecto_nombre}
              </Badge>
            ))}
          </div>
        </td>
        <td className="px-6 py-3.5 text-right font-medium text-slate-700">{entrada.total_horas}</td>
        <td className="px-6 py-3.5 text-right text-slate-600">{entrada.total_extras > 0 ? entrada.total_extras : 0}</td>
        <td className="px-6 py-3.5">
          <div className="flex items-center gap-2">
            <Badge variant={VARIANTE_ESTADO[entrada.estado]}>
              {ESTADO_LABELS[entrada.estado]}
            </Badge>
            {hayRechazado && (
              <span className="text-xs text-destructive font-medium">Tiene rechazos</span>
            )}
          </div>
        </td>
      </tr>

      {expandida && lineasAgrupadas.map((g) => (
        <tr key={g.key} className="bg-slate-50 border-l-2 border-l-slate-200">
          <td className="px-6 py-2.5" />
          <td className="px-3 py-2.5">
            <span className="text-xs text-slate-400 uppercase tracking-wide">Proyecto</span>
          </td>
          <td className="px-6 py-2.5">
            <span className="text-sm font-medium text-slate-700">{g.proyecto_nombre}</span>
            {g.proyecto_codigo && (
              <span className="ml-2 text-xs text-slate-400">{g.proyecto_codigo}</span>
            )}
            {g.categoria_nombre && (
              <span className="ml-2 text-xs text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                {g.categoria_nombre}
              </span>
            )}
          </td>
          <td className="px-6 py-2.5 text-right text-sm text-slate-700">{g.horas}</td>
          <td className="px-6 py-2.5 text-right text-sm text-slate-600">{g.horas_extra > 0 ? g.horas_extra : 0}</td>
          <td className="px-6 py-2.5">
            <div className="flex items-center gap-2">
              <Badge variant={VARIANTE_ESTADO[g.estado]} className="text-xs">
                {ESTADO_LABELS[g.estado]}
              </Badge>
              {g.estado === 'RECHAZADO' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs px-2 gap-1"
                  onClick={(e) => { e.stopPropagation(); onRecargar(entrada.semana, g.proyecto_id); }}
                >
                  <RotateCcw className="h-3 w-3" />
                  Re-cargar
                </Button>
              )}
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

export default function MisHoras() {
  const navigate = useNavigate();

  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroProyecto, setFiltroProyecto] = useState('');
  const [filtroSemana, setFiltroSemana] = useState('');

  const { data: entradas, isLoading } = useQuery({
    queryKey: ['time-entries', 'todas'],
    queryFn: () => timeEntryApi.listar({ limit: 100 }).then((r) => r.data),
  });

  const { data: proyectosAsignados } = useQuery({
    queryKey: ['proyectos-asignados'],
    queryFn: () => projectApi.listar({ activo: true }).then((r) => r.data.data),
  });

  const filas = useMemo(() => {
    if (!entradas?.data) return [];
    return entradas.data.map((e) => {
      const proyectos = [...new Set((e.lineas || []).map((l) => l.proyecto?.nombre).filter(Boolean))];
      return { ...e, _proyectos: proyectos };
    });
  }, [entradas]);

  const proyectosUnicos = useMemo(() => {
    if (proyectosAsignados?.length) return [...proyectosAsignados].sort((a, b) => a.nombre.localeCompare(b.nombre));
    const set = new Set();
    filas.forEach((f) => f._proyectos.forEach((p) => set.add(p)));
    return [...set].sort().map((nombre) => ({ nombre }));
  }, [proyectosAsignados, filas]);

  const semanasUnicas = useMemo(() => {
    return [...new Set(filas.map((f) => f.semana))].sort((a, b) => {
      const ma = a.match(/^S(\d+)\/(\d+)$/);
      const mb = b.match(/^S(\d+)\/(\d+)$/);
      if (!ma || !mb) return 0;
      const yearDiff = parseInt(mb[2]) - parseInt(ma[2]);
      return yearDiff !== 0 ? yearDiff : parseInt(mb[1]) - parseInt(ma[1]);
    });
  }, [filas]);

  const filasFiltradas = useMemo(() => {
    return filas.filter((f) => {
      if (filtroEstado && f.estado !== filtroEstado) return false;
      if (filtroProyecto && !f._proyectos.includes(filtroProyecto)) return false;
      if (filtroSemana && f.semana !== filtroSemana) return false;
      return true;
    });
  }, [filas, filtroEstado, filtroProyecto, filtroSemana]);

  const hayFiltros = filtroEstado || filtroProyecto || filtroSemana;

  function handleRecargar(semana, proyectoId) {
    navigate('/seeker/cargar', { state: { semana, proyectoId } });
  }

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

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filtroSemana}
            onChange={(e) => setFiltroSemana(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:shadow-[0_0_0_3px_rgba(15,23,42,0.08)]"
          >
            <option value="">Todas las semanas</option>
            {semanasUnicas.map((s) => (
              <option key={s} value={s}>{labelSemana(s)}</option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:shadow-[0_0_0_3px_rgba(15,23,42,0.08)]"
          >
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <select
            value={filtroProyecto}
            onChange={(e) => setFiltroProyecto(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:shadow-[0_0_0_3px_rgba(15,23,42,0.08)]"
          >
            <option value="">Todos los proyectos</option>
            {proyectosUnicos.map((p) => (
              <option key={p.nombre} value={p.nombre}>{p.nombre}</option>
            ))}
          </select>

          {hayFiltros && (
            <button
              onClick={() => { setFiltroEstado(''); setFiltroProyecto(''); setFiltroSemana(''); }}
              className="h-9 px-3 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Tabla */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">
              {hayFiltros
                ? `${filasFiltradas.length} resultado${filasFiltradas.length !== 1 ? 's' : ''}`
                : 'Todas las entradas'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-0">
            {isLoading ? (
              <p className="text-sm text-muted-foreground px-6">Cargando...</p>
            ) : filasFiltradas.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6">
                {hayFiltros ? 'Sin resultados para los filtros seleccionados.' : 'No hay registros de horas aún.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-3 w-6" />
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Semana</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Proyectos</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Horas</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Extras</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filasFiltradas.map((f) => (
                      <FilaSemana key={f.id} entrada={f} onRecargar={handleRecargar} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
