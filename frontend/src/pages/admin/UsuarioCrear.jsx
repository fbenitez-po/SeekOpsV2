import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useMutation, useQuery} from '@tanstack/react-query';
import {configApi, userApi} from '../../services/api';
import Layout from '../../components/layout/Layout';
import {Button} from '../../components/ui/button';
import {Input} from '../../components/ui/input';
import {Label} from '../../components/ui/label';
import {Card, CardContent, CardHeader, CardTitle} from '../../components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../../components/ui/select';

function SelectorMultiple({ opciones, seleccionados, onChange, minimo = 1 }) {
  function toggle(id) {
    if (seleccionados.includes(id)) {
      if (seleccionados.length <= minimo) return;
      onChange(seleccionados.filter((s) => s !== id));
    } else {
      onChange([...seleccionados, id]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(opciones || []).map((o) => {
        const activo = seleccionados.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            className="rounded-md px-3 py-1.5 text-sm font-medium border transition-colors"
            style={{
              backgroundColor: activo ? '#0f172a' : '#ffffff',
              color: activo ? '#ffffff' : '#0f172a',
              borderColor: activo ? '#0f172a' : '#e2e8f0',
            }}
          >
            {o.name}
          </button>
        );
      })}
    </div>
  );
}

function SelectorGrupos({ grupos, seleccionados, onChange }) {
  function toggle(code) {
    if (seleccionados.includes(code)) {
      if (seleccionados.length === 1) return;
      onChange(seleccionados.filter((c) => c !== code));
    } else {
      onChange([...seleccionados, code]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(grupos || []).map((g) => {
        const activo = seleccionados.includes(g.code);
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => toggle(g.code)}
            className="rounded-md px-3 py-1.5 text-sm font-medium border transition-colors"
            style={{
              backgroundColor: activo ? '#0f172a' : '#ffffff',
              color: activo ? '#ffffff' : '#0f172a',
              borderColor: activo ? '#0f172a' : '#e2e8f0',
            }}
          >
            {g.name}
          </button>
        );
      })}
    </div>
  );
}

export default function UsuarioCrear() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '', firstName: '', lastName: '', documentNumber: '',
    jobTitle: '', phone: '', teamId: '', areas: [],
    hireDate: '', isActive: true, isStaff: false, isSuperUser: false,
    groups: ['SEEKER'],
  });
  const [error, setError] = useState('');

  const { data: equipos } = useQuery({ queryKey: ['equipos'], queryFn: () => configApi.equipos().then((r) => r.data) });
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: () => configApi.areas().then((r) => r.data) });
  const { data: grupos } = useQuery({ queryKey: ['grupos'], queryFn: () => configApi.grupos().then((r) => r.data) });

  const mutation = useMutation({
    mutationFn: (datos) => userApi.crear({ ...datos, phone: datos.phone || null }),
    onSuccess: () => navigate('/admin/usuarios'),
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
                <Input value={form.documentNumber} onChange={set('documentNumber')} required pattern="\d{6,20}" />
              </div>
              <div className="space-y-2">
                <Label>Nombres *</Label>
                <Input value={form.firstName} onChange={set('firstName')} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Apellidos *</Label>
                <Input value={form.lastName} onChange={set('lastName')} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Puesto *</Label>
                <Input value={form.jobTitle} onChange={set('jobTitle')} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Celular</Label>
                <Input value={form.phone} onChange={set('phone')} placeholder="+51..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Información laboral</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Equipo *</Label>
                <Select value={form.teamId} onValueChange={set('teamId')}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná equipo" /></SelectTrigger>
                  <SelectContent>{(equipos || []).map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de ingreso *</Label>
                <Input type="date" value={form.hireDate} onChange={set('hireDate')} required max={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Áreas * <span className="text-xs font-normal" style={{ color: '#94a3b8' }}>(al menos una, podés seleccionar varias)</span></Label>
                <SelectorMultiple
                  opciones={areas}
                  seleccionados={form.areas}
                  onChange={(v) => setForm((f) => ({ ...f, areas: v }))}
                  minimo={1}
                />
                {form.areas.length === 0 && (
                  <p className="text-xs" style={{ color: '#dc2626' }}>Seleccioná al menos un área.</p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Grupos / Roles *</Label>
                <SelectorGrupos
                  grupos={grupos}
                  seleccionados={form.groups}
                  onChange={(v) => setForm((f) => ({ ...f, groups: v }))}
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
