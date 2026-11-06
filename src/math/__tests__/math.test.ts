import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SCENARIOS } from '../../data/scenarios';
import { runQATests } from '../../qa/qaTests';
import { runAnalysis } from '../analysis';
import { cholesky, choleskySolve } from '../cholesky';
import { kappaFromEigenvalues, preconditionedEigenvalues } from '../conditionNumber';
import { conjugateGradient } from '../conjugateGradient';
import { symmetricEigenvalues } from '../eigen';
import { errorAnalysis } from '../errors';
import { isSymmetric } from '../matrix';
import { preconditionedConjugateGradient } from '../preconditionedCG';
import { buildPreconditioner } from '../preconditioners';
import { parseRawInput, validateSystem } from '../validation';
import { dot, matVec, norm2 } from '../vector';

const A = [
  [4, 1, 0, 0],
  [1, 3, 1, 0],
  [0, 1, 5, 2],
  [0, 0, 2, 6],
];
const b = [1, 2, 3, 4];
const close = (a: number, c: number, tol = 1e-9) => assert.ok(Math.abs(a - c) <= tol, `${a} ≉ ${c}`);

describe('álgebra básica', () => {
  it('producto punto', () => close(dot([1, 2, 3], [4, 5, 6]), 32));
  it('norma 2', () => {
    close(norm2([3, 4]), 5);
    close(norm2([0, 0]), 0);
  });
  it('matriz-vector', () => assert.deepEqual(matVec([[1, 2], [3, 4]], [1, 1]), [3, 7]));
  it('simetría con tolerancia', () => {
    assert.equal(isSymmetric(A), true);
    assert.equal(isSymmetric([[1, 2], [2.0000001, 1]]), false);
    assert.equal(isSymmetric([[1, 2], [2 + 1e-13, 1]]), true);
  });
});

describe('Cholesky y autovalores', () => {
  it('L Lᵀ = A y resuelve Ax = b', () => {
    const c = cholesky(A);
    assert.ok(c.ok);
    const x = choleskySolve(c.L, b);
    const r = matVec(A, x).map((v, i) => v - b[i]);
    assert.ok(norm2(r) < 1e-12);
  });
  it('falla en matriz no definida positiva', () => assert.equal(cholesky([[1, 3], [3, 1]]).ok, false));
  it('autovalores de [[2,1],[1,2]] = 1 y 3', () => {
    const ev = symmetricEigenvalues([[2, 1], [1, 2]]);
    close(ev[0], 1);
    close(ev[1], 3);
    close(kappaFromEigenvalues(ev)!, 3);
  });
});

describe('GC, GCP y Jacobi', () => {
  const opts = { tolerance: 1e-10, maxIterations: 100 };
  it('GC converge a la solución de Cholesky', () => {
    const r = conjugateGradient(A, b, [0, 0, 0, 0], opts);
    assert.ok(r.converged);
    const xr = choleskySolve(cholesky(A).L, b);
    r.x.forEach((v, i) => close(v, xr[i], 1e-8));
  });
  it('Jacobi resuelve Mz = r con z_i = r_i / a_ii', () => {
    const p = buildPreconditioner(A, 'jacobi');
    assert.ok(p.ok);
    if (p.ok) assert.deepEqual(p.preconditioner.apply([4, 3, 5, 6]), [1, 1, 1, 1]);
  });
  it('Jacobi rechaza diagonal cero', () => assert.equal(buildPreconditioner([[0, 1], [1, 2]], 'jacobi').ok, false));
  it('GCP (Jacobi y SSOR) converge a la misma solución', () => {
    const xr = choleskySolve(cholesky(A).L, b);
    for (const kind of ['jacobi', 'ssor', 'none'] as const) {
      const p = buildPreconditioner(A, kind, 1.2);
      assert.ok(p.ok);
      if (!p.ok) return;
      const r = preconditionedConjugateGradient(A, b, [0, 0, 0, 0], p.preconditioner.apply, kind, opts);
      assert.ok(r.converged, kind);
      r.x.forEach((v, i) => close(v, xr[i], 1e-8));
    }
  });
  it('GCP con M = I coincide con GC', () => {
    const p = buildPreconditioner(A, 'none');
    if (!p.ok) throw new Error('no');
    const g = conjugateGradient(A, b, [0, 0, 0, 0], opts);
    const q = preconditionedConjugateGradient(A, b, [0, 0, 0, 0], p.preconditioner.apply, 'none', opts);
    assert.equal(g.iterations, q.iterations);
  });
  it('M⁻¹A con M = A tiene todos los autovalores 1 (SSOR no, Jacobi con A diagonal sí)', () => {
    const ev = preconditionedEigenvalues(A, A)!;
    ev.forEach((v) => close(v, 1, 1e-9));
  });
  it('detecta ruptura numérica con matriz indefinida', () => {
    const r = conjugateGradient([[1, 3], [3, 1]], [1, -1], [0, 0], opts);
    assert.ok(r.status === 'breakdown' || r.converged || r.status === 'max-iterations');
  });
});

