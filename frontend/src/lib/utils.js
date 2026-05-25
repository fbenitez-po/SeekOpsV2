import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Parsea 'YYYY-MM-DD' como fecha a medianoche local (evita el corrimiento de día por UTC).
export function parsearFechaISO(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

// 'YYYY-MM-DD' a partir de una fecha (en términos locales).
export function aISODateLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Dado el inicio de semana (lunes, ISO) retorna el domingo (Date) para los helpers de display.
export function inicioADomingo(inicioISO) {
  const lunes = parsearFechaISO(inicioISO);
  if (!lunes) return null;
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return domingo;
}

// Etiqueta de display de una semana a partir de su inicio (lunes, ISO): "Lun 18 al Dom 24 may 2026".
export function rangoSemana(inicioISO) {
  const domingo = inicioADomingo(inicioISO);
  return domingo ? formatearRangoDeSemana(domingo) : (inicioISO ?? '');
}

// Retorna el domingo de la semana actual (Lun-Dom).
export function obtenerDomingoBase() {
  const hoy = new Date();
  const dia = hoy.getDay(); // 0=Dom,1=Lun,...,6=Sáb
  const ajuste = (7 - dia) % 7;
  const domingo = new Date(hoy);
  domingo.setDate(hoy.getDate() + ajuste);
  domingo.setHours(0, 0, 0, 0);
  return domingo;
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatearRangoDeSemana(domingo) {
  const lunes = new Date(domingo);
  lunes.setDate(domingo.getDate() - 6);
  const dL = lunes.getDate();
  const mL = MESES_CORTOS[lunes.getMonth()];
  const dD = domingo.getDate();
  const mD = MESES_CORTOS[domingo.getMonth()];
  const anio = domingo.getFullYear();
  if (lunes.getMonth() === domingo.getMonth()) {
    return `Lun ${dL} al Dom ${dD} ${mD} ${anio}`;
  }
  return `Lun ${dL} ${mL} al Dom ${dD} ${mD} ${anio}`;
}

export function formatearDiaMes(fecha) {
  return `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]}`;
}

function calcularPascua(anio) {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anio, mes - 1, dia);
}

export function obtenerFeriadosPeru(anio) {
  const pascua = calcularPascua(anio);
  const sumar = (f, d) => { const r = new Date(f); r.setDate(r.getDate() + d); return r; };
  return [
    { fecha: new Date(anio, 0, 1),        nombre: 'Año Nuevo' },
    { fecha: sumar(pascua, -3),           nombre: 'Jueves Santo' },
    { fecha: sumar(pascua, -2),           nombre: 'Viernes Santo' },
    { fecha: new Date(anio, 4, 1),        nombre: 'Día del Trabajo' },
    { fecha: new Date(anio, 5, 29),       nombre: 'San Pedro y San Pablo' },
    { fecha: new Date(anio, 6, 28),       nombre: 'Fiestas Patrias' },
    { fecha: new Date(anio, 6, 29),       nombre: 'Fiestas Patrias' },
    { fecha: new Date(anio, 7, 30),       nombre: 'Santa Rosa de Lima' },
    { fecha: new Date(anio, 9, 8),        nombre: 'Combate de Angamos' },
    { fecha: new Date(anio, 10, 1),       nombre: 'Todos los Santos' },
    { fecha: new Date(anio, 11, 8),       nombre: 'Inmaculada Concepción' },
    { fecha: new Date(anio, 11, 25),      nombre: 'Navidad' },
  ];
}

export function obtenerFeriadosSemana(domingo) {
  const lunes = new Date(domingo);
  lunes.setDate(domingo.getDate() - 6);
  lunes.setHours(0, 0, 0, 0);
  const viernes = new Date(domingo);
  viernes.setDate(domingo.getDate() - 2);
  viernes.setHours(0, 0, 0, 0);

  const anios = lunes.getFullYear() !== domingo.getFullYear()
    ? [...obtenerFeriadosPeru(lunes.getFullYear()), ...obtenerFeriadosPeru(domingo.getFullYear())]
    : obtenerFeriadosPeru(domingo.getFullYear());

  return anios.filter(({ fecha }) => {
    const f = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    return f >= lunes && f <= viernes;
  });
}

export function formatearFecha(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatearFechaHora(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ESTADO_LABELS = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  APROBADO_CON_OBSERVACION: 'Aprobado con observación',
  RECHAZADO: 'Rechazado',
};

export const ESTADO_COLORS = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  APROBADO: 'bg-green-100 text-green-800',
  APROBADO_CON_OBSERVACION: 'bg-teal-100 text-teal-800',
  RECHAZADO: 'bg-red-100 text-red-800',
};
