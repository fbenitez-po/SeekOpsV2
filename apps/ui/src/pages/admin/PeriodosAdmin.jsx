import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, LockOpen } from 'lucide-react';
import { periodosApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function PeriodosAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [anioFiltro, setAnioFiltro] = useState(null);

  const { data: periodos = [], isLoading } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosApi.listar().then((r) => r.data),
  });

  const mutToggle = useMutation({
    mutationFn: (id) => periodosApi.toggle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['periodos'] }),
  });

  const aniosDisponibles = [...new Set(periodos.map((p) => p.anio))].sort((a, b) => b - a);
  const periodosFiltrados = anioFiltro ? periodos.filter((p) => p.anio === anioFiltro) : periodos;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </button>
          <h1 className="text-2xl font-bold">Períodos</h1>
          <p className="text-sm text-muted-foreground mt-1">Administra el estado de apertura y cierre de cada período mensual.</p>
        </div>

        {aniosDisponibles.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAnioFiltro(null)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${anioFiltro === null ? 'bg-foreground text-background font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              Todos
            </button>
            {aniosDisponibles.map((anio) => (
              <button
                key={anio}
                type="button"
                onClick={() => setAnioFiltro(anio)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${anioFiltro === anio ? 'bg-foreground text-background font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                {anio}
              </button>
            ))}
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
            ) : periodosFiltrados.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No hay períodos para mostrar.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Mes</th>
                    <th className="px-4 py-3 text-left font-medium">Año</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {periodosFiltrados.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/admin/periodos/${p.id}`)}>
                      <td className="px-4 py-3 font-medium">{MESES[p.mes - 1]}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.anio}</td>
                      <td className="px-4 py-3">
                        {p.esta_cerrado ? (
                          <Badge variant="secondary">Cerrado</Badge>
                        ) : (
                          <Badge variant="success">Abierto</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); mutToggle.mutate(p.id); }}
                            disabled={mutToggle.isPending}
                            title={p.esta_cerrado ? 'Abrir período' : 'Cerrar período'}
                          >
                            {p.esta_cerrado ? (
                              <LockOpen className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
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
