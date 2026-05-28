import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { clientApi, configApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export default function ClienteCrear() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [form, setForm] = useState({
    razon_social: '', razon_comercial: '', ruc: '',
    nombre_contacto: '', email_contacto: '', telefono: '', direccion: '',
    segmentacion_id: '', sector_id: '', activo: true,
  });
  const [error, setError] = useState('');

  const { data: segmentaciones } = useQuery({ queryKey: ['segmentaciones'], queryFn: () => configApi.segmentaciones().then((r) => r.data) });
  const { data: sectores } = useQuery({ queryKey: ['sectores'], queryFn: () => configApi.sectores().then((r) => r.data) });
  const mutation = useMutation({
    mutationFn: (datos) => clientApi.crear(datos),
    onSuccess: () => navigate(returnTo || '/admin/clientes'),
    onError: (err) => setError(err.response?.data?.error || 'Error al crear cliente'),
  });

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target?.value ?? e }));

  return (
    <Layout>
      <div className="max-w-2xl space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin/clientes')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver a clientes
          </button>
          <h1 className="text-2xl font-bold">Nuevo cliente</h1>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(form); }} className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Información comercial</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Razón social *</Label>
                <Input value={form.razon_social} onChange={set('razon_social')} required maxLength={150} />
              </div>
              <div className="space-y-2">
                <Label>Razón comercial</Label>
                <Input value={form.razon_comercial} onChange={set('razon_comercial')} maxLength={150} />
              </div>
              <div className="space-y-2">
                <Label>RUC *</Label>
                <Input value={form.ruc} onChange={set('ruc')} required pattern="\d{11,14}" placeholder="20123456789" />
              </div>
              <div className="space-y-2">
                <Label>Segmentación *</Label>
                <Select value={form.segmentacion_id} onValueChange={set('segmentacion_id')}>
                  <SelectTrigger><SelectValue placeholder="Selecciona segmentación" /></SelectTrigger>
                  <SelectContent>{(segmentaciones || []).map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sector</Label>
                <Select value={form.sector_id} onValueChange={set('sector_id')}>
                  <SelectTrigger><SelectValue placeholder="Selecciona sector" /></SelectTrigger>
                  <SelectContent>{(sectores || []).map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Contacto comercial</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre de contacto comercial</Label>
                <Input value={form.nombre_contacto} onChange={set('nombre_contacto')} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Email de contacto comercial</Label>
                <Input type="email" value={form.email_contacto} onChange={set('email_contacto')} />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={set('telefono')} placeholder="+51..." />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input value={form.direccion} onChange={set('direccion')} maxLength={200} />
              </div>
            </CardContent>
          </Card>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(returnTo || '/admin/clientes')}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>{mutation.isPending ? 'Creando...' : 'Crear cliente'}</Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
