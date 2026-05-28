import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../shared/http/errorHandler';
import { logger } from '../../shared/logging/logger';
import * as repo from './timeEntries.repository';
import * as mapper from './timeEntries.mapper';
import type {
  CreateTimeEntryInput,
  ApproveWithObservationInput,
  RejectInput,
  ApproveInput,
} from './timeEntries.schema';

import { sendHoursReminder } from '../../shared/services/email.service';

// Lunes (00:00 UTC) de la semana que contiene `fecha`. Semana = Lun–Dom.
function lunesDeSemanaDe(fecha: Date): Date {
  const d = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
  const dow = d.getUTCDay(); // 0=Dom..6=Sáb
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

function sumarDias(fecha: Date, dias: number): Date {
  const r = new Date(fecha);
  r.setUTCDate(r.getUTCDate() + dias);
  return r;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
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
      semana_inicio: filters['semana_inicio'],
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

  const weekStart = new Date(`${body.semana_inicio}T00:00:00Z`);
  const weekEnd = new Date(`${body.semana_fin}T00:00:00Z`);
  const rangoLabel = `${body.semana_inicio} al ${body.semana_fin}`;

  for (const linea of body.lineas) {
    const assigned = await repo.isUserAssignedToProject(userId, linea.proyecto_id);
    if (!assigned) throw new ForbiddenError('No tenés acceso al proyecto indicado');

    // Check per-project uniqueness: block if active non-rejected line already exists
    const existing = await repo.findExistingLineForProject(userId, weekStart, linea.proyecto_id, linea.categoria_ingreso_id ?? null);
    if (existing) {
      throw new ValidationError(
        `Ya existe una carga activa (${existing.status}) para la semana ${rangoLabel} en ese proyecto`,
      );
    }
  }

  const entry = await repo.create({ userId, email, weekStart, weekEnd, lineas: body.lineas });
  logger.info(
    { actor: email, usuario_id: userId, time_entry_id: entry.id, semana_inicio: body.semana_inicio, lineas: body.lineas.length },
    'time entry created',
  );
  return mapper.buildTimeEntryDetail(entry, [], userId, []);
}

export async function approve(id: string, body: ApproveInput, userId: string, email: string | null, roles: string[]) {
  const entry = await repo.findById(id);
  if (!entry) throw new NotFoundError('Registro no encontrado');

  if (!roles.includes('ADMIN')) {
    const isManager = await repo.isProjectManager(userId, body.proyecto_id);
    if (!isManager) throw new ForbiddenError('Solo el gestor del proyecto o un administrador puede aprobar');
  }

  const lines = await repo.getLinesForProject(id, body.linea_id);
  if (lines.length === 0) throw new NotFoundError('No se encontró la línea indicada en este registro');
  if (lines.every((l) => l.status !== 'PENDIENTE')) {
    throw new ForbiddenError('La línea indicada no está pendiente de aprobación');
  }

  await repo.recordApproval({ lineaId: body.linea_id, action: 'APROBAR', email, data: {} });
  logger.info(
    { actor: email, time_entry_id: id, linea_id: body.linea_id, estado: 'APROBADO' },
    'time entry line approved',
  );
  return { id, proyecto_id: body.proyecto_id, linea_id: body.linea_id, estado: 'APROBADO', aprobado_en: new Date().toISOString() };
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

  const lines = await repo.getLinesForProject(id, body.linea_id);
  if (lines.length === 0) throw new NotFoundError('No se encontró la línea indicada en este registro');
  if (lines.every((l) => l.status !== 'PENDIENTE')) {
    throw new ForbiddenError('La línea indicada no está pendiente de aprobación');
  }

  await repo.recordApproval({ lineaId: body.linea_id, action: 'APROBAR_CON_OBSERVACION', email, data: body });
  logger.info(
    { actor: email, time_entry_id: id, linea_id: body.linea_id, estado: 'APROBADO_CON_OBSERVACION' },
    'time entry line observed',
  );
  return {
    id,
    proyecto_id: body.proyecto_id,
    linea_id: body.linea_id,
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

  const lines = await repo.getLinesForProject(id, body.linea_id);
  if (lines.length === 0) throw new NotFoundError('No se encontró la línea indicada en este registro');
  if (lines.every((l) => l.status !== 'PENDIENTE')) {
    throw new ForbiddenError('La línea indicada no está pendiente de rechazo');
  }

  await repo.recordApproval({ lineaId: body.linea_id, action: 'RECHAZAR', email, data: body });
  logger.info(
    { actor: email, time_entry_id: id, linea_id: body.linea_id, estado: 'RECHAZADO' },
    'time entry line rejected',
  );
  return {
    id,
    proyecto_id: body.proyecto_id,
    linea_id: body.linea_id,
    estado: 'RECHAZADO',
    rechazado_en: new Date().toISOString(),
    razon_rechazo: body.razon_rechazo,
  };
}

export async function getMissingWeeks(userId: string) {
  const [hireDate, loadedWeeks] = await Promise.all([
    repo.getUserHireDate(userId),
    repo.findLoadedWeeks(userId),
  ]);

  if (!hireDate) return { semanas: [], total: 0 };

  const loaded = new Set(loadedWeeks);
  const lunesUltimaSemanaCompleta = sumarDias(lunesDeSemanaDe(new Date()), -7);

  const cursor = lunesDeSemanaDe(new Date(hireDate));
  const missing: { semana_inicio: string; semana_fin: string }[] = [];

  while (cursor <= lunesUltimaSemanaCompleta) {
    const inicio = toISODate(cursor);
    if (!loaded.has(inicio)) {
      missing.push({ semana_inicio: inicio, semana_fin: toISODate(sumarDias(cursor, 6)) });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  return { semanas: missing, total: missing.length };
}

export async function getSeekersWithMissingLoad(userId: string, roles: string[]) {
  if (!roles.includes('GESTOR') && !roles.includes('ADMIN')) {
    throw new ForbiddenError('Solo el gestor puede ver esta información');
  }

  const seekers = await repo.findSeekersWithLoadData(userId);

  const lunesUltimaSemanaCompleta = sumarDias(lunesDeSemanaDe(new Date()), -7);
  const ultimaSemanaInicio = toISODate(lunesUltimaSemanaCompleta);

  const resultado = [];

  for (const seeker of seekers) {
    if (!seeker.fecha_ingreso) continue;

    const entradas = Array.isArray(seeker.entradas) ? seeker.entradas : [];
    const semanasConCargaMisProyectos = new Set(
      entradas.filter((e) => e.en_mis_proyectos).map((e) => e.semana_inicio),
    );

    const cursor = lunesDeSemanaDe(new Date(seeker.fecha_ingreso));
    let cantSemanasSinCarga = 0;
    while (cursor <= lunesUltimaSemanaCompleta) {
      const inicio = toISODate(cursor);
      if (!semanasConCargaMisProyectos.has(inicio)) cantSemanasSinCarga++;
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    }

    if (cantSemanasSinCarga === 0) continue;

    const entradaUltimaSemana = entradas.find((e) => e.semana_inicio === ultimaSemanaInicio);
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
      ultima_semana_inicio: ultimaSemanaInicio,
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
