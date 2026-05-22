import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../shared/http/errorHandler';
import * as repo from './timeEntries.repository';
import * as mapper from './timeEntries.mapper';
import type {
  CreateTimeEntryInput,
  ApproveWithObservationInput,
  RejectInput,
  ApproveInput,
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
      return mapper.buildTimeEntryDetail(e, approvals, userId, roles);
    }),
  );

  return {
    data: entradasConDetalle,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getById(id: string, userId: string, roles: string[]) {
  const entry = await repo.findById(id);
  if (!entry) throw new NotFoundError('Registro no encontrado');

  const isOwner = entry.user_id === userId;
  const isAdmin = roles.includes('ADMIN');

  if (!isOwner && !isAdmin) {
    const isManager = entry.time_entry_lines.some(
      (l) => (l.projects as any).manager_id === userId,
    );
    if (!isManager) throw new ForbiddenError('No tenés permiso para ver este registro');
  }

  const approvals = await repo.findApprovals(id);
  return mapper.buildTimeEntryDetail(entry, approvals, userId, roles);
}

export async function create(body: CreateTimeEntryInput, userId: string, email: string | null) {
  const combos = body.lineas.map((l) => `${l.proyecto_id}:${l.categoria_ingreso_id ?? 'null'}`);
  if (new Set(combos).size !== combos.length) {
    throw new ValidationError('No se puede repetir la misma combinación de proyecto y categoría en una carga');
  }

  for (const linea of body.lineas) {
    const assigned = await repo.isUserAssignedToProject(userId, linea.proyecto_id);
    if (!assigned) throw new ForbiddenError('No tenés acceso al proyecto indicado');

    // Check per-project uniqueness: block if active non-rejected line already exists
    const existing = await repo.findExistingLineForProject(userId, body.semana, linea.proyecto_id, linea.categoria_ingreso_id ?? null);
    if (existing) {
      throw new ValidationError(
        `Ya existe una carga activa (${existing.status}) para la semana ${body.semana} en ese proyecto`,
      );
    }
  }

  const entry = await repo.create({ userId, email, week: body.semana, lineas: body.lineas });
  return mapper.buildTimeEntryDetail(entry, [], userId, []);
}

export async function approve(id: string, body: ApproveInput, userId: string, email: string | null, roles: string[]) {
  const entry = await repo.findById(id);
  if (!entry) throw new NotFoundError('Registro no encontrado');

  if (!roles.includes('ADMIN')) {
    const isManager = await repo.isProjectManager(userId, body.proyecto_id);
    if (!isManager) throw new ForbiddenError('Solo el gestor del proyecto o un administrador puede aprobar');
  }

  const categoryId = body.categoria_ingreso_id ?? undefined;
  const lines = await repo.getLinesForProject(id, body.proyecto_id, categoryId);
  if (lines.length === 0) throw new NotFoundError('No se encontraron líneas para el proyecto indicado en este registro');
  if (lines.every((l) => l.status !== 'PENDIENTE')) {
    throw new ForbiddenError('No hay líneas pendientes para aprobar en este proyecto');
  }

  await repo.recordApproval({ entryId: id, projectId: body.proyecto_id, categoryId, action: 'APROBAR', email, data: {} });
  return { id, proyecto_id: body.proyecto_id, estado: 'APROBADO', aprobado_en: new Date().toISOString() };
}

export async function observe(
  id: string,
  body: ApproveWithObservationInput,
  userId: string,
  email: string | null,
  roles: string[],
) {
  const entry = await repo.findById(id);
  if (!entry) throw new NotFoundError('Registro no encontrado');

  if (!roles.includes('ADMIN')) {
    const isManager = await repo.isProjectManager(userId, body.proyecto_id);
    if (!isManager) throw new ForbiddenError('Solo el gestor del proyecto o un administrador puede aprobar');
  }

  const categoryId = body.categoria_ingreso_id ?? undefined;
  const lines = await repo.getLinesForProject(id, body.proyecto_id, categoryId);
  if (lines.length === 0) throw new NotFoundError('No se encontraron líneas para el proyecto indicado en este registro');
  if (lines.every((l) => l.status !== 'PENDIENTE')) {
    throw new ForbiddenError('No hay líneas pendientes para aprobar en este proyecto');
  }

  await repo.recordApproval({ entryId: id, projectId: body.proyecto_id, categoryId, action: 'APROBAR_CON_OBSERVACION', email, data: body });
  return {
    id,
    proyecto_id: body.proyecto_id,
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
  if (!entry) throw new NotFoundError('Registro no encontrado');

  if (!roles.includes('ADMIN')) {
    const isManager = await repo.isProjectManager(userId, body.proyecto_id);
    if (!isManager) throw new ForbiddenError('Solo el gestor del proyecto o un administrador puede rechazar');
  }

  const categoryId = body.categoria_ingreso_id ?? undefined;
  const lines = await repo.getLinesForProject(id, body.proyecto_id, categoryId);
  if (lines.length === 0) throw new NotFoundError('No se encontraron líneas para el proyecto indicado en este registro');
  if (lines.every((l) => l.status !== 'PENDIENTE')) {
    throw new ForbiddenError('No hay líneas pendientes para rechazar en este proyecto');
  }

  await repo.recordApproval({ entryId: id, projectId: body.proyecto_id, categoryId, action: 'RECHAZAR', email, data: body });
  return {
    id,
    proyecto_id: body.proyecto_id,
    estado: 'RECHAZADO',
    rechazado_en: new Date().toISOString(),
    razon_rechazo: body.razon_rechazo,
    permitir_reenvio: body.permitir_reenvio ?? false,
  };
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
    throw new ForbiddenError('Solo el gestor puede ver esta información');
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
    throw new ForbiddenError('Solo el gestor puede enviar recordatorios');
  }

  const seeker = await repo.findSeekerOfManager(managerId, seekerId);
  if (!seeker) throw new ForbiddenError('El usuario no pertenece a tu equipo');

  await sendHoursReminder(
    seeker.email,
    seeker.nombres,
    `${seeker.gestor_nombres} ${seeker.gestor_apellidos}`,
  );

  return { ok: true };
}
