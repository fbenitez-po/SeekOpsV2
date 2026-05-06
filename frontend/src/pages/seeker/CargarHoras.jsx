import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { timeEntryApi, projectApi, configApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  formatearSemana,
  formatearRangoDeSemana,
  formatearDiaMes,
  obtenerDomingoBase,
  obtenerFeriadosSemana,
} from '../../lib/utils';

function obtenerDomingo(offset = 0) {
  const base = obtenerDomingoBase();
  base.setDate(base.getDate() + offset * 7);
  return base;
}

const lineaVacia = () => ({
  id: crypto.randomUUID(),
  proyecto_id: '',
  categoria_ingreso_id: null,
  horas: '',
  horas_extra: '',
  comentario: '',
});

export default function CargarHoras() {
  const navigate = useNavigate();
  const [offsetSemana, setOffsetSemana] = useState(-1);
  const [lineas, setLineas] = useState([lineaVacia()]);
  const [error, setError] = useState('');
  const [mostrarAlertaSemana, setMostrarAlertaSemana] = useState(false);

  const domingo = obtenerDomingo(offsetSemana);
  const semana = formatearSemana(domingo);
  const feriadosSemana = obtenerFeriadosSemana(domingo);
  const horasEsperadas = (5 - feriadosSemana.length) * 8;

  const { data: proyectos } = useQuery({
    queryKey: ['proyectos-asignados'],
    queryFn: () => projectApi.listar({ activo: true }).then((r) => r.data.data),
  });

  const { data: categorias } = useQuery({
    queryKey: ['categorias-ingreso'],
    queryFn: () => configApi.categoriasIngreso().then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (datos) => timeEntryApi.crear(datos),
    onSuccess: () => navigate('/seeker'),
    onError: (err) => setError(err.response?.data?.error || 'Error al guardar'),
  });

  const proyectosUsados = lineas.map((l) => l.proyecto_id).filter(Boolean);

  function actualizarLinea(id, campo, valor) {
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, lineaVacia()]);
  }

  function eliminarLinea(id) {
    setLineas((prev) => prev.filter((l) => l.id !== id));
  }

  function avanzarSemana() {
    if (offsetSemana >= -1) {
      setMostrarAlertaSemana(true);
    } else {
      setOffsetSemana((o) => o + 1);
    }
  }

  function manejarSubmit(e) {
    e.preventDefault();
    setError('');
    mutation.mutate({
      semana,
      lineas: lineas.map((l) => ({
        proyecto_id: l.proyecto_id,
        categoria_ingreso_id: l.categoria_ingreso_id || null,
        horas: parseInt(l.horas) || 0,
        horas_extra: parseInt(l.horas_extra) || 0,
        comentario: l.comentario,
      })),
    });
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Cargar horas</h1>
          <p className="text-muted-foreground">Registrá las horas trabajadas para la semana seleccionada</p>
        </div>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" size="icon" onClick={() => setOffsetSemana((o) => o - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                  {semana}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatearRangoDeSemana(domingo)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={avanzarSemana}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className={`mt-3 rounded-md border px-3 py-2.5 ${feriadosSemana.length > 0 ? 'border-yellow-200 bg-yellow-50' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-xs font-medium ${feriadosSemana.length > 0 ? 'text-yellow-800' : 'text-slate-600'}`}>
                Horas laborables esperadas: <span className="font-semibold">{horasEsperadas}h</span>
              </p>
              {feriadosSemana.length > 0 && (
                <p className="text-xs text-yellow-700 mt-0.5">
                  Feriado{feriadosSemana.length > 1 ? 's' : ''}:{' '}
                  {feriadosSemana.map((f) => `${f.nombre} (${formatearDiaMes(f.fecha)})`).join(' · ')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={manejarSubmit} className="space-y-4">
          {lineas.map((linea, idx) => {
            const proyectosDisponibles = (proyectos || []).filter(
              (p) => p.id === linea.proyecto_id || !proyectosUsados.includes(p.id)
            );
            const proyectoSeleccionado = (proyectos || []).find((p) => p.id === linea.proyecto_id);
            const esAreaProject = proyectoSeleccionado?.categoria_ingreso?.nombre === 'Area';

            return (
              <Card key={linea.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Proyecto {idx + 1}
                  </CardTitle>
                  {lineas.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => eliminarLinea(linea.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Proyecto</Label>
                    <Select
                      value={linea.proyecto_id}
                      onValueChange={(v) => actualizarLinea(linea.id, 'proyecto_id', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccioná un proyecto" />
                      </SelectTrigger>
                      <SelectContent>
                        {proyectosDisponibles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre} ({p.codigo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {esAreaProject && (
                    <div className="space-y-2">
                      <Label>Categoría de ingreso</Label>
                      <Select
                        value={linea.categoria_ingreso_id || ''}
                        onValueChange={(v) => actualizarLinea(linea.id, 'categoria_ingreso_id', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccioná categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {(categorias || []).map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Horas (0-{horasEsperadas})</Label>
                      <Input
                        type="number"
                        min="0"
                        max={horasEsperadas}
                        value={linea.horas}
                        onChange={(e) => actualizarLinea(linea.id, 'horas', e.target.value)}
                        required
                        placeholder="8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Horas extras (0-8)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="8"
                        value={linea.horas_extra}
                        onChange={(e) => actualizarLinea(linea.id, 'horas_extra', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Comentario (opcional)</Label>
                    <Textarea
                      value={linea.comentario}
                      onChange={(e) => actualizarLinea(linea.id, 'comentario', e.target.value)}
                      maxLength={500}
                      placeholder="Descripción de las tareas realizadas..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Button type="button" variant="outline" className="w-full gap-2" onClick={agregarLinea}>
            <Plus className="h-4 w-4" />
            Agregar otro proyecto
          </Button>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/seeker')}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Guardar horas'}
            </Button>
          </div>
        </form>
      </div>

      {mostrarAlertaSemana && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 mb-2">Semana no disponible</h3>
            <p className="text-sm text-slate-600 mb-5">
              Solo podés cargar horas de semanas ya cerradas. La semana en curso y las futuras no están disponibles para carga.
            </p>
            <Button className="w-full" onClick={() => setMostrarAlertaSemana(false)}>
              Entendido
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
}
