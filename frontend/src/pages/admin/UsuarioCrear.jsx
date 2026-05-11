import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { userApi, configApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

function CheckboxMultiple({ opciones = [], seleccionados, onChange }) {
  const toggle = (id) => {
    const nuevos = seleccionados.includes(id) ? seleccionados.filter((x) => x !== id) : [...seleccionados, id];
    onChange(nuevos);
  };
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-md border border-[#e2e8f0] p-3 bg-white">
      {(opciones || []).map((o) => (
        <label key={o.id} className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={seleccionados.includes(o.id)}
            onChange={() => toggle(o.id)}
            className="h-4 w-4 rounded border"
            style={{ accentColor: '#0f172a' }}
          />
          <span className="text-sm">{o.nombre}</span>
        </label>
      ))}
    </div>
  );
}

function SelectorGrupos({ grupos, seleccionados, onChange }) {
  function toggle(codigo) {
    if (seleccionados.includes(codigo)) {
      if (seleccionados.length === 1) return;
      onChange(seleccionados.filter((c) => c !== codigo));
    } else if (codigo === 'ADMIN') {
      onChange(['ADMIN']);
    } else {
      onChange([...seleccionados.filter((c) => c !== 'ADMIN'), codigo]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(grupos || []).map((g) => {
        const activo = seleccionados.includes(g.codigo);
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => toggle(g.codigo)}
            className="rounded-md px-3 py-1.5 text-sm font-medium border transition-colors"
            style={{
              backgroundColor: activo ? '#0f172a' : '#ffffff',
              color: activo ? '#ffffff' : '#0f172a',
              borderColor: activo ? '#0f172a' : '#e2e8f0',
            }}
          >
            {g.nombre}
          </button>
        );
      })}
    </div>
  );
}

export default function UsuarioCrear() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [form, setForm] = useState({
    email: '', nombres: '', apellidos: '', numero_documento: '',
    puesto: '', celular: '', equipo_id: '', areas: [],
    fecha_ingreso: '', activo: true, staff: false, super_usuario: false,
    grupos: ['SEEKER'],
  });
  const [error, setError] = useState('');

  const { data: equipos } = useQuery({ queryKey: ['equipos'], queryFn: () => configApi.equipos().then((r) => r.data) });
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: () => configApi.areas().then((r) => r.data) });
  const { data: grupos } = useQuery({ queryKey: ['grupos'], queryFn: () => configApi.grupos().then((r) => r.data) });

  const mutation = useMutation({
    mutationFn: (datos) => userApi.crear({ ...datos, celular: datos.celular || null }),
    onSuccess: () => navigate(returnTo || '/admin/usuarios'),
    onError: (err) => setError(err.response?.data?.error || 'Error al crear usuario'),
  });

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target?.value ?? e }));

  function manejarSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.areas.length === 0) {
      setError('Debe seleccionar al menos un área');
      return;
    }
    mutation.mutate(form);
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin/usuarios')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver a usuarios
          </button>
          <h1 className="text-2xl font-bold">Nuevo usuario</h1>
        </div>

        <form onSubmit={manejarSubmit} className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Información personal</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-x-6 gap-y-3">
              <div className="flex items-center gap-3">
                <Label className="w-28 shrink-0 text-[#64748b]">Documento *</Label>
                <Input value={form.numero_documento} onChange={set('numero_documento')} required pattern="\d{6,20}" className="flex-1 min-w-0" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-28 shrink-0 text-[#64748b]">Nombres *</Label>
                <Input value={form.nombres} onChange={set('nombres')} required maxLength={100} className="flex-1 min-w-0" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-28 shrink-0 text-[#64748b]">Apellidos *</Label>
                <Input value={form.apellidos} onChange={set('apellidos')} required maxLength={100} className="flex-1 min-w-0" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-28 shrink-0 text-[#64748b]">Email *</Label>
                <Input type="email" value={form.email} onChange={set('email')} required className="flex-1 min-w-0" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-28 shrink-0 text-[#64748b]">Celular</Label>
                <Input value={form.celular} onChange={set('celular')} placeholder="+51..." className="flex-1 min-w-0" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Información laboral</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex items-center gap-3">
                <Label className="w-36 shrink-0 text-[#64748b]">Puesto *</Label>
                <Input value={form.puesto} onChange={set('puesto')} required maxLength={100} className="flex-1 min-w-0" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-36 shrink-0 text-[#64748b]">Equipo *</Label>
                <Select value={form.equipo_id} onValueChange={set('equipo_id')}>
                  <SelectTrigger className="flex-1 min-w-0"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>{(equipos || []).map((e) => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-36 shrink-0 text-[#64748b]">Fecha de ingreso *</Label>
                <Input type="date" value={form.fecha_ingreso} onChange={set('fecha_ingreso')} required max={new Date().toISOString().split('T')[0]} className="flex-1" />
              </div>
              <div className="col-span-2 flex items-start gap-3">
                <Label className="w-36 shrink-0 pt-2 text-[#64748b]">
                  Áreas *{' '}
                  <span className="text-xs font-normal" style={{ color: '#94a3b8' }}>(al menos una)</span>
                </Label>
                <div className="flex-1 space-y-1">
                  <CheckboxMultiple
                    opciones={areas}
                    seleccionados={form.areas}
                    onChange={(v) => setForm((f) => ({ ...f, areas: v }))}
                  />
                  {form.areas.length === 0 && (
                    <p className="text-xs" style={{ color: '#dc2626' }}>Selecciona al menos un área.</p>
                  )}
                </div>
              </div>
              <div className="col-span-2 flex items-start gap-3">
                <Label className="w-36 shrink-0 pt-2 text-[#64748b]">Grupos / Roles *</Label>
                <div className="flex-1 space-y-1">
                  <SelectorGrupos
                    grupos={grupos}
                    seleccionados={form.grupos}
                    onChange={(v) => setForm((f) => ({ ...f, grupos: v }))}
                  />
                  {form.grupos.includes('ADMIN') ? (
                    <p className="text-xs" style={{ color: '#92400e' }}>Admin no puede combinarse con Gestor ni Seeker.</p>
                  ) : (
                    <p className="text-xs" style={{ color: '#94a3b8' }}>Puedes asignar más de un rol al usuario.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(returnTo || '/admin/usuarios')}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>{mutation.isPending ? 'Creando...' : 'Crear usuario'}</Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
