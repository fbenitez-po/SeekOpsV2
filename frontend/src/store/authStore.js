import {create} from 'zustand';
import {authApi} from '../services/api';

const useAuthStore = create((set, get) => ({
  usuario: JSON.parse(localStorage.getItem('usuario') || 'null'),
  cargando: false,
  error: null,

  login: async (email, password) => {
    set({ cargando: true, error: null });
    try {
      const { data } = await authApi.login({ email, password });
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      localStorage.setItem('usuario', JSON.stringify(data.user));
      set({ usuario: data.user, cargando: false });
      return data.user;
    } catch (err) {
      const mensaje = err.response?.data?.error || 'Error al iniciar sesión';
      set({ error: mensaje, cargando: false });
      throw new Error(mensaje);
    }
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      await authApi.logout(refreshToken);
    } finally {
      localStorage.clear();
      set({ usuario: null });
    }
  },

  tieneRol: (rol) => {
    const { usuario } = get();
    return usuario?.roles?.includes(rol) ?? false;
  },

  esAdmin: () => get().tieneRol('ADMIN'),
  esGestor: () => get().tieneRol('MANAGER'),
  esSeeker: () => get().tieneRol('SEEKER'),
}));

export default useAuthStore;
