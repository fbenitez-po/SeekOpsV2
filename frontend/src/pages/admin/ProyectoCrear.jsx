import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { projectApi, clientApi, userApi, configApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

function MultiCheckbox({ opciones = [], seleccionados, onChange }) {
  const toggle = (id) => {
    const nuevos = seleccionados.includes(id) ? seleccionados.filter((x) => x !== id) : [...seleccionados, id];
    onChange(nuevos);
  };
  return (
    <div className="overflow-y-auto max-h-40 rounded-md border border-[#e2e8f0] p-2 space-y-1 bg-white">
      {opciones.map((op) => (
        <label key={op.id} className="flex items-center gap-2 cursor-pointer select-none px-1 py-0.5 rounded hover:bg-slate-50">
          <input
            type="checkbox"
            checked={seleccionados.includes(op.id)}
            onChange={() => toggle(op.id)}
            className="h-4 w-4 rounded border"
            style={{ accentColor: '#0f172a' }}
          />
          <span className="text-sm">{op.nombre}</span>
        </label>
      ))}
    </div>
  );
}

export default function ProyectoCrear() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    codigo: '', nombre: '', cliente_id: '', descripcion: '',
    segmentacion_id: '', categorias_proyecto_ids: [], tipo_servicio_id: '',
    gestor_id: '', fecha_inicio: '', fecha_fin: '', activo: true,
    tiene_area: false, area_id: '',
  });
  const [error, setError] = useState('');

  const { data: clientes } = useQuery({ queryKey: ['clientes-select'], queryFn: () => clientApi.listar({ activo: true, limit: 100 }).then((r) => r.data.data) });
  const { data: gestores } = useQuery({ queryKey: ['gestores-select'], queryFn: () => userApi.listar({ grupo: 'GESTORES', activo: true, limit: 100 }).then((r) => r.data.data) });
  const { data: segmentaciones } = useQuery({ queryKey: ['segmentaciones-proyecto'], queryFn: () => configApi.segmentacionesProyecto().then((r) => r.data) });
  const { data: categorias } = useQuery({ queryKey: ['categorias-proyecto'], queryFn: () => configApi.categoriasProyecto().then((r) => r.data) });
  const { data: tiposServicio } = useQuery({ queryKey: ['tipos-servicio'], queryFn: () => configApi.tiposServicio().then((r) => r.data) });
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: () => configApi.areas().then((r) => r.data) });

  const mutation = useMutation({
    mutationFn: (datos) => {
      const { tiene_area, ...resto } = datos;
      return projectApi.crear({ ...resto, area_id: tiene_area ? resto.area_id || null : null });
    },
    onSuccess: () => navigate('/admin/proyectos'),
    onError: (err) => setError(err.response?.data?.error || 'Error al crear proyecto'),
  });

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target?.value ?? e }));

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Nuevo proyecto</h1>

        <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(form); }} className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Información básica</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input value={form.codigo} onChange={set('codigo')} required maxLength={20} placeholder="PRJ-001" />
              </div>
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={form.nombre} onChange={set('nombre')} required maxLength={100} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Descripción</Label>
                <Textarea value={form.descripcion} onChange={set('descripcion')} maxLength={500} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={form.cliente_id} onValueChange={set('cliente_id')}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná cliente" /></SelectTrigger>
                  <SelectContent>{(clientes || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gestor *</Label>
                <Select value={form.gestor_id} onValueChange={set('gestor_id')}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná gestor" /></SelectTrigger>
                  <SelectContent>{(gestores || []).map((g) => <SelectItem key={g.id} value={g.id}>{g.nombres} {g.apellidos}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Configuración</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Segmentación *</Label>
                <Select value={form.segmentacion_id} onValueChange={set('segmentacion_id')}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  <SelectContent>{(segmentaciones || []).map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Categoría de ingreso</Label>
                <MultiCheckbox
                  opciones={categorias || []}
                  seleccionados={form.categorias_proyecto_ids}
                  onChange={(ids) => setForm((f) => ({ ...f, categorias_proyecto_ids: ids }))}
                />
                {form.categorias_proyecto_ids.length > 0 && (
                  <p className="text-xs text-[#64748b]">{form.categorias_proyecto_ids.length} seleccionada{form.categorias_proyecto_ids.length > 1 ? 's' : ''}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Tipo de servicio</Label>
                <Select value={form.tipo_servicio_id} onValueChange={set('tipo_servicio_id')}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  <SelectContent>{(tiposServicio || []).map((t) => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha inicio</Label>
                <Input type="date" value={form.fecha_inicio} onChange={set('fecha_inicio')} />
              </div>
              <div className="space-y-2">
                <Label>Fecha fin</Label>
                <Input type="date" value={form.fecha_fin} onChange={set('fecha_fin')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Área aplicable</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.tiene_area}
                  onChange={(e) => setForm((f) => ({ ...f, tiene_area: e.target.checked, area_id: '' }))}
                  className="h-4 w-4 rounded border"
                  style={{ accentColor: '#0f172a' }}
                />
                <span className="text-sm font-medium">Este proyecto aplica a un área específica</span>
              </label>
              {form.tiene_area && (
                <div className="space-y-2">
                  <Label>Área *</Label>
                  <Select value={form.area_id} onValueChange={set('area_id')}>
                    <SelectTrigger><SelectValue placeholder="Seleccioná el área" /></SelectTrigger>
                    <SelectContent>{(areas || []).map((a) => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/admin/proyectos')}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>{mutation.isPending ? 'Creando...' : 'Crear proyecto'}</Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
