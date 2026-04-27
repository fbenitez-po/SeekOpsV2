import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { userApi, configApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

function SelectorGrupos({ grupos, seleccionados, onChange }) {
  function toggle(codigo) {
    if (seleccionados.includes(codigo)) {
      if (seleccionados.length === 1) return;
      onChange(seleccionados.filter((c) => c !== codigo));
    } else {
      onChange([...seleccionados, codigo]);
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
  const [form, setForm] = useState({
    email: '', nombres: '', apellidos: '', numero_documento: '',
    puesto: '', celular: '', equipo_id: '', area_id: '',
    fecha_ingreso: '', activo: true, staff: false, super_usuario: false,
    grupos: ['SEEKER'],
  });
  const [error, setError] = useState('');

  const { data: equipos } = useQuery({ queryKey: ['equipos'], queryFn: () => configApi.equipos().then((r) => r.data) });
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: () => configApi.areas().then((r) => r.data) });
  const { data: grupos } = useQuery({ queryKey: ['grupos'], queryFn: () => configApi.grupos().then((r) => r.data) });

  const mutation = useMutation({
    mutationFn: (datos) => userApi.crear({ ...datos, celular: datos.celular || null }),
    onSuccess: () => navigate('/admin/usuarios'),
    onError: (err) => setError(err.response?.data?.error || 'Error al crear usuario'),
  });

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target?.value ?? e }));

  function manejarSubmit(e) {
    e.preventDefault();
    setError('');
    mutation.mutate(form);
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Nuevo usuario</h1>

        <form onSubmit={manejarSubmit} className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Información personal</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={set('email')} required />
              </div>
              <div className="space-y-2">
                <Label>Documento *</Label>
                <Input value={form.numero_documento} onChange={set('numero_documento')} required pattern="\d{6,20}" />
              </div>
              <div className="space-y-2">
                <Label>Nombres *</Label>
                <Input value={form.nombres} onChange={set('nombres')} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Apellidos *</Label>
                <Input value={form.apellidos} onChange={set('apellidos')} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Puesto *</Label>
                <Input value={form.puesto} onChange={set('puesto')} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Celular</Label>
                <Input value={form.celular} onChange={set('celular')} placeholder="+51..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Información laboral</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Equipo *</Label>
                <Select value={form.equipo_id} onValueChange={set('equipo_id')}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná equipo" /></SelectTrigger>
                  <SelectContent>{(equipos || []).map((e) => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Área *</Label>
                <Select value={form.area_id} onValueChange={set('area_id')}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná área" /></SelectTrigger>
                  <SelectContent>{(areas || []).map((a) => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de ingreso *</Label>
                <Input type="date" value={form.fecha_ingreso} onChange={set('fecha_ingreso')} required max={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Grupos / Roles *</Label>
                <SelectorGrupos
                  grupos={grupos}
                  seleccionados={form.grupos}
                  onChange={(v) => setForm((f) => ({ ...f, grupos: v }))}
                />
                <p className="text-xs" style={{ color: '#94a3b8' }}>Podés asignar más de un rol al usuario.</p>
              </div>
            </CardContent>
          </Card>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/admin/usuarios')}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>{mutation.isPending ? 'Creando...' : 'Crear usuario'}</Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
