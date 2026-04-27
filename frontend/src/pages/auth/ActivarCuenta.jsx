import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

export default function ActivarCuenta() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [activado, setActivado] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!token) {
      setError('Link de activación inválido');
      return;
    }

    setCargando(true);
    try {
      await authApi.confirmarReset({ token, nueva_password: password, confirmar_password: confirmar });
      setActivado(true);
    } catch (err) {
      const msg = err.response?.data?.error || '';
      if (msg.includes('expiró') || msg.includes('inválido')) {
        setError('El link de activación expiró o es inválido. Pedí al administrador que reenvíe la invitación.');
      } else {
        setError(msg || 'Ocurrió un error. Intentá de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  }

  if (activado) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
      >
        <Card className="w-full max-w-sm" style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem' }}>
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: '#d1fae5' }}
            >
              <svg className="h-6 w-6" style={{ color: '#065f46' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#0f172a' }}>¡Cuenta activada!</h2>
              <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
                Tu contraseña fue configurada correctamente. Ya podés ingresar a Seekops.
              </p>
            </div>
            <Button
              className="w-full"
              style={{ backgroundColor: '#0f172a', color: '#fff' }}
              onClick={() => navigate('/login')}
            >
              Ir al login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
    >
      <Card className="w-full max-w-sm" style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem' }}>
        <CardHeader className="space-y-1 pb-2">
          <div
            className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: '#0f172a' }}
          >
            <span className="text-lg font-bold text-white">S</span>
          </div>
          <CardTitle className="text-center text-xl" style={{ color: '#0f172a' }}>
            Activar cuenta
          </CardTitle>
          <CardDescription className="text-center" style={{ color: '#64748b' }}>
            Establecé tu contraseña para comenzar a usar Seekops.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={manejarSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: '#0f172a' }}>Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                style={{ borderColor: '#e2e8f0', borderRadius: '0.5rem' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmar" style={{ color: '#0f172a' }}>Confirmar contraseña</Label>
              <Input
                id="confirmar"
                type="password"
                placeholder="Repetí la contraseña"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
                style={{ borderColor: '#e2e8f0', borderRadius: '0.5rem' }}
              />
            </div>

            {error && (
              <p
                className="rounded-md px-3 py-2 text-sm"
                style={{ backgroundColor: '#fee2e2', color: '#7f1d1d' }}
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={cargando}
              style={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '0.5rem' }}
            >
              {cargando ? 'Activando...' : 'Activar cuenta'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
