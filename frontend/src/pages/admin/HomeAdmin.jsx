import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, FolderOpen, Clock, UserPlus, FolderPlus, CalendarDays, ArrowRight, DollarSign } from 'lucide-react';
import { userApi, clientApi, projectApi, timeEntryApi, periodosApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

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

  const { data: ultimosPeriodos = [] } = useQuery({
    queryKey: ['ultimos-periodos'],
    queryFn: () => periodosApi.listar().then((r) => r.data.slice(0, 3)),
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <p className="text-muted-foreground">Vista general del sistema</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/usuarios/crear')}>
              <UserPlus className="h-4 w-4 mr-1.5" />Nuevo usuario
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/clientes/crear')}>
              <Building2 className="h-4 w-4 mr-1.5" />Nuevo cliente
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/proyectos/crear')}>
              <FolderPlus className="h-4 w-4 mr-1.5" />Nuevo proyecto
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <TarjetaMetrica titulo="Usuarios activos" valor={usuarios} icono={Users} color="bg-blue-500" onClick={() => navigate('/admin/usuarios')} />
          <TarjetaMetrica titulo="Clientes activos" valor={clientes} icono={Building2} color="bg-green-500" onClick={() => navigate('/admin/clientes')} />
          <TarjetaMetrica titulo="Proyectos activos" valor={proyectos} icono={FolderOpen} color="bg-purple-500" onClick={() => navigate('/admin/proyectos')} />
          <TarjetaMetrica titulo="Horas pendientes" valor={horasPendientes} icono={Clock} color="bg-orange-500" onClick={() => navigate('/admin/horas')} />
        </div>

        {ultimosPeriodos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md p-1.5 bg-[#0f172a]">
                <DollarSign className="h-3.5 w-3.5 text-white" />
              </div>
              <h2 className="text-sm font-semibold text-[#0f172a] uppercase tracking-wide">Finanzas</h2>
            </div>
            <Card>
              {ultimosPeriodos.map((periodo, idx) => {
                const abierto = !periodo.esta_cerrado;
                return (
                  <div
                    key={periodo.id}
                    className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors hover:bg-slate-50 ${idx < ultimosPeriodos.length - 1 ? 'border-b border-[#e2e8f0]' : ''}`}
                    onClick={() => navigate(`/admin/periodos/${periodo.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-md p-2 ${abierto ? 'bg-[#e5e7eb]' : 'bg-[#0f172a]'}`}>
                        <CalendarDays className={`h-4 w-4 ${abierto ? 'text-[#6b7280]' : 'text-white'}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${abierto ? 'text-[#374151]' : 'text-[#0f172a]'}`}>
                          {MESES[periodo.mes - 1]} {periodo.anio}
                        </p>
                        {abierto && <p className="text-xs text-muted-foreground">Período en curso</p>}
                      </div>
                      {abierto ? (
                        <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#d1fae5] text-[#065f46]">
                          Abierto
                        </span>
                      ) : (
                        <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#e5e7eb] text-[#374151]">
                          Cerrado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => navigate('/admin/periodos')}
                  className="w-full flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Ver más <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
