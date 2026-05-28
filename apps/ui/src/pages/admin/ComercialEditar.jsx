import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { comercialApi, projectApi, userApi } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';

const DRAFT_KEY = 'seekops_comercial_editar_draft';

function duracionSemanas(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) return null;
  const diff = new Date(fechaFin) - new Date(fechaInicio);
  const semanas = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  return semanas > 0 ? semanas : null;
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-sm font-medium text-[#1e293b] mb-1.5">
      {children}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

function ReadonlyField({ value }) {
  return (
    <div className="h-9 px-3 flex items-center rounded-md border border-[#e2e8f0] bg-[#f8fafc] text-sm text-[#64748b]">
      {value}
    </div>
  );
}

export default function ComercialEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);

  const [form, setForm] = useState(null);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);

  const { data: registro, isLoading: cargando } = useQuery({
    queryKey: ['comercial', id],
    queryFn: () => comercialApi.obtener(id).then((r) => r.data),
  });

  const { data: proyectos = [] } = useQuery({
    queryKey: ['proyectos-activos'],
    queryFn: () => projectApi.listar({ activo: 'true', limit: 500 }).then((r) => r.data?.data || []),
  });

  const { data: responsables = [] } = useQuery({
    queryKey: ['usuarios-admin'],
    queryFn: () => userApi.listar({ grupo: 'ADMIN', activo: true, limit: 200 }).then((r) => r.data?.data || []),
  });

  const { data: tiposDocumento = [] } = useQuery({
    queryKey: ['tipos-documento'],
    queryFn: () => comercialApi.tiposDocumento().then((r) => r.data),
  });

  useEffect(() => {
    if (!registro || form !== null) return;

    const draft = sessionStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const { form: f, proyectoSeleccionado: ps } = JSON.parse(draft);
        if (f) { setForm(f); setProyectoSeleccionado(ps || null); }
      } catch {}
      sessionStorage.removeItem(DRAFT_KEY);
      return;
    }

    setForm({
      fecha_registro: registro.fecha_registro?.slice(0, 10) || '',
      proyecto_id: registro.proyecto_id || '',
      responsable_id: registro.responsable_id || '',
      detalle: registro.detalle || '',
      precio: String(registro.precio ?? ''),
      tipo_documento_id: registro.tipo_documento_id || '',
      estado_contrato: registro.estado_contrato ?? false,
      facturacion: registro.facturacion ?? false,
      evidencia_nombre: registro.evidencia_nombre || '',
    });
    setProyectoSeleccionado({
      ts_nombre: registro.proyecto_tipo,
      area_nombre: registro.proyecto_division,
      fecha_inicio: registro.fecha_inicio,
      fecha_fin: registro.fecha_fin,
    });
  }, [registro, form]);

  useEffect(() => {
    if (!form?.proyecto_id || !proyectos.length) return;
    const p = proyectos.find((x) => x.id === form.proyecto_id);
    if (p) setProyectoSeleccionado(p);
  }, [proyectos]);

  const mutActualizar = useMutation({
    mutationFn: (datos) => comercialApi.actualizar(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comercial'] });
      navigate('/admin/comercial');
    },
  });

  function seleccionarProyecto(proyectoId) {
    setForm((f) => ({ ...f, proyecto_id: proyectoId }));
    const p = proyectos.find((x) => x.id === proyectoId);
    setProyectoSeleccionado(p || null);
  }

  function irACrearProyecto() {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, proyectoSeleccionado }));
    navigate(`/admin/proyectos/crear?returnTo=/admin/comercial/${id}/editar`);
  }

  function manejarArchivo(e) {
    const archivo = e.target.files?.[0];
    if (archivo) setForm((f) => ({ ...f, evidencia_nombre: archivo.name }));
  }

  if (cargando || form === null) {
    return <Layout><p className="p-6 text-sm text-muted-foreground">Cargando...</p></Layout>;
  }

  const valido = form.fecha_registro && form.proyecto_id && form.responsable_id && form.precio !== '';

  const tipoProy = proyectoSeleccionado
    ? (proyectoSeleccionado.tipo_servicio?.nombre || 'No configurado')
    : '—';
  const divisionProy = proyectoSeleccionado
    ? (proyectoSeleccionado.segmentacion?.nombre || 'No configurado')
    : '—';
  const duracion = proyectoSeleccionado
    ? (duracionSemanas(proyectoSeleccionado.fecha_inicio, proyectoSeleccionado.fecha_fin) ?? 'Sin fechas')
    : '—';

  function datos() {
    return {
      fecha_registro: form.fecha_registro,
      proyecto_id: form.proyecto_id,
      responsable_id: form.responsable_id,
      detalle: form.detalle || null,
      precio: Number(form.precio),
      tipo_documento_id: form.tipo_documento_id || null,
      estado_contrato: form.estado_contrato,
      facturacion: form.facturacion,
      evidencia_nombre: form.evidencia_nombre || null,
    };
  }

  const error = mutActualizar.error?.response?.data?.error;
  const selectCls = 'w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin/comercial')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver a Comercial
          </button>
          <h1 className="text-2xl font-bold">Editar registro comercial</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">

              <div>
                <FieldLabel required>Fecha registro</FieldLabel>
                <Input
                  type="date"
                  value={form.fecha_registro}
                  onChange={(e) => setForm((f) => ({ ...f, fecha_registro: e.target.value }))}
                />
              </div>
              <div>
                <FieldLabel required>Responsable</FieldLabel>
                <select
                  value={form.responsable_id}
                  onChange={(e) => setForm((f) => ({ ...f, responsable_id: e.target.value }))}
                  className={selectCls}
                >
                  <option value="">Seleccionar responsable...</option>
                  {responsables.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombres} {u.apellidos}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <FieldLabel required>Proyecto</FieldLabel>
                <div className="flex gap-2">
                  <select
                    value={form.proyecto_id}
                    onChange={(e) => seleccionarProyecto(e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Seleccionar proyecto...</option>
                    {proyectos.map((p) => (
                      <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={irACrearProyecto}
                    title="Crear nuevo proyecto"
                    className="shrink-0 h-9 w-9 rounded-lg border border-[#e2e8f0] bg-white flex items-center justify-center text-[#64748b] hover:border-[#0f172a] hover:text-[#0f172a] transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <FieldLabel>Tipo de servicio</FieldLabel>
                <ReadonlyField value={tipoProy} />
              </div>
              <div>
                <FieldLabel>Segmentación</FieldLabel>
                <ReadonlyField value={divisionProy} />
              </div>

              <div>
                <FieldLabel required>Precio</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.precio}
                  onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-x-4">
                <div>
                  <FieldLabel>Moneda</FieldLabel>
                  <ReadonlyField value="PEN" />
                </div>
                <div>
                  <FieldLabel>Duración (sem.)</FieldLabel>
                  <ReadonlyField value={duracion} />
                </div>
              </div>

              <div>
                <FieldLabel>Documento</FieldLabel>
                <select
                  value={form.tipo_documento_id}
                  onChange={(e) => setForm((f) => ({ ...f, tipo_documento_id: e.target.value }))}
                  className={selectCls}
                >
                  <option value="">Sin documento</option>
                  {tiposDocumento.map((td) => (
                    <option key={td.id} value={td.id}>{td.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Evidencia</FieldLabel>
                <input ref={fileRef} type="file" className="hidden" onChange={manejarArchivo} />
                <div className="flex items-center gap-2 h-9">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    Seleccionar archivo
                  </Button>
                  <span className="text-sm text-muted-foreground truncate">
                    {form.evidencia_nombre || 'Ningún archivo seleccionado'}
                  </span>
                  {form.evidencia_nombre && (
                    <button type="button" onClick={() => setForm((f) => ({ ...f, evidencia_nombre: '' }))} className="text-muted-foreground hover:text-foreground shrink-0">×</button>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <FieldLabel>Detalle</FieldLabel>
                <textarea
                  value={form.detalle}
                  onChange={(e) => setForm((f) => ({ ...f, detalle: e.target.value }))}
                  rows={4}
                  placeholder="Descripción libre del registro..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="col-span-2 flex gap-8">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.estado_contrato}
                    onChange={(e) => setForm((f) => ({ ...f, estado_contrato: e.target.checked }))}
                    className="h-4 w-4 rounded border"
                    style={{ accentColor: '#0f172a' }}
                  />
                  <span className="text-sm font-medium">Estado de contrato</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.facturacion}
                    onChange={(e) => setForm((f) => ({ ...f, facturacion: e.target.checked }))}
                    className="h-4 w-4 rounded border"
                    style={{ accentColor: '#0f172a' }}
                  />
                  <span className="text-sm font-medium">Facturación</span>
                </label>
              </div>

            </div>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <div className="flex gap-2 mt-6 pt-4 border-t border-[#e2e8f0]">
              <Button variant="outline" onClick={() => navigate('/admin/comercial')}>Cancelar</Button>
              <Button onClick={() => mutActualizar.mutate(datos())} disabled={!valido || mutActualizar.isPending}>
                Guardar cambios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
