import { useEffect, useMemo, useState } from 'react';
import { runAnalysis } from '../math/analysis';
import { parseRawInput } from '../math/validation';
import type { AnalysisResult, RawInput, ValidationMessage } from '../types';

export interface AnalysisState {
  analysis: AnalysisResult | null;
  parseMessages: ValidationMessage[];
  /** true mientras hay cambios sin recalcular (debounce). */
  pending: boolean;
}

/**
 * Recalcula automáticamente al cambiar los datos. Usa debounce para ediciones de teclado
 * y permite un commit inmediato (carga de escenarios) mediante `commitNow`.
 */
export function useAnalysis(raw: RawInput, delayMs = 200): [AnalysisState, (r: RawInput) => void] {
  const [committed, setCommitted] = useState<RawInput>(raw);

  useEffect(() => {
    if (raw === committed) return;
    const id = window.setTimeout(() => setCommitted(raw), delayMs);
    return () => window.clearTimeout(id);
  }, [raw, committed, delayMs]);

  const state = useMemo<Omit<AnalysisState, 'pending'>>(() => {
    const parsed = parseRawInput(committed);
    if (!parsed.numeric) return { analysis: null, parseMessages: parsed.messages };
    return { analysis: runAnalysis(parsed.numeric), parseMessages: parsed.messages };
  }, [committed]);

  return [{ ...state, pending: raw !== committed }, setCommitted];
}
