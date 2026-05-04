import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._reintento) {
      original._reintento = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/auth/refresh-token`, { refresh_token: refreshToken });
        localStorage.setItem('access_token', data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (datos) => api.post('/auth/login', datos),
  logout: (refreshToken) => api.post('/auth/logout', { refresh_token: refreshToken }),
  solicitarReset: (email) => api.post('/auth/solicitar-reset', { email }),
  confirmarReset: (datos) => api.post('/auth/confirmar-reset', datos),
};

// Time Entries
export const timeEntryApi = {
  listar: (params) => api.get('/time-entries', { params }),
  obtener: (id) => api.get(`/time-entries/${id}`),
  crear: (datos) => api.post('/time-entries', datos),
  ajustar: (id, datos) => api.put(`/time-entries/${id}`, datos),
  aprobar: (id) => api.post(`/time-entries/${id}/aprobar`),
  observar: (id, datos) => api.post(`/time-entries/${id}/observar`, datos),
  rechazar: (id, datos) => api.post(`/time-entries/${id}/rechazar`, datos),
  semanasSinCarga: () => api.get('/time-entries/semanas-sin-carga'),
};

// Usuarios
export const userApi = {
  listar: (params) => api.get('/users', { params }),
  obtener: (id) => api.get(`/users/${id}`),
  crear: (datos) => api.post('/users', datos),
  actualizar: (id, datos) => api.put(`/users/${id}`, datos),
  toggleActivo: (id) => api.patch(`/users/${id}/toggle-activo`),
};

// Clientes
export const clientApi = {
  listar: (params) => api.get('/clients', { params }),
  obtener: (id) => api.get(`/clients/${id}`),
  crear: (datos) => api.post('/clients', datos),
  actualizar: (id, datos) => api.put(`/clients/${id}`, datos),
  toggleActivo: (id) => api.patch(`/clients/${id}/toggle-activo`),
};

// Proyectos
export const projectApi = {
  listar: (params) => api.get('/projects', { params }),
  obtener: (id) => api.get(`/projects/${id}`),
  crear: (datos) => api.post('/projects', datos),
  actualizar: (id, datos) => api.put(`/projects/${id}`, datos),
  toggleActivo: (id) => api.patch(`/projects/${id}/toggle-activo`),
  asignarUsuarios: (id, usuarios) => api.post(`/projects/${id}/usuarios`, { usuarios }),
  desasignarUsuario: (id, usuarioId) => api.delete(`/projects/${id}/usuarios/${usuarioId}`),
};

// Proyecciones de horas
export const projectionApi = {
  listar: (params) => api.get('/projections', { params }),
  crear: (datos) => api.post('/projections', datos),
  actualizar: (id, datos) => api.put(`/projections/${id}`, datos),
  eliminar: (id) => api.delete(`/projections/${id}`),
  alertas: () => api.get('/projections/alertas'),
};

// Config
export const configApi = {
  equipos: () => api.get('/config/equipos'),
  areas: () => api.get('/config/areas'),
  grupos: () => api.get('/config/grupos'),
  categoriasIngreso: () => api.get('/config/categorias-ingreso'),
  segmentaciones: () => api.get('/config/segmentaciones'),
  sectores: () => api.get('/config/sectores'),
  tiposServicio: () => api.get('/config/tipos-servicio'),
  categoriasUsuario: () => api.get('/config/categorias-usuario'),
  segmentacionesProyecto: () => api.get('/config/segmentaciones-proyecto'),
  categoriasProyecto: () => api.get('/config/categorias-proyecto'),
  capasProductividad: () => api.get('/config/capas-productividad'),
};

export default api;
