/** Funciones de formato: se redondea SOLO para visualización. */

export function fmtNumber(v: number | null | undefined, decimals = 6): string {
  if (v === null || v === undefined) return '—';
  if (Number.isNaN(v)) return 'NaN';
  if (!Number.isFinite(v)) return v > 0 ? '∞' : '−∞';
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a < 1e-4 || a >= 1e9) return fmtSci(v, 4);
  return v.toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

/** Valores con posible decimal fijo (para vectores solución). */
export function fmtFixed(v: number | null | undefined, decimals = 6): string {
  if (v === null || v === undefined) return '—';
  if (!Number.isFinite(v)) return fmtNumber(v);
  const a = Math.abs(v);
  if (a !== 0 && a < 1e-4) return fmtSci(v, 4);
  return v.toFixed(decimals).replace('.', ',');
}

export function fmtSci(v: number | null | undefined, digits = 3): string {
  if (v === null || v === undefined) return '—';
  if (!Number.isFinite(v)) return fmtNumber(v);
  if (v === 0) return '0';
  return v.toExponential(digits).replace('e+', 'e+').replace('.', ',');
}

/** Errores: científica si son pequeños. */
export function fmtError(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'No definido';
  if (!Number.isFinite(v)) return fmtNumber(v);
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a < 1e-3 || a >= 1e6) return fmtSci(v, 3);
  return v.toFixed(6).replace('.', ',');
}

export function fmtPercent(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'No definido';
  if (!Number.isFinite(v)) return fmtNumber(v);
  if (v === 0) return '0 %';
  return `${fmtError(v)} %`;
}

/** Número de condición: entero para valores grandes, decimales para valores pequeños. */
export function fmtKappa(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  if (!Number.isFinite(v)) return fmtNumber(v);
  if (v < 100) return v.toFixed(3).replace('.', ',');
  if (v < 1e6) return v.toLocaleString('es-BO', { maximumFractionDigits: 1 });
  return fmtSci(v, 3);
}

export function fmtVector(x: number[] | null | undefined, decimals = 4): string {
  if (!x) return '—';
  return `[${x.map((v) => fmtFixed(v, decimals)).join('; ')}]`;
}

export function yesNo(b: boolean): string {
  return b ? 'Sí' : 'No';
}

/** Coeficiente de la ecuación: "+ 2,5 x2". */
export function fmtCoef(v: number): string {
  return v.toLocaleString('es-BO', { maximumFractionDigits: 6 });
}
