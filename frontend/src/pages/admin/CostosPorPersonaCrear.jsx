import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { costosPorPersonaApi, periodosApi, userApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';

const periodoLabel = (mes, anio) => `${String(mes).padStart(2, '0')}-${anio}`;
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const formVacio = { periodo_id: '', user_id: '', remuneracion: '', dias_habiles: '20', horas_por_dia: '8' };

export default function CostosPorPersonaCrear() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(formVacio);

  const { data: periodosData = [] } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosApi.listar().then((r) => r.data),
  });

  const { data: usuariosData = [] } = useQuery({
    queryKey: ['usuarios-activos'],
    queryFn: () => userApi.listar({ limit: 1000 }).then((r) => r.data.data.filter((u) => u.activo)),
  });

  const mutCrear = useMutation({
    mutationFn: (datos) => costosPorPersonaApi.crear(datos),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['costos-por-persona'] }); navigate('/admin/costos-por-persona'); },
  });

  const mutCrearYAnadir = useMutation({
    mutationFn: (datos) => costosPorPersonaApi.crear(datos),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['costos-por-persona'] }); setForm((f) => ({ ...f, user_id: '', remuneracion: '', dias_habiles: '20', horas_por_dia: '8' })); },
  });

  const periodosDisponibles = [...periodosData].sort((a, b) => b.anio - a.anio || b.mes - a.mes);
  const usuariosOrdenados = [...usuariosData].sort((a, b) => `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`));

  const valido = form.periodo_id && form.user_id && form.remuneracion !== '' && form.dias_habiles !== '' && form.horas_por_dia !== '';
  const error = mutCrear.error?.response?.data?.error || mutCrearYAnadir.error?.response?.data?.error;

  function datos() {
    return {
      periodo_id: form.periodo_id,
      user_id: form.user_id,
      remuneracion: Number(form.remuneracion),
      dias_habiles: Number(form.dias_habiles),
      horas_por_dia: Number(form.horas_por_dia),
    };
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin/costos-por-persona')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver a Costo por Persona
          </button>
          <h1 className="text-2xl font-bold">Añadir Costo por Persona</h1>
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
                {periodosDisponibles.map((p) => (
                  <option key={p.id} value={p.id}>{periodoLabel(p.mes, p.anio)} — {MESES[p.mes - 1]} {p.anio}</option>
                ))}
              </select>

              <label className="text-sm font-medium">Usuario:</label>
              <select
                value={form.user_id}
                onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seleccionar usuario...</option>
                {usuariosOrdenados.map((u) => (
                  <option key={u.id} value={u.id}>{u.apellidos} {u.nombres}</option>
                ))}
              </select>

              <label className="text-sm font-medium">Remuneración:</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.remuneracion}
                onChange={(e) => setForm((f) => ({ ...f, remuneracion: e.target.value }))}
                className="max-w-[160px]"
              />

              <label className="text-sm font-medium">Días hábiles:</label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="20"
                value={form.dias_habiles}
                onChange={(e) => setForm((f) => ({ ...f, dias_habiles: e.target.value }))}
                className="max-w-[100px]"
              />

              <label className="text-sm font-medium">Horas por día:</label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="8"
                value={form.horas_por_dia}
                onChange={(e) => setForm((f) => ({ ...f, horas_por_dia: e.target.value }))}
                className="max-w-[100px]"
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
