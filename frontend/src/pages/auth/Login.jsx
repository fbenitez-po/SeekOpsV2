import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, cargando } = useAuthStore();
  const navigate = useNavigate();

  async function manejarSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const usuario = await login(email, password);
      if (usuario.roles.includes('ADMIN')) navigate('/admin');
      else if (usuario.roles.includes('GESTOR')) navigate('/gestor');
      else navigate('/seeker');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo y título */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg shadow-md"
              style={{ background: '#0f172a' }}
            >
              <span className="text-2xl font-bold text-white">S</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#0f172a' }}>
            Seekops
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
            Ingresá tus credenciales
          </p>
        </div>

        {/* Card formulario */}
        <div className="rounded-xl border bg-white p-8 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
          {/* Error */}
          {error && (
            <div
              className="mb-5 flex items-start gap-3 rounded-lg border p-4"
              style={{ background: '#fef2f2', borderColor: '#fecaca' }}
            >
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">Credenciales inválidas</p>
                <p className="mt-0.5 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={manejarSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: '#1e293b' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="tu@seekglobal.co"
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                style={{
                  border: '1px solid #e2e8f0',
                  color: '#1e293b',
                  background: 'white',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0f172a';
                  e.target.style.boxShadow = '0 0 0 3px rgba(15,23,42,0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: '#1e293b' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                style={{
                  border: '1px solid #e2e8f0',
                  color: '#1e293b',
                  background: 'white',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0f172a';
                  e.target.style.boxShadow = '0 0 0 3px rgba(15,23,42,0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="mt-1 w-full rounded-lg py-2.5 text-sm font-medium text-white transition-colors"
              style={{ background: cargando ? '#e2e8f0' : '#0f172a', color: cargando ? '#94a3b8' : 'white' }}
              onMouseEnter={(e) => { if (!cargando) e.target.style.background = '#1e293b'; }}
              onMouseLeave={(e) => { if (!cargando) e.target.style.background = '#0f172a'; }}
            >
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link
              to="/recuperar-contrasena"
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: '#0f172a' }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
