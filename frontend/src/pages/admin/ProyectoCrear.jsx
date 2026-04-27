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

export default function ProyectoCrear() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    codigo: '', nombre: '', cliente_id: '', descripcion: '',
    segmentacion_id: '', categoria_ingreso_id: '', tipo_servicio_id: '',
    gestor_id: '', fecha_inicio: '', fecha_fin: '', activo: true,
  });
  const [error, setError] = useState('');

  const { data: clientes } = useQuery({ queryKey: ['clientes-select'], queryFn: () => clientApi.listar({ activo: true, limit: 100 }).then((r) => r.data.data) });
  const { data: gestores } = useQuery({ queryKey: ['gestores-select'], queryFn: () => userApi.listar({ grupo: 'GESTORES', activo: true, limit: 100 }).then((r) => r.data.data) });
  const { data: segmentaciones } = useQuery({ queryKey: ['segmentaciones'], queryFn: () => configApi.segmentaciones().then((r) => r.data) });
  const { data: categorias } = useQuery({ queryKey: ['categorias-ingreso'], queryFn: () => configApi.categoriasIngreso().then((r) => r.data) });
  const { data: tiposServicio } = useQuery({ queryKey: ['tipos-servicio'], queryFn: () => configApi.tiposServicio().then((r) => r.data) });

  const mutation = useMutation({
    mutationFn: (datos) => projectApi.crear(datos),
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
              <div className="space-y-2">
                <Label>Categoría de ingreso *</Label>
                <Select value={form.categoria_ingreso_id} onValueChange={set('categoria_ingreso_id')}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  <SelectContent>{(categorias || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                </Select>
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
