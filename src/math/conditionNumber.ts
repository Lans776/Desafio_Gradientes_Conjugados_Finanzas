import type { ConditionInfo, Matrix } from '../types';
import { cholesky, forwardSubstitution } from './cholesky';
import { symmetricEigenvalues } from './eigen';
import { transpose } from './matrix';

/** κ₂(A) = λmax / λmin para A simétrica definida positiva. */
export function kappaFromEigenvalues(ev: number[]): number | null {
  if (ev.length === 0) return null;
  const lmin = Math.min(...ev);
  const lmax = Math.max(...ev);
  if (!(lmin > 0) || !Number.isFinite(lmax)) return null;
  return lmax / lmin;
}

/**
 * Autovalores de M⁻¹A. Con M = L_M L_Mᵀ (Cholesky), M⁻¹A es semejante a la matriz
 * simétrica B = L_M⁻¹ A L_M⁻ᵀ, que tiene los mismos autovalores y es SPD.
 */
export function preconditionedEigenvalues(A: Matrix, M: Matrix): number[] | null {
  const chol = cholesky(M);
  if (!chol.ok) return null;
  const n = A.length;
  // Y = L⁻¹ A (resolviendo columna a columna)
  const cols: number[][] = [];
  for (let j = 0; j < n; j++) {
    const col = A.map((row) => row[j]);
    cols.push(forwardSubstitution(chol.L, col));
  }
  const Y = transpose(cols); // Y[i][j]
  // B = L⁻¹ Yᵀ
  const Yt = transpose(Y);
  const Bcols: number[][] = [];
  for (let j = 0; j < n; j++) {
    const col = Yt.map((row) => row[j]);
    Bcols.push(forwardSubstitution(chol.L, col));
  }
  const B = transpose(Bcols);
  return symmetricEigenvalues(B);
}

export function analyzeCondition(A: Matrix, M: Matrix | null, precondLabel: string): ConditionInfo {
  const ev = symmetricEigenvalues(A);
  const kappaA = kappaFromEigenvalues(ev);
  let kappaPrecond: number | null = null;
  let pev: number[] = [];
  let note = `κ₂(A) = λmax/λmin calculado con los autovalores de A (matriz simétrica definida positiva).`;
  if (M) {
    const e = preconditionedEigenvalues(A, M);
    if (e) {
      pev = e;
      kappaPrecond = kappaFromEigenvalues(e);
      note += ` κ₂(M⁻¹A) se calcula con los autovalores de L_M⁻¹ A L_M⁻ᵀ (semejante a M⁻¹A), con ${precondLabel}.`;
    } else {
      note += ' No se pudo calcular κ(M⁻¹A): M no es definida positiva.';
    }
  }
  return {
    kappaA,
    lambdaMin: ev.length ? Math.min(...ev) : null,
    lambdaMax: ev.length ? Math.max(...ev) : null,
    kappaPrecond,
    precondLambdaMin: pev.length ? Math.min(...pev) : null,
    precondLambdaMax: pev.length ? Math.max(...pev) : null,
    precondEigenvalues: pev,
    note,
  };
}

/** Interpretación cualitativa sin umbrales presentados como verdades universales. */
export function describeConditioning(kappa: number | null): string {
  if (kappa === null || !Number.isFinite(kappa)) return 'No disponible';
  if (kappa < 30) return 'Bien condicionada (κ cercano a 1)';
  if (kappa < 1000) return 'Condicionamiento moderado';
  return 'Mal condicionada (κ ≫ 1)';
}
