import type { FinancialScenario, RawInput } from '../types';

export function rawFromScenario(s: FinancialScenario): RawInput {
  return {
    A: s.A.map((row) => row.map((v) => String(v))),
    b: s.b.map((v) => String(v)),
    x0: s.x0.map((v) => String(v)),
    tolerance: String(s.tolerance),
    maxIterations: String(s.maxIterations),
    preconditioner: s.preconditioner,
    ssorOmega: String(s.ssorOmega),
  };
}
