import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

import Login from './pages/auth/Login';
import RecuperarContrasena from './pages/auth/RecuperarContrasena';
import ConfirmarReset from './pages/auth/ConfirmarReset';
import ActivarCuenta from './pages/auth/ActivarCuenta';

import HomeSeekerPage from './pages/seeker/HomeSeeker';
import CargarHorasPage from './pages/seeker/CargarHoras';
import AjustarHorasPage from './pages/seeker/AjustarHoras';
import MisHorasPage from './pages/seeker/MisHoras';

import HomeGestorPage from './pages/gestor/HomeGestor';
import HorasEquipoPage from './pages/gestor/HorasEquipo';
import CargarHorasGestorPage from './pages/gestor/CargarHorasGestor';
import MisHorasGestorPage from './pages/gestor/MisHorasGestor';
import ProyeccionesHorasPage from './pages/gestor/ProyeccionesHoras';

import HomeAdminPage from './pages/admin/HomeAdmin';
import UsuariosListaPage from './pages/admin/UsuariosLista';
import UsuarioCrearPage from './pages/admin/UsuarioCrear';
import UsuarioEditarPage from './pages/admin/UsuarioEditar';
import ClientesListaPage from './pages/admin/ClientesLista';
import ClienteCrearPage from './pages/admin/ClienteCrear';
import ClienteEditarPage from './pages/admin/ClienteEditar';
import ProyectosListaPage from './pages/admin/ProyectosLista';
import ProyectoCrearPage from './pages/admin/ProyectoCrear';
import ProyectoEditarPage from './pages/admin/ProyectoEditar';
import ProyectoAsignarPage from './pages/admin/ProyectoAsignar';
import TodasLasHorasPage from './pages/admin/TodasLasHoras';
import PeriodosAdminPage from './pages/admin/PeriodosAdmin';
import PeriodoDashboardPage from './pages/admin/PeriodoDashboard';
import IngresosAdminPage from './pages/admin/IngresosAdmin';
import IngresosCrearPage from './pages/admin/IngresosCrear';
import GastosAdminListaPage from './pages/admin/GastosAdminLista';
import GastosAdminCrearPage from './pages/admin/GastosAdminCrear';
import GastosAdminEditarPage from './pages/admin/GastosAdminEditar';
import CostosVentaListaPage from './pages/admin/CostosVentaLista';
import CostosVentaCrearPage from './pages/admin/CostosVentaCrear';
import CostosVentaEditarPage from './pages/admin/CostosVentaEditar';
import CostosPorPersonaListaPage from './pages/admin/CostosPorPersonaLista';
import CostosPorPersonaCrearPage from './pages/admin/CostosPorPersonaCrear';
import CostosPorPersonaEditarPage from './pages/admin/CostosPorPersonaEditar';

