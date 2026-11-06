import type { Matrix, PreconditionerInfo, PreconditionerKind, Vector } from '../types';
import { diagonal } from './matrix';

export interface Preconditioner {
  kind: PreconditionerKind;
  info: PreconditionerInfo;
  /** Resuelve M z = r sin invertir M explícitamente. */
  apply: (r: Vector) => Vector;
  /** Matriz M explícita (SPD), usada únicamente para analizar el espectro de M⁻¹A. */
  matrix: Matrix;
}

export type PreconditionerBuild =
  | { ok: true; preconditioner: Preconditioner }
  | { ok: false; message: string };

export const PRECONDITIONER_LABELS: Record<PreconditionerKind, string> = {
  none: 'Sin precondicionamiento (M = I)',
  jacobi: 'Jacobi (M = diag(A))',
  ssor: 'SSOR (Gauss–Seidel simétrico)',
};

const DIAG_EPS = 1e-12;

/** M = I. Resolver M z = r es copiar r. */
function buildIdentity(n: number): Preconditioner {
  return {
    kind: 'none',
    info: {
      kind: 'none',
      label: PRECONDITIONER_LABELS.none,
      description: 'M = I: el sistema Mz = r se resuelve con z = r, por lo que GCP coincide con GC.',
    },
    apply: (r) => r.slice(),
    matrix: Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))),
  };
}

/**
 * Jacobi: M = diag(A). Como M es diagonal, Mz = r se resuelve por división
 * componente a componente: z_i = r_i / a_ii (coste O(n), sin invertir matrices).
 */
function buildJacobi(A: Matrix): PreconditionerBuild {
  const d = diagonal(A);
  const scaleRef = Math.max(...d.map((v) => Math.abs(v)), 1);
  for (let i = 0; i < d.length; i++) {
    if (!Number.isFinite(d[i]) || Math.abs(d[i]) <= DIAG_EPS * scaleRef) {
      return {
        ok: false,
        message: `El precondicionador de Jacobi no puede construirse: el elemento diagonal a${i + 1}${i + 1} es cero o casi cero.`,
      };
    }
    if (d[i] < 0) {
      return {
        ok: false,
        message: `El precondicionador de Jacobi requiere diagonal positiva; a${i + 1}${i + 1} = ${d[i]} es negativo.`,
      };
    }
  }
  const n = d.length;
  return {
    ok: true,
    preconditioner: {
      kind: 'jacobi',
      info: {
        kind: 'jacobi',
        label: PRECONDITIONER_LABELS.jacobi,
        description:
          'M = diag(A). Corrige el mal escalamiento diagonal: Mz = r se resuelve con z_i = r_i / a_ii. Equivale a aplicar GC al sistema escalado D^(-1/2) A D^(-1/2).',
      },
      apply: (r) => r.map((v, i) => v / d[i]),
      matrix: Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? d[i] : 0))),
    },
  };
}

/**
 * SSOR con parámetro ω ∈ (0,2): con A = L + D + Lᵀ,
 *   M = (1 / (ω(2−ω))) (D + ωL) D⁻¹ (D + ωL)ᵀ
 * M es SPD si A es SPD. Mz = r se resuelve con dos sustituciones triangulares y un escalado diagonal.
 */
function buildSSOR(A: Matrix, omega: number): PreconditionerBuild {
  if (!Number.isFinite(omega) || omega <= 0 || omega >= 2) {
    return { ok: false, message: 'El parámetro ω de SSOR debe cumplir 0 < ω < 2.' };
  }
  const n = A.length;
  const d = diagonal(A);
  const scaleRef = Math.max(...d.map((v) => Math.abs(v)), 1);
  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(d[i]) || d[i] <= DIAG_EPS * scaleRef) {
      return {
        ok: false,
        message: `SSOR requiere diagonal estrictamente positiva; a${i + 1}${i + 1} = ${d[i]}.`,
      };
    }
  }
  const c = 1 / (omega * (2 - omega));
  // T = D + ωL (triangular inferior)
  const T: Matrix = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? d[i] : j < i ? omega * A[i][j] : 0)),
  );
  // M explícita = c · T D⁻¹ Tᵀ  (solo para análisis espectral)
  const M: Matrix = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += (T[i][k] / d[k]) * T[j][k];
      M[i][j] = c * s;
    }
  }
  const apply = (r: Vector): Vector => {
    // (D + ωL) y = ω(2−ω) r
    const y = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) {
      let s = omega * (2 - omega) * r[i];
      for (let j = 0; j < i; j++) s -= T[i][j] * y[j];
      y[i] = s / T[i][i];
    }
    // u = D y ; (D + ωL)ᵀ z = u
    const u = y.map((v, i) => v * d[i]);
    const z = new Array<number>(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let s = u[i];
      for (let j = i + 1; j < n; j++) s -= T[j][i] * z[j];
      z[i] = s / T[i][i];
    }
    return z;
  };
  return {
    ok: true,
    preconditioner: {
      kind: 'ssor',
      info: {
        kind: 'ssor',
        label: `${PRECONDITIONER_LABELS.ssor}, ω = ${omega}`,
        description:
          'M = (D+ωL) D⁻¹ (D+ωL)ᵀ / (ω(2−ω)). Aprovecha también el acoplamiento fuera de la diagonal; Mz = r se resuelve con dos sustituciones triangulares.',
      },
      apply,
      matrix: M,
    },
  };
}

export function buildPreconditioner(A: Matrix, kind: PreconditionerKind, omega = 1): PreconditionerBuild {
  switch (kind) {
    case 'none':
      return { ok: true, preconditioner: buildIdentity(A.length) };
    case 'jacobi':
      return buildJacobi(A);
    case 'ssor':
      return buildSSOR(A, omega);
    default:
      return { ok: false, message: 'Precondicionador desconocido.' };
  }
}
