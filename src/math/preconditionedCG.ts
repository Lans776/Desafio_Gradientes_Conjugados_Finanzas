import type { IterationData, Matrix, PreconditionerKind, SolverResult, Vector } from '../types';
import type { CGOptions } from './conjugateGradient';
import { relativeResidualOf } from './conjugateGradient';
import { axpy, dot, matVec, norm2, residual } from './vector';

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * Método de Gradientes Conjugados Precondicionado (GCP), implementado desde cero
 * siguiendo el esquema de Suñagua (2020) / Saad (2003, Alg. 9.1).
 *
 *   r0 = b − A x0;  resolver M z0 = r0;  p0 = z0
 *   α_k = (r_kᵀ z_k) / (p_kᵀ A p_k)
 *   x_{k+1} = x_k + α_k p_k
 *   r_{k+1} = r_k − α_k A p_k
 *   (parada si ‖r_{k+1}‖₂/‖b‖₂ < tolerancia)
 *   resolver M z_{k+1} = r_{k+1}
 *   β_k = (r_{k+1}ᵀ z_{k+1}) / (r_kᵀ z_k)
 *   p_{k+1} = z_{k+1} + β_k p_k
 *
 * `solveM` resuelve Mz = r (por ejemplo, z_i = r_i / a_ii para Jacobi).
 */
export function preconditionedConjugateGradient(
  A: Matrix,
  b: Vector,
  x0: Vector,
  solveM: (r: Vector) => Vector,
  kind: PreconditionerKind,
  opts: CGOptions,
): SolverResult {
  const t0 = now();
  const { tolerance, maxIterations } = opts;
  const bNorm = norm2(b);
  let x = x0.slice();
  let r = residual(A, b, x);
  let z = solveM(r);
  let p = z.slice();
  let rz = dot(r, z);
  let rNorm = norm2(r);
  let rel = relativeResidualOf(rNorm, bNorm);

  const history: IterationData[] = [
    { k: 0, residualNorm: rNorm, relativeResidual: rel, alpha: null, beta: null, x: x.slice() },
  ];

  let iterations = 0;
  let converged = rel < tolerance;
  let status: SolverResult['status'] = converged ? 'converged' : 'max-iterations';
  let statusMessage = converged ? 'x0 ya cumple la tolerancia (0 iteraciones).' : '';

  while (!converged && iterations < maxIterations) {
    if (!Number.isFinite(rz) || rz <= 0) {
      status = 'breakdown';
      statusMessage = `Ruptura numérica en la iteración ${iterations + 1}: rᵀz = ${rz} no es positivo (¿M o A no son definidas positivas?).`;
      break;
    }
    const Ap = matVec(A, p);
    const pAp = dot(p, Ap);
    if (!Number.isFinite(pAp) || pAp <= 1e-300) {
      status = 'breakdown';
      statusMessage = `Ruptura numérica en la iteración ${iterations + 1}: pᵀAp = ${pAp} no es positivo.`;
      break;
    }
    const alpha = rz / pAp;
    x = axpy(alpha, p, x);
    r = axpy(-alpha, Ap, r);
    rNorm = norm2(r);
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
    z = solveM(r); // M z_{k+1} = r_{k+1}
    const rzNew = dot(r, z);
    const beta = rzNew / rz;
    row.beta = beta;
    p = axpy(beta, p, z); // p = z + β p
    rz = rzNew;
  }

  if (!converged && status === 'max-iterations') {
    statusMessage = `No alcanzó la tolerancia tras ${iterations} iteraciones (máximo permitido).`;
  }

  const trueRel = relativeResidualOf(norm2(residual(A, b, x)), bNorm);
  return {
    method: 'GCP',
    preconditioner: kind,
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