function RutaProtegida({ children, roles }) {
  const usuario = useAuthStore((s) => s.usuario);
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.some((r) => usuario.roles.includes(r))) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function RedireccionInicio() {
  const usuario = useAuthStore((s) => s.usuario);
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.roles.includes('ADMIN')) return <Navigate to="/admin" replace />;
  if (usuario.roles.includes('GESTOR')) return <Navigate to="/gestor" replace />;
  return <Navigate to="/seeker" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
        <Route path="/reset" element={<ConfirmarReset />} />
        <Route path="/activar-cuenta" element={<ActivarCuenta />} />

        {/* Redirección raíz */}
        <Route path="/" element={<RedireccionInicio />} />

        {/* Seeker */}
        <Route path="/seeker" element={<RutaProtegida roles={['SEEKER', 'GESTOR', 'ADMIN']}><HomeSeekerPage /></RutaProtegida>} />
        <Route path="/seeker/cargar" element={<RutaProtegida roles={['SEEKER', 'GESTOR', 'ADMIN']}><CargarHorasPage /></RutaProtegida>} />
        <Route path="/seeker/ajustar/:id" element={<RutaProtegida roles={['SEEKER', 'GESTOR', 'ADMIN']}><AjustarHorasPage /></RutaProtegida>} />
        <Route path="/seeker/mis-horas" element={<RutaProtegida roles={['SEEKER', 'GESTOR', 'ADMIN']}><MisHorasPage /></RutaProtegida>} />

        {/* Gestor */}
        <Route path="/gestor" element={<RutaProtegida roles={['GESTOR', 'ADMIN']}><HomeGestorPage /></RutaProtegida>} />
        <Route path="/gestor/equipo" element={<RutaProtegida roles={['GESTOR', 'ADMIN']}><HorasEquipoPage /></RutaProtegida>} />
        <Route path="/gestor/cargar" element={<RutaProtegida roles={['GESTOR', 'ADMIN']}><CargarHorasGestorPage /></RutaProtegida>} />
        <Route path="/gestor/mis-horas" element={<RutaProtegida roles={['GESTOR', 'ADMIN']}><MisHorasGestorPage /></RutaProtegida>} />
        <Route path="/gestor/proyecciones" element={<RutaProtegida roles={['GESTOR', 'ADMIN']}><ProyeccionesHorasPage /></RutaProtegida>} />

        {/* Admin */}
        <Route path="/admin" element={<RutaProtegida roles={['ADMIN']}><HomeAdminPage /></RutaProtegida>} />
        <Route path="/admin/usuarios" element={<RutaProtegida roles={['ADMIN']}><UsuariosListaPage /></RutaProtegida>} />
        <Route path="/admin/usuarios/crear" element={<RutaProtegida roles={['ADMIN']}><UsuarioCrearPage /></RutaProtegida>} />
        <Route path="/admin/usuarios/:id/editar" element={<RutaProtegida roles={['ADMIN']}><UsuarioEditarPage /></RutaProtegida>} />
        <Route path="/admin/clientes" element={<RutaProtegida roles={['ADMIN']}><ClientesListaPage /></RutaProtegida>} />
        <Route path="/admin/clientes/crear" element={<RutaProtegida roles={['ADMIN']}><ClienteCrearPage /></RutaProtegida>} />
        <Route path="/admin/clientes/:id/editar" element={<RutaProtegida roles={['ADMIN']}><ClienteEditarPage /></RutaProtegida>} />
        <Route path="/admin/proyectos" element={<RutaProtegida roles={['ADMIN']}><ProyectosListaPage /></RutaProtegida>} />
        <Route path="/admin/proyectos/crear" element={<RutaProtegida roles={['ADMIN']}><ProyectoCrearPage /></RutaProtegida>} />
        <Route path="/admin/proyectos/:id/editar" element={<RutaProtegida roles={['ADMIN']}><ProyectoEditarPage /></RutaProtegida>} />
        <Route path="/admin/proyectos/:id/usuarios" element={<RutaProtegida roles={['ADMIN']}><ProyectoAsignarPage /></RutaProtegida>} />
        <Route path="/admin/horas" element={<RutaProtegida roles={['ADMIN']}><TodasLasHorasPage /></RutaProtegida>} />
        <Route path="/admin/periodos" element={<RutaProtegida roles={['ADMIN']}><PeriodosAdminPage /></RutaProtegida>} />
        <Route path="/admin/periodos/:id" element={<RutaProtegida roles={['ADMIN']}><PeriodoDashboardPage /></RutaProtegida>} />
        <Route path="/admin/ingresos" element={<RutaProtegida roles={['ADMIN']}><IngresosAdminPage /></RutaProtegida>} />
        <Route path="/admin/ingresos/crear" element={<RutaProtegida roles={['ADMIN']}><IngresosCrearPage /></RutaProtegida>} />
        <Route path="/admin/gastos-admin" element={<RutaProtegida roles={['ADMIN']}><GastosAdminListaPage /></RutaProtegida>} />
        <Route path="/admin/gastos-admin/crear" element={<RutaProtegida roles={['ADMIN']}><GastosAdminCrearPage /></RutaProtegida>} />
        <Route path="/admin/gastos-admin/:id/editar" element={<RutaProtegida roles={['ADMIN']}><GastosAdminEditarPage /></RutaProtegida>} />
        <Route path="/admin/costos-venta" element={<RutaProtegida roles={['ADMIN']}><CostosVentaListaPage /></RutaProtegida>} />
        <Route path="/admin/costos-venta/crear" element={<RutaProtegida roles={['ADMIN']}><CostosVentaCrearPage /></RutaProtegida>} />
        <Route path="/admin/costos-venta/:id/editar" element={<RutaProtegida roles={['ADMIN']}><CostosVentaEditarPage /></RutaProtegida>} />
        <Route path="/admin/costos-por-persona" element={<RutaProtegida roles={['ADMIN']}><CostosPorPersonaListaPage /></RutaProtegida>} />
        <Route path="/admin/costos-por-persona/crear" element={<RutaProtegida roles={['ADMIN']}><CostosPorPersonaCrearPage /></RutaProtegida>} />
        <Route path="/admin/costos-por-persona/:id/editar" element={<RutaProtegida roles={['ADMIN']}><CostosPorPersonaEditarPage /></RutaProtegida>} />
      </Routes>
    </BrowserRouter>
  );
}
