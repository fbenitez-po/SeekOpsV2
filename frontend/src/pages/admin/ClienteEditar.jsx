// Reutiliza lógica de ClienteCrear pero carga datos existentes
import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {clientApi, configApi} from '../../services/api';
import Layout from '../../components/layout/Layout';
import {Button} from '../../components/ui/button';
import {Input} from '../../components/ui/input';
import {Label} from '../../components/ui/label';
import {Card, CardContent, CardHeader, CardTitle} from '../../components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../../components/ui/select';

export default function ClienteEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const { data: cliente } = useQuery({ queryKey: ['cliente', id], queryFn: () => clientApi.obtener(id).then((r) => r.data) });
  const { data: segmentaciones } = useQuery({ queryKey: ['segmentaciones'], queryFn: () => configApi.segmentaciones().then((r) => r.data) });
  const { data: sectores } = useQuery({ queryKey: ['sectores'], queryFn: () => configApi.sectores().then((r) => r.data) });
  const { data: categoriasCliente } = useQuery({ queryKey: ['categorias-cliente'], queryFn: () => configApi.categoriasUsuario().then((r) => r.data) });

  useEffect(() => {
    if (cliente) {
      setForm({
        name: cliente.name || '',
        legalName: cliente.legalName || '',
        commercialName: cliente.commercialName || '',
        taxId: cliente.taxId || '',
        contactName: cliente.contactName || '',
        contactEmail: cliente.contactEmail || '',
        phone: cliente.phone || '',
        address: cliente.address || '',
        categoryId: cliente.category?.id || '',
        segmentationId: cliente.segmentation?.id || '',
        sectorId: cliente.sector?.id || '',
        isActive: cliente.isActive,
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
              <div className="space-y-2"><Label>Nombre *</Label><Input value={form.name} onChange={set('name')} required /></div>
              <div className="space-y-2"><Label>RUC *</Label><Input value={form.taxId} onChange={set('taxId')} required /></div>
              <div className="space-y-2"><Label>Razón social</Label><Input value={form.legalName} onChange={set('legalName')} /></div>
              <div className="space-y-2"><Label>Razón comercial</Label><Input value={form.commercialName} onChange={set('commercialName')} /></div>
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select value={form.categoryId} onValueChange={set('categoryId')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(categoriasCliente || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Segmentación *</Label>
                <Select value={form.segmentationId} onValueChange={set('segmentationId')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(segmentaciones || []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sector</Label>
                <Select value={form.sectorId} onValueChange={set('sectorId')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(sectores || []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Contacto</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Nombre de contacto</Label><Input value={form.contactName} onChange={set('contactName')} /></div>
              <div className="space-y-2"><Label>Email de contacto</Label><Input type="email" value={form.contactEmail} onChange={set('contactEmail')} /></div>
              <div className="space-y-2"><Label>Teléfono</Label><Input value={form.phone} onChange={set('phone')} /></div>
              <div className="space-y-2"><Label>Dirección</Label><Input value={form.address} onChange={set('address')} /></div>
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