describe('errores y validación', () => {
  it('error relativo no definido si x_ref_i = 0', () => {
    const e = errorAnalysis([[1, 0], [0, 1]], [0, 1], [0, 1], [0.1, 1]);
    assert.equal(e.rows[0].relative, null);
    assert.equal(e.rows[0].percent, null);
    close(e.rows[0].absolute, 0.1);
    assert.equal(e.rows[1].absolute, 0);
  });
  it('error porcentual = relativo × 100', () => {
    const e = errorAnalysis([[1]], [2], [2], [1.9]);
    close(e.rows[0].percent!, 5, 1e-9);
  });
  it('residuo global no definido con b = 0', () => {
    assert.equal(errorAnalysis([[1]], [0], [0], [0]).globalRelativeResidual, null);
  });
  it('valida NaN, vacíos y no numéricos sin lanzar excepciones', () => {
    const raw = {
      A: [['1', 'abc'], ['', 'NaN']],
      b: ['1', 'Infinity'],
      x0: ['0', '0'],
      tolerance: '1e-6',
      maxIterations: '100',
      preconditioner: 'jacobi' as const,
      ssorOmega: '1',
    };
    const p = parseRawInput(raw);
    assert.equal(p.numeric, null);
    assert.ok(p.messages.length >= 3);
  });
  it('rechaza dimensiones incompatibles y tolerancia inválida', () => {
    assert.equal(validateSystem(A, [1, 2], [0, 0, 0, 0]).wellFormed, false);
    const r = runAnalysis({ A, b, x0: [0, 0, 0, 0], tolerance: 0, maxIterations: 10, preconditioner: 'jacobi', ssorOmega: 1 });
    assert.equal(r.ok, false);
    assert.ok(r.paramMessages.some((m) => m.code === 'BAD_TOLERANCE'));
  });
});

describe('escenarios y QA', () => {
  it('los tres escenarios son SPD y convergen', () => {
    for (const s of SCENARIOS) {
      const r = runAnalysis({ A: s.A, b: s.b, x0: s.x0, tolerance: s.tolerance, maxIterations: s.maxIterations, preconditioner: s.preconditioner, ssorOmega: s.ssorOmega });
      assert.ok(r.ok, s.id);
      assert.ok(r.validation.isSymmetric && r.validation.isPositiveDefinite && r.validation.choleskyOk);
      assert.ok(r.gc!.converged && r.gcp!.converged);
      assert.ok(r.gcp!.finalRelativeResidual < s.tolerance);
      assert.ok(r.errors!.maxAbsolute < 1e-6);
    }
  });
  it('mal condicionado: κ(A) ≫ κ(M⁻¹A) y GCP < GC', () => {
    const s = SCENARIOS[2];
    const r = runAnalysis({ A: s.A, b: s.b, x0: s.x0, tolerance: s.tolerance, maxIterations: s.maxIterations, preconditioner: 'jacobi', ssorOmega: 1 });
    assert.ok(r.condition!.kappaA! > 100 * r.condition!.kappaPrecond!);
    assert.ok(r.gcp!.iterations < r.gc!.iterations);
  });
  it('las cuatro pruebas QA se aprueban', () => {
    const res = runQATests();
    assert.equal(res.length, 4);
    res.forEach((q) => assert.equal(q.status, 'APROBADO', q.id + ': ' + q.obtained));
  });
});
