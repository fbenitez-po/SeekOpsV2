import {useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {Pencil, Plus, ToggleLeft, ToggleRight} from 'lucide-react';
import {userApi} from '../../services/api';
import Layout from '../../components/layout/Layout';
import {Button} from '../../components/ui/button';
import {Input} from '../../components/ui/input';
import {Badge} from '../../components/ui/badge';
import {Card, CardContent} from '../../components/ui/card';

export default function UsuariosLista() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['usuarios', search],
    queryFn: () => userApi.listar({ search, limit: 50 }).then((r) => r.data),
  });

  const mutToggle = useMutation({
    mutationFn: (id) => userApi.toggleActivo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const usuarios = data?.data || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <Button onClick={() => navigate('/admin/usuarios/crear')} className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo usuario
          </Button>
        </div>

        <Input placeholder="Buscar por nombre o email..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Nombre</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Grupos</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {u.groups.map((g) => <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.isActive ? 'success' : 'secondary'}>{u.isActive ? 'Activo' : 'Inactivo'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/usuarios/${u.id}/editar`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => mutToggle.mutate(u.id)}>
                            {u.isActive ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
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
