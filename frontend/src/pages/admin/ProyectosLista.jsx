import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import { projectApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';

export default function ProyectosLista() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['proyectos-admin', search],
    queryFn: () => projectApi.listar({ search, limit: 50 }).then((r) => r.data),
  });

  const mutToggle = useMutation({
    mutationFn: (id) => projectApi.toggleActivo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proyectos-admin'] }),
  });

  const proyectos = data?.data || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Proyectos</h1>
            <Button onClick={() => navigate('/admin/proyectos/crear')} className="gap-2">
              <Plus className="h-4 w-4" /> Nuevo proyecto
            </Button>
          </div>
        </div>

        <Input placeholder="Buscar por nombre o código..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Código / Nombre</th>
                    <th className="px-4 py-3 text-left font-medium">Cliente</th>
                    <th className="px-4 py-3 text-left font-medium">Gestor</th>
                    <th className="px-4 py-3 text-left font-medium">Equipo</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proyectos.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground">{p.codigo}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.cliente?.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.gestor?.nombres} {p.gestor?.apellidos}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.usuarios_count} integrantes</td>
                      <td className="px-4 py-3">
                        <Badge variant={p.activo ? 'success' : 'secondary'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/proyectos/${p.id}/usuarios`)} title="Asignar usuarios">
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/proyectos/${p.id}/editar`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => mutToggle.mutate(p.id)}>
                            {p.activo ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
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
