import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus } from 'lucide-react';
import { projectApi, clientApi, userApi, configApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    codigo: '', nombre: '', cliente_id: '',
    segmentacion_id: '', categorias_proyecto_ids: [], tipo_servicio_id: '', capa_productividad_id: '',
    gestor_id: '', fecha_inicio: '', fecha_fin: '', fecha_inicio_real: '', fecha_fin_real: '', activo: true,
    tiene_area: false, area_id: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const draft = sessionStorage.getItem('seekops_proyecto_crear_draft');
    if (draft) {
      try { setForm(JSON.parse(draft)); } catch {}
      sessionStorage.removeItem('seekops_proyecto_crear_draft');
    }
  }, []);

  const irACrearCliente = () => {
    sessionStorage.setItem('seekops_proyecto_crear_draft', JSON.stringify(form));
    navigate('/admin/clientes/crear?returnTo=/admin/proyectos/crear');
  };

  const irACrearGestor = () => {
    sessionStorage.setItem('seekops_proyecto_crear_draft', JSON.stringify(form));
    navigate('/admin/usuarios/crear?returnTo=/admin/proyectos/crear');
  };

  const { data: clientes } = useQuery({ queryKey: ['clientes-select'], queryFn: () => clientApi.listar({ activo: true, limit: 100 }).then((r) => r.data.data) });
  const { data: gestores } = useQuery({ queryKey: ['gestores-select'], queryFn: () => userApi.listar({ grupo: 'GESTOR', activo: true, limit: 100 }).then((r) => r.data.data) });
  const { data: segmentaciones } = useQuery({ queryKey: ['segmentaciones-proyecto'], queryFn: () => configApi.segmentacionesProyecto().then((r) => r.data) });
  const { data: categorias } = useQuery({ queryKey: ['categorias-proyecto'], queryFn: () => configApi.categoriasProyecto().then((r) => r.data) });
  const { data: tiposServicio } = useQuery({ queryKey: ['tipos-servicio'], queryFn: () => configApi.tiposServicio().then((r) => r.data) });
  const { data: capasProductividad } = useQuery({ queryKey: ['capas-productividad'], queryFn: () => configApi.capasProductividad().then((r) => r.data) });
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: () => configApi.areas().then((r) => r.data) });

  const mutation = useMutation({
    mutationFn: (datos) => {
      const { tiene_area, ...resto } = datos;
      return projectApi.crear({ ...resto, area_id: tiene_area ? resto.area_id || null : null });
    },
    onSuccess: () => navigate(searchParams.get('returnTo') || '/admin/proyectos'),
    onError: (err) => setError(err.response?.data?.error || 'Error al crear proyecto'),
  });

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target?.value ?? e }));

  const BtnNuevo = ({ onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 h-9 w-9 rounded-lg border border-[#e2e8f0] bg-white flex items-center justify-center text-[#64748b] hover:border-[#0f172a] hover:text-[#0f172a] transition-colors"
    >
      <Plus className="h-4 w-4" />
    </button>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin/proyectos')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver a proyectos
          </button>
          <h1 className="text-2xl font-bold">Nuevo proyecto</h1>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(form); }} className="space-y-4">

          <Card>
            <CardHeader><CardTitle className="text-base">Datos del proyecto</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-x-6 gap-y-3">
              <div className="flex items-center gap-3">
                <Label className="w-28 shrink-0 text-[#64748b]">Código *</Label>
                <Input value={form.codigo} onChange={set('codigo')} required maxLength={20} placeholder="PRJ-001" className="flex-1 min-w-0" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-28 shrink-0 text-[#64748b]">Nombre *</Label>
                <Input value={form.nombre} onChange={set('nombre')} required maxLength={100} className="flex-1 min-w-0" />
              </div>
              <div />
              <div className="flex items-center gap-3">
                <Label className="w-28 shrink-0 text-[#64748b]">Cliente *</Label>
                {clientes?.length === 0 ? (
                  <button type="button" onClick={irACrearCliente}
                    className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#cbd5e1] text-sm text-[#64748b] hover:border-[#0f172a] hover:text-[#0f172a] transition-colors bg-white">
                    <Plus className="h-3.5 w-3.5" /> Agregar cliente
                  </button>
                ) : (
                  <div className="flex flex-1 gap-2 min-w-0">
                    <Select value={form.cliente_id} onValueChange={set('cliente_id')}>
                      <SelectTrigger className="flex-1 min-w-0"><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                      <SelectContent>{(clientes || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.razon_comercial || c.razon_social}</SelectItem>)}</SelectContent>
                    </Select>
                    <BtnNuevo onClick={irACrearCliente} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-28 shrink-0 text-[#64748b]">Gestor *</Label>
                {gestores?.length === 0 ? (
                  <button type="button" onClick={irACrearGestor}
                    className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#cbd5e1] text-sm text-[#64748b] hover:border-[#0f172a] hover:text-[#0f172a] transition-colors bg-white">
                    <Plus className="h-3.5 w-3.5" /> Agregar gestor
                  </button>
                ) : (
                  <div className="flex flex-1 gap-2 min-w-0">
                    <Select value={form.gestor_id} onValueChange={set('gestor_id')}>
                      <SelectTrigger className="flex-1 min-w-0"><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                      <SelectContent>{(gestores || []).map((g) => <SelectItem key={g.id} value={g.id}>{g.nombres} {g.apellidos}</SelectItem>)}</SelectContent>
                    </Select>
                    <BtnNuevo onClick={irACrearGestor} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-28 shrink-0 text-[#64748b]">Segmentación *</Label>
                <Select value={form.segmentacion_id} onValueChange={set('segmentacion_id')}>
                  <SelectTrigger className="flex-1 min-w-0"><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  <SelectContent>{(segmentaciones || []).map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Clasificación</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex items-center gap-3">
                <Label className="w-36 shrink-0 text-[#64748b]">Tipo de servicio</Label>
                <Select value={form.tipo_servicio_id} onValueChange={set('tipo_servicio_id')}>
                  <SelectTrigger className="flex-1 min-w-0"><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  <SelectContent>{(tiposServicio || []).map((t) => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-36 shrink-0 text-[#64748b]">Capa productividad</Label>
                <Select value={form.capa_productividad_id} onValueChange={set('capa_productividad_id')}>
                  <SelectTrigger className="flex-1 min-w-0"><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  <SelectContent>{(capasProductividad || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-36 shrink-0 text-[#64748b]">Fecha inicio</Label>
                <Input type="date" value={form.fecha_inicio} onChange={set('fecha_inicio')} className="flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-36 shrink-0 text-[#64748b]">Fecha fin</Label>
                <Input type="date" value={form.fecha_fin} onChange={set('fecha_fin')} className="flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-36 shrink-0 text-[#64748b]">Inicio real</Label>
                <Input type="date" value={form.fecha_inicio_real} onChange={set('fecha_inicio_real')} className="flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-36 shrink-0 text-[#64748b]">Fin real</Label>
                <Input type="date" value={form.fecha_fin_real} onChange={set('fecha_fin_real')} className="flex-1" />
              </div>
              <div className="col-span-2 flex items-start gap-3">
                <Label className="w-36 shrink-0 pt-2 text-[#64748b]">Categoría de ingreso</Label>
                <div className="flex-1 space-y-1">
                  <MultiCheckbox
                    opciones={categorias || []}
                    seleccionados={form.categorias_proyecto_ids}
                    onChange={(ids) => setForm((f) => ({ ...f, categorias_proyecto_ids: ids }))}
                  />
                  {form.categorias_proyecto_ids.length > 0 && (
                    <p className="text-xs text-[#64748b]">{form.categorias_proyecto_ids.length} seleccionada{form.categorias_proyecto_ids.length > 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#e2e8f0] space-y-3">
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
                  <div className="flex items-center gap-3 max-w-xs">
                    <Label className="shrink-0 text-[#64748b]">Área *</Label>
                    <Select value={form.area_id} onValueChange={set('area_id')}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                      <SelectContent>{(areas || []).map((a) => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
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
