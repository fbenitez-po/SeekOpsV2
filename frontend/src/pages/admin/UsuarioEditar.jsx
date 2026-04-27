import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
      if (seleccionados.length === 1) return; // al menos uno siempre
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
import { Badge } from '../../components/ui/badge';
import { formatearFechaHora } from '../../lib/utils';

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
        area_id: usuario.area?.id || '',
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

  if (!form) return <Layout><p className="text-muted-foreground">Cargando...</p></Layout>;

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Editar usuario</h1>

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

        <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(form); }} className="space-y-4">
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
                <Label>Área *</Label>
                <Select value={form.area_id} onValueChange={set('area_id')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(areas || []).map((a) => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
                </Select>
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
