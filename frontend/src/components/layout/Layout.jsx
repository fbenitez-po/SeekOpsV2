import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Clock, Users, Building2, FolderOpen, LayoutDashboard, CheckSquare, CalendarRange } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { cn } from '../../lib/utils';

const navSeeker = [
  { label: 'Inicio', href: '/seeker', icon: LayoutDashboard },
  { label: 'Cargar horas', href: '/seeker/cargar', icon: Clock },
];

const navGestor = [
  { label: 'Inicio', href: '/gestor', icon: LayoutDashboard },
  { label: 'Horas del equipo', href: '/gestor/equipo', icon: CheckSquare },
  { label: 'Proyecciones', href: '/gestor/proyecciones', icon: CalendarRange },
  { label: 'Cargar mis horas', href: '/gestor/cargar', icon: Clock },
];

const navAdmin = [
  { label: 'Inicio', href: '/admin', icon: LayoutDashboard },
  { label: 'Horas', href: '/admin/horas', icon: CheckSquare },
  { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
  { label: 'Clientes', href: '/admin/clientes', icon: Building2 },
  { label: 'Proyectos', href: '/admin/proyectos', icon: FolderOpen },
];

export default function Layout({ children }) {
  const { usuario, logout, esAdmin, esGestor } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const navItems = esAdmin() ? navAdmin : esGestor() ? navGestor : navSeeker;

  async function manejarLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen" style={{ background: '#f8fafc' }}>
      {/* Sidebar — navy oscuro, igual al color primary del preview */}
      <aside className="flex w-56 flex-col" style={{ background: '#0f172a' }}>
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <span className="text-base font-bold text-white tracking-tight">Seekops</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-3 pt-4">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
              {usuario?.nombres?.[0]}{usuario?.apellidos?.[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {usuario?.nombres} {usuario?.apellidos}
              </p>
              <p className="truncate text-xs text-white/50">
                {usuario?.roles?.join(' · ')}
              </p>
            </div>
          </div>
          <button
            onClick={manejarLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
