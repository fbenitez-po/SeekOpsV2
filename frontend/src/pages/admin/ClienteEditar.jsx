// Reutiliza lógica de ClienteCrear pero carga datos existentes
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi, configApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export default function ClienteEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const { data: cliente } = useQuery({ queryKey: ['cliente', id], queryFn: () => clientApi.obtener(id).then((r) => r.data) });
  const { data: segmentaciones } = useQuery({ queryKey: ['segmentaciones'], queryFn: () => configApi.segmentaciones().then((r) => r.data) });
  const { data: sectores } = useQuery({ queryKey: ['sectores'], queryFn: () => configApi.sectores().then((r) => r.data) });

  useEffect(() => {
    if (cliente) {
      setForm({
        nombre: cliente.nombre || '',
        razon_social: cliente.razon_social || '',
        razon_comercial: cliente.razon_comercial || '',
        ruc: cliente.ruc || '',
        nombre_contacto: cliente.nombre_contacto || '',
        email_contacto: cliente.email_contacto || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        segmentacion_id: cliente.segmentacion?.id || '',
        sector_id: cliente.sector?.id || '',
        activo: cliente.activo,
      });
    }
  }, [cliente]);

  const mutation = useMutation({
    mutationFn: (datos) => clientApi.actualizar(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      navigate('/admin/clientes');
    },
    onError: (err) => setError(err.response?.data?.error || 'Error al actualizar'),
  });

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target?.value ?? e }));

  if (!form) return <Layout><p className="text-muted-foreground">Cargando...</p></Layout>;

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Editar cliente</h1>

        <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(form); }} className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Información comercial</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Nombre *</Label><Input value={form.nombre} onChange={set('nombre')} required /></div>
              <div className="space-y-2"><Label>RUC *</Label><Input value={form.ruc} onChange={set('ruc')} required /></div>
              <div className="space-y-2"><Label>Razón social</Label><Input value={form.razon_social} onChange={set('razon_social')} /></div>
              <div className="space-y-2"><Label>Razón comercial</Label><Input value={form.razon_comercial} onChange={set('razon_comercial')} /></div>
              <div className="space-y-2">
                <Label>Segmentación *</Label>
                <Select value={form.segmentacion_id} onValueChange={set('segmentacion_id')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(segmentaciones || []).map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sector</Label>
                <Select value={form.sector_id} onValueChange={set('sector_id')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(sectores || []).map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Contacto</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Nombre de contacto</Label><Input value={form.nombre_contacto} onChange={set('nombre_contacto')} /></div>
              <div className="space-y-2"><Label>Email de contacto</Label><Input type="email" value={form.email_contacto} onChange={set('email_contacto')} /></div>
              <div className="space-y-2"><Label>Teléfono</Label><Input value={form.telefono} onChange={set('telefono')} /></div>
              <div className="space-y-2"><Label>Dirección</Label><Input value={form.direccion} onChange={set('direccion')} /></div>
            </CardContent>
          </Card>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/admin/clientes')}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : 'Guardar cambios'}</Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
