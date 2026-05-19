import { AppError } from '../../shared/http/errorHandler';
import * as repo from './timeEntries.repository';
import * as mapper from './timeEntries.mapper';
import type {
  CreateTimeEntryInput,
  AdjustTimeEntryInput,
  ApproveWithObservationInput,
  RejectInput,
} from './timeEntries.schema';

import { sendHoursReminder } from '../../shared/services/email.service';

function calcularCodigoSemana(fecha: Date): string {
  const inicio = new Date(fecha.getFullYear(), 0, 1);
  const dias = Math.floor((fecha.getTime() - inicio.getTime()) / 86400000);
  const semana = Math.ceil((dias + inicio.getDay() + 1) / 7);
  const anio = String(fecha.getFullYear()).slice(-2);
  return `S${String(semana).padStart(2, '0')}/${anio}`;
}

function domingoDeSemanaDe(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  const dia = d.getDay();
  if (dia !== 0) d.setDate(d.getDate() + (7 - dia));
  return d;
}

export async function list(
  filters: Record<string, string>,
  userId: string,
  roles: string[],
) {
  const limit = Math.min(parseInt(filters['limit'] ?? '20') || 20, 100);
  const page = parseInt(filters['page'] ?? '1') || 1;

  const { entries, total } = await repo.findAll(
    {
      estado: filters['estado'],
      semana: filters['semana'],
      usuario_id: filters['usuario_id'],
      proyecto_id: filters['proyecto_id'],
    },
    userId,
    roles,
    limit,
    page,
  );

  const entradasConDetalle = await Promise.all(
    entries.map(async (e) => {
      const approvals = await repo.findApprovals(e.id);
      return mapper.buildTimeEntryDetail(e, approvals);
    }),
  );

  return {
    data: entradasConDetalle,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getById(id: string, userId: string, roles: string[]) {
  const entry = await repo.findById(id);
  if (!entry) throw new AppError('Registro no encontrado', 404);

  const isOwner = entry.user_id === userId;
  const isAdmin = roles.includes('ADMIN');

  if (!isOwner && !isAdmin) {
    const projectId = await repo.findFirstLineProjectId(id);
    if (projectId) {
      const isManager = await repo.isProjectManager(userId, projectId);
      if (!isManager) throw new AppError('No tenés permiso para ver este registro', 403);
    }
  }

  const approvals = await repo.findApprovals(id);
  return mapper.buildTimeEntryDetail(entry, approvals);
}

export async function create(body: CreateTimeEntryInput, userId: string, email: string | null, roles: string[]) {
  const combos = body.lineas.map((l) => `${l.proyecto_id}:${l.categoria_ingreso_id ?? 'null'}`);
  if (new Set(combos).size !== combos.length) {
    throw new AppError('No se puede repetir la misma combinación de proyecto y categoría en una carga', 400);
  }

  const existing = await repo.findExistingEntry(userId, body.semana);
  if (existing) {
    throw new AppError(`Ya existe un registro para la semana ${body.semana} en estado PENDIENTE o APROBADO`, 400);
  }

  for (const linea of body.lineas) {
    const assigned = await repo.isUserAssignedToProject(userId, linea.proyecto_id);
    if (!assigned) throw new AppError('No tenés acceso al proyecto indicado', 403);
  }

  const isOnlyGestor = roles.includes('GESTOR') && !roles.includes('SEEKER');
  const status = isOnlyGestor ? 'APROBADO' : 'PENDIENTE';

  const entry = await repo.create({ userId, email, week: body.semana, status, lineas: body.lineas });
  return mapper.buildTimeEntryDetail(entry, []);
}

export async function adjust(id: string, body: AdjustTimeEntryInput, userId: string, email: string | null) {
  const entry = await repo.findById(id);
  if (!entry) throw new AppError('Registro no encontrado', 404);
  if (entry.user_id !== userId) throw new AppError('Solo el dueño del registro puede editarlo', 403);
  if (entry.status !== 'PENDIENTE') throw new AppError('Solo se pueden editar registros en estado PENDIENTE', 403);

  const updated = await repo.updateLines(id, body.lineas, email);
  return mapper.buildTimeEntryDetail(updated, []);
}

export async function approve(id: string, userId: string, email: string | null, roles: string[]) {
  const entry = await repo.findById(id);
  if (!entry) throw new AppError('Registro no encontrado', 404);
  if (entry.status !== 'PENDIENTE') throw new AppError('Solo se pueden aprobar registros en estado PENDIENTE', 403);

  if (!roles.includes('ADMIN')) {
    const projectId = await repo.findFirstLineProjectId(id);
    if (!projectId) throw new AppError('Registro no encontrado', 404);
    const isManager = await repo.isProjectManager(userId, projectId);
    if (!isManager) throw new AppError('Solo el gestor del proyecto o un administrador puede aprobar', 403);
  }

  await repo.recordApproval({ entryId: id, action: 'APROBAR', email, data: {} });
  return { id, estado: 'APROBADO', aprobado_en: new Date().toISOString() };
}

export async function observe(
  id: string,
  body: ApproveWithObservationInput,
  userId: string,
  email: string | null,
  roles: string[],
) {
  const entry = await repo.findById(id);
  if (!entry) throw new AppError('Registro no encontrado', 404);
  if (entry.status !== 'PENDIENTE') throw new AppError('Solo se pueden aprobar registros en estado PENDIENTE', 403);

  if (!roles.includes('ADMIN')) {
    const projectId = await repo.findFirstLineProjectId(id);
    const isManager = projectId ? await repo.isProjectManager(userId, projectId) : false;
    if (!isManager) throw new AppError('Solo el gestor del proyecto o un administrador puede aprobar', 403);
  }

  await repo.recordApproval({ entryId: id, action: 'APROBAR_CON_OBSERVACION', email, data: body });
  return {
    id,
    estado: 'APROBADO_CON_OBSERVACION',
    aprobado_en: new Date().toISOString(),
    comentario_observacion: body.comentario_observacion,
  };
}

export async function reject(
  id: string,
  body: RejectInput,
  userId: string,
  email: string | null,
  roles: string[],
) {
  const entry = await repo.findById(id);
  if (!entry) throw new AppError('Registro no encontrado', 404);
  if (entry.status !== 'PENDIENTE') throw new AppError('Solo se pueden rechazar registros en estado PENDIENTE', 403);

  if (!roles.includes('ADMIN')) {
    const projectId = await repo.findFirstLineProjectId(id);
    const isManager = projectId ? await repo.isProjectManager(userId, projectId) : false;
    if (!isManager) throw new AppError('Solo el gestor del proyecto o un administrador puede rechazar', 403);
  }

  await repo.recordApproval({ entryId: id, action: 'RECHAZAR', email, data: body });
  return { id, estado: 'RECHAZADO', rechazado_en: new Date().toISOString(), ...body };
}

export async function getMissingWeeks(userId: string) {
  const [hireDate, loadedWeeks] = await Promise.all([
    repo.getUserHireDate(userId),
    repo.findLoadedWeeks(userId),
  ]);

  if (!hireDate) return { semanas: [], total: 0 };

  const loaded = new Set(loadedWeeks);
  const domingoUltimaSemanaCompleta = domingoDeSemanaDe(new Date());
  domingoUltimaSemanaCompleta.setDate(domingoUltimaSemanaCompleta.getDate() - 7);

  const cursor = domingoDeSemanaDe(new Date(hireDate));
  const missing: string[] = [];

  while (cursor <= domingoUltimaSemanaCompleta) {
    const code = calcularCodigoSemana(cursor);
    if (!loaded.has(code)) missing.push(code);
    cursor.setDate(cursor.getDate() + 7);
  }

  return { semanas: missing, total: missing.length };
}

export async function getSeekersWithMissingLoad(userId: string, roles: string[]) {
  if (!roles.includes('GESTOR') && !roles.includes('ADMIN')) {
    throw new AppError('Solo el gestor puede ver esta información', 403);
  }

  const seekers = await repo.findSeekersWithLoadData(userId);

  const hoy = new Date();
  const domingoUltimaSemanaCompleta = domingoDeSemanaDe(hoy);
  domingoUltimaSemanaCompleta.setDate(domingoUltimaSemanaCompleta.getDate() - 7);
  const ultimaSemana = calcularCodigoSemana(domingoUltimaSemanaCompleta);

  const resultado = [];

  for (const seeker of seekers) {
    if (!seeker.fecha_ingreso) continue;

    const entradas = Array.isArray(seeker.entradas) ? seeker.entradas : [];
    const semanasConCargaMisProyectos = new Set(
      entradas.filter((e) => e.en_mis_proyectos).map((e) => e.semana),
    );

    const cursor = domingoDeSemanaDe(new Date(seeker.fecha_ingreso));
    let cantSemanasSinCarga = 0;
    while (cursor <= domingoUltimaSemanaCompleta) {
      const codigo = calcularCodigoSemana(cursor);
      if (!semanasConCargaMisProyectos.has(codigo)) cantSemanasSinCarga++;
      cursor.setDate(cursor.getDate() + 7);
    }

    if (cantSemanasSinCarga === 0) continue;

    const entradaUltimaSemana = entradas.find((e) => e.semana === ultimaSemana);
    const severidad = entradaUltimaSemana ? 'ADVERTENCIA' : 'CRITICO';

    const conteoOtros: Record<string, number> = {};
    for (const entrada of entradas) {
      if (Array.isArray(entrada.proyectos_otros)) {
        for (const nombre of entrada.proyectos_otros) {
          conteoOtros[nombre] = (conteoOtros[nombre] || 0) + 1;
        }
      }
    }
    const proyectosOtros = Object.entries(conteoOtros).map(([nombre, semanas]) => ({ nombre, semanas }));

    resultado.push({
      usuario: { id: seeker.user_id, nombres: seeker.nombres, apellidos: seeker.apellidos },
      semanas_sin_carga: cantSemanasSinCarga,
      ultima_semana: ultimaSemana,
      severidad,
      proyectos_pendientes: Array.isArray(seeker.mis_proyectos) ? seeker.mis_proyectos : [],
      proyectos_otros: proyectosOtros,
    });
  }

  resultado.sort((a, b) => (a.severidad === b.severidad ? 0 : a.severidad === 'CRITICO' ? -1 : 1));
  return { data: resultado, total: resultado.length };
}

export async function sendReminder(managerId: string, seekerId: string, roles: string[]) {
  if (!roles.includes('GESTOR') && !roles.includes('ADMIN')) {
    throw new AppError('Solo el gestor puede enviar recordatorios', 403);
  }

  const seeker = await repo.findSeekerOfManager(managerId, seekerId);
  if (!seeker) throw new AppError('El usuario no pertenece a tu equipo', 403);

  await sendHoursReminder(
    seeker.email,
    seeker.nombres,
    `${seeker.gestor_nombres} ${seeker.gestor_apellidos}`,
  );

  return { ok: true };
}
