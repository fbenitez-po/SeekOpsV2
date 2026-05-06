import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {clientApi, configApi, projectApi, userApi} from '../../services/api';
import Layout from '../../components/layout/Layout';
import {Button} from '../../components/ui/button';
import {Input} from '../../components/ui/input';
import {Label} from '../../components/ui/label';
import {Textarea} from '../../components/ui/textarea';
import {Card, CardContent, CardHeader, CardTitle} from '../../components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../../components/ui/select';

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
          <span className="text-sm">{op.name}</span>
        </label>
      ))}
    </div>
  );
}

export default function ProyectoEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const { data: proyecto } = useQuery({ queryKey: ['proyecto', id], queryFn: () => projectApi.obtener(id).then((r) => r.data) });
  const { data: clientes } = useQuery({ queryKey: ['clientes-select'], queryFn: () => clientApi.listar({ isActive: true, limit: 100 }).then((r) => r.data.data) });
  const { data: gestores } = useQuery({ queryKey: ['gestores-select'], queryFn: () => userApi.listar({ group: 'MANAGERS', isActive: true, limit: 100 }).then((r) => r.data.data) });
  const { data: segmentaciones } = useQuery({ queryKey: ['segmentaciones-proyecto'], queryFn: () => configApi.segmentacionesProyecto().then((r) => r.data) });
  const { data: categorias } = useQuery({ queryKey: ['categorias-proyecto'], queryFn: () => configApi.categoriasProyecto().then((r) => r.data) });
  const { data: tiposServicio } = useQuery({ queryKey: ['tipos-servicio'], queryFn: () => configApi.tiposServicio().then((r) => r.data) });
  const { data: capasProductividad } = useQuery({ queryKey: ['capas-productividad'], queryFn: () => configApi.capasProductividad().then((r) => r.data) });
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: () => configApi.areas().then((r) => r.data) });

  useEffect(() => {
    if (proyecto) {
      setForm({
        code: proyecto.code || '',
        name: proyecto.name || '',
        clientId: proyecto.client?.id || '',
        description: proyecto.description || '',
        segmentationId: proyecto.segmentation?.id || '',
        projectCategoryIds: (proyecto.incomeCategories || []).map((c) => c.id),
        serviceTypeId: proyecto.serviceType?.id || '',
        productivityLayerId: proyecto.productivityLayer?.id || '',
        managerId: proyecto.manager?.id || '',
        startDate: proyecto.startDate || '',
        endDate: proyecto.endDate || '',
        isActive: proyecto.isActive,
        hasArea: !!proyecto.area,
        areaId: proyecto.area?.id || '',
      });
    }
  }, [proyecto]);

  const mutation = useMutation({
    mutationFn: (datos) => {
      const { hasArea, ...resto } = datos;
      return projectApi.actualizar(id, { ...resto, areaId: hasArea ? resto.areaId || null : null });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['proyectos-admin'] }); navigate('/admin/proyectos'); },
    onError: (err) => setError(err.response?.data?.error || 'Error al actualizar'),
  });

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target?.value ?? e }));

  if (!form) return <Layout><p className="text-muted-foreground">Cargando...</p></Layout>;

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Editar proyecto</h1>

        <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(form); }} className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Información básica</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Código *</Label><Input value={form.code} onChange={set('code')} required /></div>
              <div className="space-y-2"><Label>Nombre *</Label><Input value={form.name} onChange={set('name')} required /></div>
              <div className="space-y-2 md:col-span-2"><Label>Descripción</Label><Textarea value={form.description} onChange={set('description')} rows={2} /></div>
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={form.clientId} onValueChange={set('clientId')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(clientes || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gestor *</Label>
                <Select value={form.managerId} onValueChange={set('managerId')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(gestores || []).map((g) => <SelectItem key={g.id} value={g.id}>{g.firstName} {g.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Configuración</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Segmentación *</Label>
                <Select value={form.segmentationId} onValueChange={set('segmentationId')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(segmentaciones || []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Categoría de ingreso</Label>
                <MultiCheckbox
                  opciones={categorias || []}
                  seleccionados={form.projectCategoryIds}
                  onChange={(ids) => setForm((f) => ({ ...f, projectCategoryIds: ids }))}
                />
                {form.projectCategoryIds.length > 0 && (
                  <p className="text-xs text-[#64748b]">{form.projectCategoryIds.length} seleccionada{form.projectCategoryIds.length > 1 ? 's' : ''}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Tipo de servicio</Label>
                <Select value={form.serviceTypeId} onValueChange={set('serviceTypeId')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(tiposServicio || []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capa de productividad</Label>
                <Select value={form.productivityLayerId} onValueChange={set('productivityLayerId')}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  <SelectContent>{(capasProductividad || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Fecha inicio</Label><Input type="date" value={form.startDate} onChange={set('startDate')} /></div>
              <div className="space-y-2"><Label>Fecha fin</Label><Input type="date" value={form.endDate} onChange={set('endDate')} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Área aplicable</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.hasArea}
                  onChange={(e) => setForm((f) => ({ ...f, hasArea: e.target.checked, areaId: '' }))}
                  className="h-4 w-4 rounded border"
                  style={{ accentColor: '#0f172a' }}
                />
                <span className="text-sm font-medium">Este proyecto aplica a un área específica</span>
              </label>
              {form.hasArea && (
                <div className="space-y-2">
                  <Label>Área *</Label>
                  <Select value={form.areaId} onValueChange={set('areaId')}>
                    <SelectTrigger><SelectValue placeholder="Seleccioná el área" /></SelectTrigger>
                    <SelectContent>{(areas || []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/admin/proyectos')}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : 'Guardar cambios'}</Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
