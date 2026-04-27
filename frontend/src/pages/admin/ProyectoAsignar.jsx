import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, UserPlus } from 'lucide-react';
import { projectApi, userApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';

export default function ProyectoAsignar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [usuarioId, setUsuarioId] = useState('');
  const [rol, setRol] = useState('SEEKER');

  const { data: proyecto } = useQuery({ queryKey: ['proyecto', id], queryFn: () => projectApi.obtener(id).then((r) => r.data) });
  const { data: todosUsuarios } = useQuery({ queryKey: ['usuarios-select'], queryFn: () => userApi.listar({ activo: true, limit: 100 }).then((r) => r.data.data) });

  const usuariosAsignados = proyecto?.usuarios || [];
  const idsAsignados = usuariosAsignados.map((u) => u.id);
  const usuariosDisponibles = (todosUsuarios || []).filter((u) => !idsAsignados.includes(u.id));

  const mutAsignar = useMutation({
    mutationFn: () => projectApi.asignarUsuarios(id, [{ usuario_id: usuarioId, rol }]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyecto', id] });
      setUsuarioId('');
    },
  });

  const mutDesasignar = useMutation({
    mutationFn: (uid) => projectApi.desasignarUsuario(id, uid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proyecto', id] }),
  });

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Asignar usuarios</h1>
          <p className="text-muted-foreground">{proyecto?.nombre} ({proyecto?.codigo})</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Agregar usuario al proyecto</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Usuario</Label>
                <Select value={usuarioId} onValueChange={setUsuarioId}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná usuario" /></SelectTrigger>
                  <SelectContent>
                    {usuariosDisponibles.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.nombres} {u.apellidos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rol en el proyecto</Label>
                <Select value={rol} onValueChange={setRol}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEEKER">Seeker</SelectItem>
                    <SelectItem value="GESTOR">Gestor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => mutAsignar.mutate()} disabled={!usuarioId || mutAsignar.isPending} className="gap-2">
              <UserPlus className="h-4 w-4" /> Asignar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Usuarios asignados ({usuariosAsignados.length})</CardTitle></CardHeader>
          <CardContent>
            {usuariosAsignados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin usuarios asignados</p>
            ) : (
              <div className="space-y-2">
                {usuariosAsignados.map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">{u.nombres} {u.apellidos}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{u.rol}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => mutDesasignar.mutate(u.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => navigate('/admin/proyectos')}>Volver a proyectos</Button>
      </div>
    </Layout>
  );
}
