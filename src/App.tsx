import { useCallback, useMemo, useState } from 'react';
import { NavBar } from './components/NavBar';
import { Comparison } from './components/sections/Comparison';
import { CaseStudy } from './components/sections/CaseStudy';
import { Conclusions } from './components/sections/Conclusions';
import { DataInput } from './components/sections/DataInput';
import { Errors } from './components/sections/Errors';
import { Formulation } from './components/sections/Formulation';
import { GcVsGcp } from './components/sections/GcVsGcp';
import { Header } from './components/sections/Header';
import { QA } from './components/sections/QA';
import { References } from './components/sections/References';
import { Results } from './components/sections/Results';
import { Scenarios } from './components/sections/Scenarios';
import { SCENARIOS, getScenario } from './data/scenarios';
import { useAnalysis } from './hooks/useAnalysis';
import { parseRawInput } from './math/validation';
import type { RawInput, ScenarioId } from './types';
import { computeBaselines } from './utils/baselines';
import { rawFromScenario } from './utils/rawInput';

export default function App() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('ideal');
  const [edited, setEdited] = useState(false);
  const [raw, setRaw] = useState<RawInput>(() => rawFromScenario(SCENARIOS[0]));
  const [state, commitNow] = useAnalysis(raw);

  // Los escenarios base se calculan una sola vez y no dependen de la edición del usuario.
  const baselines = useMemo(() => computeBaselines(), []);

  const loadScenario = useCallback(
    (id: ScenarioId) => {
      const next = rawFromScenario(getScenario(id));
      setScenarioId(id);
      setEdited(false);
      setRaw(next);
      commitNow(next);
    },
    [commitNow],
  );

  const onChange = useCallback((next: RawInput) => {
    setRaw(next);
    setEdited(true);
  }, []);

  const numeric = useMemo(() => parseRawInput(raw).numeric, [raw]);
  const { analysis, parseMessages, pending } = state;

  return (
    <>
      <NavBar />
      <main>
        <Header />
        <CaseStudy />
        <Formulation A={numeric?.A ?? null} b={numeric?.b ?? null} />
        <DataInput
          raw={raw}
          onChange={onChange}
          onRestore={() => loadScenario(scenarioId)}
          onRecalculate={() => commitNow(raw)}
          analysis={analysis}
          parseMessages={parseMessages}
          pending={pending}
          scenarioName={getScenario(scenarioId).name}
          edited={edited}
        />
        <Scenarios selected={scenarioId} edited={edited} onSelect={loadScenario} />
        <Results analysis={analysis} />
        <GcVsGcp analysis={analysis} tolerance={numeric ? numeric.tolerance : null} />
        <Errors analysis={analysis} />
        <Comparison baselines={baselines} />
        <QA />
        <Conclusions baselines={baselines} />
        <References />
      </main>
      <footer className="footer">
        Universidad Mayor de San Andrés · Carrera de Informática · Métodos Numéricos
      </footer>
    </>
  );
}
