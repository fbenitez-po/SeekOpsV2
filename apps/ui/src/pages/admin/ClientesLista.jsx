import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, ToggleLeft, ToggleRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { clientApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';

export default function ClientesLista() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', search],
    queryFn: () => clientApi.listar({ search, limit: 50 }).then((r) => r.data),
  });

  const mutToggle = useMutation({
    mutationFn: (id) => clientApi.toggleActivo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  });

  const clientes = data?.data || [];

  const exportarExcel = () => {
    const filas = clientes.map((c) => ({
      'Razón social': c.razon_social || '',
      'Razón comercial': c.razon_comercial || '',
      'RUC': c.ruc || '',
      'Segmentación': c.segmentacion?.nombre || '',
      'Nombre contacto comercial': c.nombre_contacto || '',
      'Email contacto comercial': c.email_contacto || '',
      'Teléfono': c.telefono || '',
      'Dirección': c.direccion || '',
      'Estado': c.activo ? 'Activo' : 'Inactivo',
    }));
    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, 'clientes.xlsx');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Clientes</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportarExcel} className="gap-2" disabled={clientes.length === 0}>
                <Download className="h-4 w-4" /> Exportar Excel
              </Button>
              <Button onClick={() => navigate('/admin/clientes/crear')} className="gap-2">
                <Plus className="h-4 w-4" /> Nuevo cliente
              </Button>
            </div>
          </div>
        </div>

        <Input placeholder="Buscar por razón social o RUC..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Razón social</th>
                    <th className="px-4 py-3 text-left font-medium">RUC</th>
                    <th className="px-4 py-3 text-left font-medium">Segmentación</th>
                    <th className="px-4 py-3 text-left font-medium">Proyectos</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{c.razon_comercial || c.razon_social || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.ruc}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.segmentacion?.nombre || '—'}</td>
                      <td className="px-4 py-3">{c.proyectos_count}</td>
                      <td className="px-4 py-3">
                        <Badge variant={c.activo ? 'success' : 'secondary'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/clientes/${c.id}/editar`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => mutToggle.mutate(c.id)}>
                            {c.activo ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
