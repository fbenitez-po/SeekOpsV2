import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { periodosApi } from '../../services/api';
import Layout from '../../components/layout/Layout';

export default function FinanzasRedirect() {
  const navigate = useNavigate();

  const { data: periodos = [], isSuccess } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosApi.listar().then((r) => r.data),
  });

  useEffect(() => {
    if (!isSuccess) return;
    if (periodos.length === 0) {
      navigate('/admin/periodos', { replace: true });
      return;
    }
    const ordenados = [...periodos].sort((a, b) => b.anio - a.anio || b.mes - a.mes);
    navigate(`/admin/periodos/${ordenados[0].id}`, { replace: true });
  }, [isSuccess, periodos, navigate]);

  return <Layout><div /></Layout>;
}
