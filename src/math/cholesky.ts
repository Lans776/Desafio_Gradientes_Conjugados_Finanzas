import type { Matrix, Vector } from '../types';

export interface CholeskyResult {
  ok: boolean;
  /** Factor triangular inferior L (A = L Lᵀ). Vacío si falló. */
  L: Matrix;
  /** Índice (0-based) del pivote no positivo si falló. */
  failedAt: number | null;
}

/**
 * Factorización de Cholesky A = L Lᵀ (algoritmo de Cholesky–Banachiewicz).
 * Falla (ok = false) si aparece un pivote ≤ 0, lo que indica que A no es definida positiva.
 */
export function cholesky(A: Matrix): CholeskyResult {
  const n = A.length;
  const L: Matrix = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) {
        if (!(s > 0) || !Number.isFinite(s)) {
          return { ok: false, L: [], failedAt: i };
        }
        L[i][i] = Math.sqrt(s);
      } else {
        L[i][j] = s / L[j][j];
      }
    }
  }
  return { ok: true, L, failedAt: null };
}

/** Resuelve L y = b (sustitución hacia adelante). */
export function forwardSubstitution(L: Matrix, b: Vector): Vector {
  const n = L.length;
  const y = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let j = 0; j < i; j++) s -= L[i][j] * y[j];
    y[i] = s / L[i][i];
  }
  return y;
}

/** Resuelve Lᵀ x = y (sustitución hacia atrás). */
export function backwardSubstitutionT(L: Matrix, y: Vector): Vector {
  const n = L.length;
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i];
    for (let j = i + 1; j < n; j++) s -= L[j][i] * x[j];
    x[i] = s / L[i][i];
  }
  return x;
}

/** Resuelve A x = b usando una factorización de Cholesky ya calculada. */
export function choleskySolve(L: Matrix, b: Vector): Vector {
  return backwardSubstitutionT(L, forwardSubstitution(L, b));
}
