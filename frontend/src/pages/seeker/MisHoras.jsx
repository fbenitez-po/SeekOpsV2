import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { timeEntryApi, projectApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
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
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Semana</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Proyectos</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Horas trabajadas</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Fuera de horario</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filasFiltradas.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3.5">
                          <span className="font-medium text-slate-700">Semana {nroSemana(f.semana)}</span>
                          <span className="block text-xs text-slate-400 mt-0.5">
                            {formatearRangoDeSemana(semanaADomingo(f.semana))}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 max-w-xs">
                          {f._proyectos.length > 0 ? f._proyectos.join(', ') : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-6 py-3.5 text-right font-medium text-slate-700">{f.total_horas}</td>
                        <td className="px-6 py-3.5 text-right text-slate-600">{f.total_extras > 0 ? f.total_extras : 0}</td>
                        <td className="px-6 py-3.5">
                          <Badge variant={VARIANTE_ESTADO[f.estado]}>
                            {ESTADO_LABELS[f.estado]}
                          </Badge>
                        </td>
                      </tr>
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
