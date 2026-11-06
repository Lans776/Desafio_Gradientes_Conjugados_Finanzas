import type { Matrix } from '../types';
import { cloneMatrix } from './matrix';

/**
 * Autovalores de una matriz simétrica mediante el método de Jacobi cíclico
 * (rotaciones de Givens). Devuelve los autovalores en orden ascendente.
 * Es independiente de librerías externas y muy preciso para n pequeño.
 */
export function symmetricEigenvalues(S: Matrix, maxSweeps = 100): number[] {
  const n = S.length;
  const A = cloneMatrix(S);
  // Se simetriza para eliminar ruido de redondeo.
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const m = 0.5 * (A[i][j] + A[j][i]);
      A[i][j] = m;
      A[j][i] = m;
    }
  }
  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let off = 0;
    let diag = 0;
    for (let i = 0; i < n; i++) {
      diag += A[i][i] * A[i][i];
      for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
    }
    if (off <= 1e-30 * Math.max(diag, Number.MIN_VALUE)) break;
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = A[p][q];
        if (apq === 0) continue;
        const theta = (A[q][q] - A[p][p]) / (2 * apq);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = A[k][p];
          const akq = A[k][q];
          A[k][p] = c * akp - s * akq;
          A[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p][k];
          const aqk = A[q][k];
          A[p][k] = c * apk - s * aqk;
          A[q][k] = s * apk + c * aqk;
        }
      }
    }
  }
  const ev: number[] = [];
  for (let i = 0; i < n; i++) ev.push(A[i][i]);
  return ev.sort((a, b) => a - b);
}

/** Menores principales líderes det(A[0..k,0..k]) por eliminación sin pivoteo (criterio de Sylvester). */
export function leadingPrincipalMinors(A: Matrix): number[] {
  const n = A.length;
  const minors: number[] = [];
  for (let k = 1; k <= n; k++) {
    const M = A.slice(0, k).map((row) => row.slice(0, k));
    minors.push(determinant(M));
  }
  return minors;
}

export function determinant(M: Matrix): number {
  const n = M.length;
  const A = cloneMatrix(M);
  let det = 1;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (A[p][c] === 0) return 0;
    if (p !== c) {
      [A[p], A[c]] = [A[c], A[p]];
      det = -det;
    }
    det *= A[c][c];
    for (let r = c + 1; r < n; r++) {
      const f = A[r][c] / A[c][c];
      for (let k = c; k < n; k++) A[r][k] -= f * A[c][k];
    }
  }
  return det;
}
