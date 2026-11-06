import { SCENARIOS, getScenario } from '../data/scenarios';
import { runAnalysis } from '../math/analysis';
import type { Matrix, NumericInput, QAResult } from '../types';
import { fmtKappa } from '../utils/format';

export function scenarioToInput(id: Parameters<typeof getScenario>[0]): NumericInput {
  const s = getScenario(id);
  return {
    A: s.A.map((r) => r.slice()),
    b: s.b.slice(),
    x0: s.x0.slice(),
    tolerance: s.tolerance,
    maxIterations: s.maxIterations,
    preconditioner: s.preconditioner,
    ssorOmega: s.ssorOmega,
  };
}

function qa01(): QAResult {
  const lines: string[] = [];
  let pass = true;
  for (const s of SCENARIOS) {
    const r = runAnalysis(scenarioToInput(s.id));
    const good =
      r.ok &&
      r.validation.validForCG &&
      !!r.gc?.converged &&
      !!r.gcp?.converged &&
      !!r.errors &&
      r.errors.rows.every((row) => Number.isFinite(row.absolute));
    if (!good) pass = false;
    lines.push(
      `${s.shortName}: ${good ? 'válido, GC ' + r.gc!.iterations + ' it., GCP ' + r.gcp!.iterations + ' it.' : 'FALLA'}`,
    );
  }
  return {
    id: 'QA-01',
    name: 'Carga de escenarios',
    input: 'Escenarios Ideal, Bajo Estrés y Mal Condicionado con sus A, b, x0, tolerancia y precondicionador.',
    expected: 'Las tres matrices son simétricas definidas positivas y GC y GCP convergen en cada escenario.',
    obtained: lines.join(' · '),
    status: pass ? 'APROBADO' : 'FALLIDO',
  };
}

function qa02(): QAResult {
  const bad: Array<{ label: string; A: Matrix }> = [
    {
      label: 'no simétrica',
      A: [
        [10, 2, 1, 0.5],
        [3, 12, 1.5, 1],
        [1, 1.5, 8, 0.5],
        [0.5, 1, 0.5, 9],
      ],
    },
    {
      label: 'simétrica no definida positiva',
      A: [
        [1, 3, 0, 0],
        [3, 1, 0, 0],
        [0, 0, 5, 1],
        [0, 0, 1, 5],
      ],
    },
  ];
  const parts: string[] = [];
  let pass = true;
  for (const c of bad) {
    let crashed = false;
    let r: ReturnType<typeof runAnalysis> | null = null;
    try {
      r = runAnalysis({ ...scenarioToInput('ideal'), A: c.A });
    } catch {
      crashed = true;
    }
    const rejected = !crashed && r !== null && !r.ok && r.gc === null && r.gcp === null;
    const msg = r?.validation.messages.find((m) => m.level === 'error')?.message;
    const good = rejected && !!msg;
    if (!good) pass = false;
    parts.push(`${c.label}: ${good ? 'rechazada (GC/GCP no ejecutados) — “' + msg + '”' : 'NO fue rechazada correctamente'}`);
  }
  return {
    id: 'QA-02',
    name: 'Matriz no válida',
    input: 'Matriz no simétrica (a21 = 3 ≠ a12 = 2) y matriz simétrica con autovalor negativo.',
    expected: 'El sistema rechaza la ejecución de GC/GCP con un mensaje controlado y sin lanzar excepciones.',
    obtained: parts.join(' · '),
    status: pass ? 'APROBADO' : 'FALLIDO',
  };
}

function qa03(): QAResult {
  const base = scenarioToInput('ideal');
  const r0 = runAnalysis(base);
  const modified: NumericInput = { ...base, A: base.A.map((r) => r.slice()) };
  // Modificación válida y simétrica: a11 = a11 + 2 (se mantiene la dominancia diagonal).
  modified.A[0][0] = base.A[0][0] + 2;
  const r1 = runAnalysis(modified);
  // Restauración: se vuelve a ejecutar con los datos originales.
  const r2 = runAnalysis(scenarioToInput('ideal'));
  let pass = false;
  let obtained = 'No se pudo ejecutar la prueba.';
  if (r0.ok && r1.ok && r2.ok && r0.direct && r1.direct && r2.direct && r0.gcp && r1.gcp && r2.gcp) {
    const dRef = Math.max(...r0.direct.x.map((v, i) => Math.abs(v - r1.direct!.x[i])));
    const dGcp = Math.max(...r0.gcp.x.map((v, i) => Math.abs(v - r1.gcp!.x[i])));
    const restored = r0.direct.x.every((v, i) => v === r2.direct!.x[i]) && r0.gcp.x.every((v, i) => v === r2.gcp!.x[i]);
    const gcpFollows = Math.max(...r1.gcp.x.map((v, i) => Math.abs(v - r1.direct!.x[i]))) < 1e-6;
    pass = dRef > 1e-6 && dGcp > 1e-6 && gcpFollows && restored;
    obtained = `Tras a11: ${base.A[0][0]} → ${modified.A[0][0]}: x_ref cambió (máx. Δ = ${dRef.toFixed(4)}), x_GCP cambió (máx. Δ = ${dGcp.toFixed(4)}) y coincide con la nueva referencia; al restaurar, los resultados originales se recuperan exactamente (${restored ? 'sí' : 'no'}).`;
  }
  return {
    id: 'QA-03',
    name: 'Edición dinámica',
    input: 'Escenario Ideal con el coeficiente a11 modificado de forma válida (10 → 12) y posterior restauración.',
    expected: 'Se recalculan la solución de referencia y GCP, los resultados cambian y la restauración devuelve el estado original.',
    obtained,
    status: pass ? 'APROBADO' : 'FALLIDO',
  };
}

function qa04(): QAResult {
  const r = runAnalysis(scenarioToInput('mal-condicionado'));
  const pass = r.ok && !!r.gc && !!r.gcp && r.gcp.converged && r.gc.converged && r.gcp.iterations <= r.gc.iterations;
  const obtained =
    r.ok && r.gc && r.gcp && r.condition
      ? `Jacobi: GCP ${r.gcp.iterations} it. ≤ GC ${r.gc.iterations} it.; κ(A) = ${fmtKappa(r.condition.kappaA)}, κ(M⁻¹A) = ${fmtKappa(r.condition.kappaPrecond)}.`
      : 'No se pudo ejecutar el escenario.';
  return {
    id: 'QA-04',
    name: 'Comparación de precondicionamiento',
    input: 'Escenario Mal Condicionado, tolerancia 1e-6, precondicionador de Jacobi.',
    expected: 'iteraciones_GCP ≤ iteraciones_GC (ambos convergen).',
    obtained,
    status: pass ? 'APROBADO' : 'FALLIDO',
  };
}

/** Ejecuta realmente las cuatro pruebas obligatorias. Cada prueba está aislada con try/catch. */
export function runQATests(): QAResult[] {
  const tests: Array<[string, () => QAResult]> = [
    ['QA-01', qa01],
    ['QA-02', qa02],
    ['QA-03', qa03],
    ['QA-04', qa04],
  ];
  return tests.map(([id, fn]) => {
    try {
      return fn();
    } catch (e) {
      return {
        id,
        name: 'Prueba con excepción',
        input: '—',
        expected: 'Ejecución sin excepciones',
        obtained: `Excepción: ${e instanceof Error ? e.message : String(e)}`,
        status: 'FALLIDO' as const,
      };
    }
  });
}
