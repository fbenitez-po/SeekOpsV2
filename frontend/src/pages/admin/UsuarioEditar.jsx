import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { userApi, configApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { formatearFechaHora } from '../../lib/utils';

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
            {o.nombre}
          </button>
        );
      })}
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
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        numero_documento: usuario.numero_documento,
        puesto: usuario.puesto,
        celular: usuario.celular || '',
        equipo_id: usuario.equipo?.id || '',
        areas: (usuario.areas || []).map((a) => a.id),
        fecha_ingreso: usuario.fecha_ingreso ? usuario.fecha_ingreso.split('T')[0] : '',
        activo: usuario.activo,
        grupos: usuario.grupos,
      });
    }
  }, [usuario]);

  const mutation = useMutation({
    mutationFn: (datos) => userApi.actualizar(id, { ...datos, celular: datos.celular || null }),
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
      <div className="max-w-2xl space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin/usuarios')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver a usuarios
          </button>
          <h1 className="text-2xl font-bold">Editar usuario</h1>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Cuenta</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm font-medium">{usuario?.email}</p>
            <p className="text-xs text-muted-foreground">Registrado: {formatearFechaHora(usuario?.creado_en)}</p>
            <p className="text-xs text-muted-foreground">Actualizado: {formatearFechaHora(usuario?.actualizado_en)}</p>
            {usuario?.desactivado_en && <p className="text-xs text-muted-foreground">Desactivado: {formatearFechaHora(usuario.desactivado_en)}</p>}
            <div className="mt-2">
              <Badge variant={usuario?.activo ? 'success' : 'secondary'}>{usuario?.activo ? 'Activo' : 'Inactivo'}</Badge>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={manejarSubmit} className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Información personal</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombres *</Label>
                <Input value={form.nombres} onChange={set('nombres')} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Apellidos *</Label>
                <Input value={form.apellidos} onChange={set('apellidos')} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Documento *</Label>
                <Input value={form.numero_documento} onChange={set('numero_documento')} required />
              </div>
              <div className="space-y-2">
                <Label>Puesto *</Label>
                <Input value={form.puesto} onChange={set('puesto')} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Celular</Label>
                <Input value={form.celular} onChange={set('celular')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Información laboral</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Equipo *</Label>
                <Select value={form.equipo_id} onValueChange={set('equipo_id')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(equipos || []).map((e) => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de ingreso *</Label>
                <Input type="date" value={form.fecha_ingreso} onChange={set('fecha_ingreso')} required max={new Date().toISOString().split('T')[0]} />
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
                  seleccionados={form.grupos}
                  onChange={(v) => setForm((f) => ({ ...f, grupos: v }))}
                />
                {form.grupos.includes('ADMIN') ? (
                  <p className="text-xs" style={{ color: '#92400e' }}>Admin no puede combinarse con Gestor ni Seeker.</p>
                ) : (
                  <p className="text-xs" style={{ color: '#94a3b8' }}>Podés asignar más de un rol al usuario.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/admin/usuarios')}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : 'Guardar cambios'}</Button>
          </div>
        </form>

        {usuario?.proyectos?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Proyectos asignados</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {usuario.proyectos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span>{p.nombre} <span className="text-muted-foreground">({p.cliente})</span></span>
                    <Badge variant="secondary">{p.rol}</Badge>
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
