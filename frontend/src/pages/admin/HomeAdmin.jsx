import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, FolderOpen, Clock } from 'lucide-react';
import { userApi, clientApi, projectApi, timeEntryApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

function TarjetaMetrica({ titulo, valor, icono: Icon, color, onClick }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
        <div className={`rounded-md p-2 ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{valor ?? '—'}</p>
      </CardContent>
    </Card>
  );
}

export default function HomeAdmin() {
  const navigate = useNavigate();

  const { data: usuarios } = useQuery({
    queryKey: ['usuarios-count'],
    queryFn: () => userApi.listar({ activo: true, limit: 1 }).then((r) => r.data.pagination.total),
  });

  const { data: clientes } = useQuery({
    queryKey: ['clientes-count'],
    queryFn: () => clientApi.listar({ activo: true, limit: 1 }).then((r) => r.data.pagination.total),
  });

  const { data: proyectos } = useQuery({
    queryKey: ['proyectos-count'],
    queryFn: () => projectApi.listar({ activo: true, limit: 1 }).then((r) => r.data.pagination.total),
  });

  const { data: horasPendientes } = useQuery({
    queryKey: ['horas-pendientes-count'],
    queryFn: () => timeEntryApi.listar({ estado: 'PENDIENTE', limit: 1 }).then((r) => r.data.pagination.total),
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Vista general del sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <TarjetaMetrica titulo="Usuarios activos" valor={usuarios} icono={Users} color="bg-blue-500" onClick={() => navigate('/admin/usuarios')} />
          <TarjetaMetrica titulo="Clientes activos" valor={clientes} icono={Building2} color="bg-green-500" onClick={() => navigate('/admin/clientes')} />
          <TarjetaMetrica titulo="Proyectos activos" valor={proyectos} icono={FolderOpen} color="bg-purple-500" onClick={() => navigate('/admin/proyectos')} />
          <TarjetaMetrica titulo="Horas pendientes" valor={horasPendientes} icono={Clock} color="bg-orange-500" onClick={() => navigate('/admin/horas')} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="text-base">Acciones rápidas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/usuarios/crear')}>+ Nuevo usuario</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/clientes/crear')}>+ Nuevo cliente</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/proyectos/crear')}>+ Nuevo proyecto</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
