import type { Matrix } from '../types';

export function cloneMatrix(A: Matrix): Matrix {
  return A.map((row) => row.slice());
}

export function identity(n: number): Matrix {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
}

export function transpose(A: Matrix): Matrix {
  const m = A.length;
  const n = m > 0 ? A[0].length : 0;
  return Array.from({ length: n }, (_, j) => Array.from({ length: m }, (_, i) => A[i][j]));
}

export function matMul(A: Matrix, B: Matrix): Matrix {
  const m = A.length;
  const k = B.length;
  const n = k > 0 ? B[0].length : 0;
  const C: Matrix = Array.from({ length: m }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let p = 0; p < k; p++) {
      const a = A[i][p];
      for (let j = 0; j < n; j++) C[i][j] += a * B[p][j];
    }
  }
  return C;
}

/** Máxima asimetría max |a_ij − a_ji|. */
export function maxAsymmetry(A: Matrix): number {
  let m = 0;
  for (let i = 0; i < A.length; i++) {
    for (let j = i + 1; j < A.length; j++) {
      m = Math.max(m, Math.abs(A[i][j] - A[j][i]));
    }
  }
  return m;
}

/** Máximo valor absoluto de las entradas. */
export function maxAbsEntry(A: Matrix): number {
  let m = 0;
  for (const row of A) for (const v of row) m = Math.max(m, Math.abs(v));
  return m;
}

/**
 * Simetría con tolerancia numérica relativa:
 * |a_ij − a_ji| ≤ tol · max(1, max|a|).
 */
export function isSymmetric(A: Matrix, tol = 1e-10): boolean {
  if (!isSquare(A)) return false;
  return maxAsymmetry(A) <= tol * Math.max(1, maxAbsEntry(A));
}

export function isSquare(A: Matrix): boolean {
  return A.length > 0 && A.every((row) => row.length === A.length);
}

export function allFinite(values: number[] | number[][]): boolean {
  for (const v of values) {
    if (Array.isArray(v)) {
      for (const w of v) if (!Number.isFinite(w)) return false;
    } else if (!Number.isFinite(v)) return false;
  }
  return true;
}

export function diagonal(A: Matrix): number[] {
  return A.map((row, i) => row[i]);
}
