import { SCENARIOS } from '../data/scenarios';
import { runAnalysis } from '../math/analysis';
import { scenarioToInput } from '../qa/qaTests';
import type { ComparisonResult } from '../types';

/** Ejecuta realmente los tres escenarios base, independientemente de las ediciones del usuario. */
export function computeBaselines(): ComparisonResult[] {
  return SCENARIOS.map((scenario) => ({ scenario, analysis: runAnalysis(scenarioToInput(scenario.id)) }));
}
