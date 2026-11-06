import type { Matrix, Vector } from '../types';
import { fmtCoef } from './format';

/** Genera dinámicamente las n ecuaciones de A x = b a partir de los datos actuales. */
export function buildEquations(A: Matrix, b: Vector): string[] {
  return A.map((row, i) => {
    const terms = row.map((a, j) => {
      const sign = a < 0 ? '−' : '+';
      const mag = fmtCoef(Math.abs(a));
      return { sign, text: `${mag}·x${j + 1}` };
    });
    const lhs = terms
      .map((t, k) => (k === 0 ? `${t.sign === '−' ? '−' : ''}${t.text}` : ` ${t.sign} ${t.text}`))
      .join('');
    return `${lhs} = ${fmtCoef(b[i])}`;
  });
}
