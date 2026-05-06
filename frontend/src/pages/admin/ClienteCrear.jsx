import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useMutation, useQuery} from '@tanstack/react-query';
import {clientApi, configApi} from '../../services/api';
import Layout from '../../components/layout/Layout';
import {Button} from '../../components/ui/button';
import {Input} from '../../components/ui/input';
import {Label} from '../../components/ui/label';
import {Card, CardContent, CardHeader, CardTitle} from '../../components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../../components/ui/select';

export default function ClienteCrear() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', legalName: '', commercialName: '', taxId: '',
    contactName: '', contactEmail: '', phone: '', address: '',
    categoryId: '', segmentationId: '', sectorId: '', isActive: true,
  });
  const [error, setError] = useState('');

  const { data: segmentaciones } = useQuery({ queryKey: ['segmentaciones'], queryFn: () => configApi.segmentaciones().then((r) => r.data) });
  const { data: sectores } = useQuery({ queryKey: ['sectores'], queryFn: () => configApi.sectores().then((r) => r.data) });
  const { data: categoriasCliente } = useQuery({ queryKey: ['categorias-cliente'], queryFn: () => configApi.categoriasUsuario().then((r) => r.data) });

  const mutation = useMutation({
    mutationFn: (datos) => clientApi.crear(datos),
    onSuccess: () => navigate('/admin/clientes'),
    onError: (err) => setError(err.response?.data?.error || 'Error al crear cliente'),
  });

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target?.value ?? e }));

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Nuevo cliente</h1>

        <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(form); }} className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Información comercial</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={set('name')} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>RUC *</Label>
                <Input value={form.taxId} onChange={set('taxId')} required pattern="\d{11,14}" placeholder="20123456789" />
              </div>
              <div className="space-y-2">
                <Label>Razón social</Label>
                <Input value={form.legalName} onChange={set('legalName')} maxLength={150} />
              </div>
              <div className="space-y-2">
                <Label>Razón comercial</Label>
                <Input value={form.commercialName} onChange={set('commercialName')} maxLength={150} />
              </div>
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select value={form.categoryId} onValueChange={set('categoryId')}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná categoría" /></SelectTrigger>
                  <SelectContent>{(categoriasCliente || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Segmentación *</Label>
                <Select value={form.segmentationId} onValueChange={set('segmentationId')}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná segmentación" /></SelectTrigger>
                  <SelectContent>{(segmentaciones || []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sector</Label>
                <Select value={form.sectorId} onValueChange={set('sectorId')}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná sector" /></SelectTrigger>
                  <SelectContent>{(sectores || []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Contacto</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre de contacto</Label>
                <Input value={form.contactName} onChange={set('contactName')} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Email de contacto</Label>
                <Input type="email" value={form.contactEmail} onChange={set('contactEmail')} />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={set('phone')} placeholder="+51..." />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input value={form.address} onChange={set('address')} maxLength={200} />
              </div>
            </CardContent>
          </Card>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/admin/clientes')}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>{mutation.isPending ? 'Creando...' : 'Crear cliente'}</Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
