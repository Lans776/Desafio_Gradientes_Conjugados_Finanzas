import type { AnalysisResult, DirectSolution, NumericInput } from '../types';
import { cholesky, choleskySolve } from './cholesky';
import { analyzeCondition } from './conditionNumber';
import { conjugateGradient } from './conjugateGradient';
import { errorAnalysis } from './errors';
import { gaussSolve } from './lu';
import { preconditionedConjugateGradient } from './preconditionedCG';
import { buildPreconditioner } from './preconditioners';
import { validateParameters, validateSystem } from './validation';
import { norm2, residual } from './vector';

/**
 * Pipeline completo para un sistema: validación → solución de referencia (Cholesky)
 * → GC → GCP → errores → número de condición. Nunca lanza excepciones por entradas
 * matemáticamente inválidas: devuelve ok = false con los mensajes correspondientes.
 */
export function runAnalysis(input: NumericInput): AnalysisResult {
  const { A, b, x0, tolerance, maxIterations, preconditioner, ssorOmega } = input;
  const validation = validateSystem(A, b, x0);
  const bNorm = validation.wellFormed ? norm2(b) : null;
  const paramMessages = validateParameters(tolerance, maxIterations, bNorm);
  const blocked: AnalysisResult = {
    ok: false,
    validation,
    paramMessages,
    direct: null,
    gc: null,
    gcp: null,
    errors: null,
    condition: null,
    preconditioner: null,
  };

  if (!validation.validForCG) return blocked;
  if (paramMessages.some((m) => m.level === 'error')) return blocked;

  try {
    const chol = cholesky(A);
    if (!chol.ok) {
      paramMessages.push({
        level: 'error',
        code: 'CHOLESKY_FAIL',
        message: `La factorización de Cholesky falló en el pivote ${(chol.failedAt ?? 0) + 1}.`,
      });
      return blocked;
    }
    const xRef = choleskySolve(chol.L, b);
    const gauss = gaussSolve(A, b);
    const bn = norm2(b);
    const direct: DirectSolution = {
      method: 'Cholesky',
      x: xRef,
      L: chol.L,
      relativeResidual: bn > 0 ? norm2(residual(A, b, xRef)) / bn : norm2(residual(A, b, xRef)),
      gaussCrossCheck: gauss ? Math.max(...gauss.map((v, i) => Math.abs(v - xRef[i]))) : null,
    };

    const built = buildPreconditioner(A, preconditioner, ssorOmega);
    if (!built.ok) {
      paramMessages.push({ level: 'error', code: 'PRECOND_FAIL', message: built.message });
      return { ...blocked, direct };
    }
    const pc = built.preconditioner;

    const opts = { tolerance, maxIterations };
    const gc = conjugateGradient(A, b, x0, opts);
    const gcp = preconditionedConjugateGradient(A, b, x0, pc.apply, pc.kind, opts);

    if (gc.status === 'breakdown') {
      paramMessages.push({ level: 'warning', code: 'GC_BREAKDOWN', message: `GC: ${gc.statusMessage}` });
    }
    if (gcp.status === 'breakdown') {
      paramMessages.push({ level: 'warning', code: 'GCP_BREAKDOWN', message: `GCP: ${gcp.statusMessage}` });
    }

    const errors = errorAnalysis(A, b, xRef, gcp.x);
    const condition = analyzeCondition(A, pc.matrix, pc.info.label);
    return {
      ok: true,
      validation,
      paramMessages,
      direct,
      gc,
      gcp,
      errors,
      condition,
      preconditioner: pc.info,
    };
  } catch (e) {
    paramMessages.push({
      level: 'error',
      code: 'UNEXPECTED',
      message: `Error numérico inesperado controlado: ${e instanceof Error ? e.message : String(e)}`,
    });
    return blocked;
  }
}
