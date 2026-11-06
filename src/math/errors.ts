import type { ErrorAnalysis, ErrorRow, Matrix, Vector } from '../types';
import { norm2, residual } from './vector';

export const VARIABLE_NAMES = ['x1', 'x2', 'x3', 'x4'];

/**
 * Errores por componente respecto de la solución numérica de referencia.
 *   Ea_i = |xref_i − x_i|,  Er_i = Ea_i/|xref_i|,  Ep_i = Er_i · 100 %
 * Si xref_i = 0 (o es numéricamente nulo frente al resto del vector) Er_i y Ep_i no están definidos (null).
 */
export function errorAnalysis(A: Matrix, b: Vector, xRef: Vector, xApprox: Vector): ErrorAnalysis {
  const refScale = Math.max(...xRef.map((v) => Math.abs(v)), 0);
  const rows: ErrorRow[] = xRef.map((ref, i) => {
    const absolute = Math.abs(ref - xApprox[i]);
    const undefinedRel = ref === 0 || Math.abs(ref) <= 1e-14 * refScale;
    const relative = undefinedRel ? null : absolute / Math.abs(ref);
    return {
      variable: VARIABLE_NAMES[i] ?? `x${i + 1}`,
      reference: ref,
      approx: xApprox[i],
      absolute,
      relative,
      percent: relative === null ? null : relative * 100,
    };
  });
  const bNorm = norm2(b);
  const globalRelativeResidual = bNorm > 0 ? norm2(residual(A, b, xApprox)) / bNorm : null;
  const percents = rows.map((r) => r.percent).filter((p): p is number => p !== null);
  return {
    rows,
    globalRelativeResidual,
    maxAbsolute: Math.max(...rows.map((r) => r.absolute)),
    maxPercent: percents.length ? Math.max(...percents) : null,
  };
}
