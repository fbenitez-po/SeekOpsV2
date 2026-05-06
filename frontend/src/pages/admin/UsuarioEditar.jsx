import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {configApi, userApi} from '../../services/api';
import Layout from '../../components/layout/Layout';
import {Button} from '../../components/ui/button';
import {Input} from '../../components/ui/input';
import {Label} from '../../components/ui/label';
import {Card, CardContent, CardHeader, CardTitle} from '../../components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../../components/ui/select';
import {Badge} from '../../components/ui/badge';
import {formatearFechaHora} from '../../lib/utils';

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

export default function UsuarioEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const { data: usuario } = useQuery({ queryKey: ['usuario', id], queryFn: () => userApi.obtener(id).then((r) => r.data) });
  const { data: equipos } = useQuery({ queryKey: ['equipos'], queryFn: () => configApi.equipos().then((r) => r.data) });
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: () => configApi.areas().then((r) => r.data) });
  const { data: grupos } = useQuery({ queryKey: ['grupos'], queryFn: () => configApi.grupos().then((r) => r.data) });

  useEffect(() => {
    if (usuario) {
      setForm({
        firstName: usuario.firstName,
        lastName: usuario.lastName,
        documentNumber: usuario.documentNumber,
        jobTitle: usuario.jobTitle,
        phone: usuario.phone || '',
        teamId: usuario.team?.id || '',
        areas: (usuario.areas || []).map((a) => a.id),
        hireDate: usuario.hireDate ? usuario.hireDate.split('T')[0] : '',
        isActive: usuario.isActive,
        groups: usuario.groups,
      });
    }
  }, [usuario]);

  const mutation = useMutation({
    mutationFn: (datos) => userApi.actualizar(id, { ...datos, phone: datos.phone || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      navigate('/admin/usuarios');
    },
    onError: (err) => setError(err.response?.data?.error || 'Error al actualizar'),
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

  if (!form) return <Layout><p className="text-muted-foreground">Cargando...</p></Layout>;

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Editar usuario</h1>

        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Cuenta</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm font-medium">{usuario?.email}</p>
            <p className="text-xs text-muted-foreground">Registrado: {formatearFechaHora(usuario?.createdAt)}</p>
            <p className="text-xs text-muted-foreground">Actualizado: {formatearFechaHora(usuario?.updatedAt)}</p>
            {usuario?.deactivatedAt && <p className="text-xs text-muted-foreground">Desactivado: {formatearFechaHora(usuario.deactivatedAt)}</p>}
            <div className="mt-2">
              <Badge variant={usuario?.isActive ? 'success' : 'secondary'}>{usuario?.isActive ? 'Activo' : 'Inactivo'}</Badge>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={manejarSubmit} className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Información personal</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombres *</Label>
                <Input value={form.firstName} onChange={set('firstName')} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Apellidos *</Label>
                <Input value={form.lastName} onChange={set('lastName')} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Documento *</Label>
                <Input value={form.documentNumber} onChange={set('documentNumber')} required />
              </div>
              <div className="space-y-2">
                <Label>Puesto *</Label>
                <Input value={form.jobTitle} onChange={set('jobTitle')} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Celular</Label>
                <Input value={form.phone} onChange={set('phone')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Información laboral</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Equipo *</Label>
                <Select value={form.teamId} onValueChange={set('teamId')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : 'Guardar cambios'}</Button>
          </div>
        </form>

        {usuario?.projects?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Proyectos asignados</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {usuario.projects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span>{p.name} <span className="text-muted-foreground">({p.clientName})</span></span>
                    <Badge variant="secondary">{p.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
