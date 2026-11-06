import type { IterationData, Matrix, SolverResult, Vector } from '../types';
import { axpy, dot, matVec, norm2, residual } from './vector';

export interface CGOptions {
  tolerance: number;
  maxIterations: number;
}

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * Residuo relativo ‖r‖₂/‖b‖₂. Si ‖b‖₂ = 0 el cociente no está definido y se
 * utiliza el residuo absoluto ‖r‖₂ (el llamador lo advierte al usuario).
 */
export function relativeResidualOf(rNorm: number, bNorm: number): number {
  return bNorm > 0 ? rNorm / bNorm : rNorm;
}

/**
 * Método de Gradientes Conjugados (sin precondicionar), implementado desde cero.
 *
 *   r0 = b − A x0,  p0 = r0
 *   α_k = (r_kᵀ r_k) / (p_kᵀ A p_k)
 *   x_{k+1} = x_k + α_k p_k
 *   r_{k+1} = r_k − α_k A p_k
 *   β_k = (r_{k+1}ᵀ r_{k+1}) / (r_kᵀ r_k)
 *   p_{k+1} = r_{k+1} + β_k p_k
 *
 * Criterio de parada: ‖r_k‖₂/‖b‖₂ < tolerancia.
 */
export function conjugateGradient(A: Matrix, b: Vector, x0: Vector, opts: CGOptions): SolverResult {
  const t0 = now();
  const { tolerance, maxIterations } = opts;
  const bNorm = norm2(b);
  let x = x0.slice();
  let r = residual(A, b, x);
  let p = r.slice();
  let rr = dot(r, r);
  let rNorm = Math.sqrt(rr);
  let rel = relativeResidualOf(rNorm, bNorm);

  const history: IterationData[] = [
    { k: 0, residualNorm: rNorm, relativeResidual: rel, alpha: null, beta: null, x: x.slice() },
  ];

  let iterations = 0;
  let converged = rel < tolerance;
  let status: SolverResult['status'] = converged ? 'converged' : 'max-iterations';
  let statusMessage = converged ? 'x0 ya cumple la tolerancia (0 iteraciones).' : '';

  while (!converged && iterations < maxIterations) {
    const Ap = matVec(A, p);
    const pAp = dot(p, Ap);
    // Breakdown: pᵀAp debe ser > 0 si A es SPD y p ≠ 0.
    if (!Number.isFinite(pAp) || pAp <= 1e-300) {
      status = 'breakdown';
      statusMessage = `Ruptura numérica en la iteración ${iterations + 1}: pᵀAp = ${pAp} no es positivo (¿A no es definida positiva?).`;
      break;
    }
    const alpha = rr / pAp;
    x = axpy(alpha, p, x);
    r = axpy(-alpha, Ap, r);
    const rrNew = dot(r, r);
    rNorm = Math.sqrt(rrNew);
    rel = relativeResidualOf(rNorm, bNorm);
    iterations += 1;
    const row: IterationData = {
      k: iterations,
      residualNorm: rNorm,
      relativeResidual: rel,
      alpha,
      beta: null,
      x: x.slice(),
    };
    history.push(row);
    if (!Number.isFinite(rel)) {
      status = 'breakdown';
      statusMessage = `Valores no finitos en la iteración ${iterations}.`;
      break;
    }
    if (rel < tolerance) {
      converged = true;
      status = 'converged';
      statusMessage = `Convergió en ${iterations} iteraciones.`;
      break;
    }
    const beta = rrNew / rr;
    row.beta = beta;
    p = axpy(beta, p, r); // p = r + β p
    rr = rrNew;
  }

  if (!converged && status === 'max-iterations') {
    statusMessage = `No alcanzó la tolerancia tras ${iterations} iteraciones (máximo permitido).`;
  }

  const trueRel = relativeResidualOf(norm2(residual(A, b, x)), bNorm);
  return {
    method: 'GC',
    preconditioner: null,
    x,
    iterations,
    converged,
    status,
    statusMessage,
    finalResidualNorm: rNorm,
    finalRelativeResidual: rel,
    trueRelativeResidual: trueRel,
    history,
    elapsedMs: now() - t0,
  };
}
