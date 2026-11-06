import { SCENARIOS } from '../../data/scenarios';
import type { ScenarioId } from '../../types';
import { Card, Section } from '../Section';

interface Props {
  selected: ScenarioId;
  edited: boolean;
  onSelect: (id: ScenarioId) => void;
}

export function Scenarios({ selected, edited, onSelect }: Props) {
  const current = SCENARIOS.find((s) => s.id === selected) ?? SCENARIOS[0];
  return (
    <Section id="escenarios" title="5. Escenarios">
      <p>
        Cada botón carga A, b, x0, la tolerancia y el precondicionador del escenario, y recalcula todo el análisis.
      </p>
      <div className="scenario-buttons" role="group" aria-label="Selección de escenario">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`scenario-btn ${s.id === selected ? 'active' : ''}`}
            aria-pressed={s.id === selected}
            onClick={() => onSelect(s.id)}
          >
            {s.id === 'ideal' ? 'Escenario Ideal' : s.id === 'estres' ? 'Bajo Estrés' : 'Mal Condicionado'}
            {s.id === selected ? <span className="sel-mark">{edited ? ' ● modificado' : ' ✓ seleccionado'}</span> : null}
          </button>
        ))}
      </div>
      <Card title={current.name}>
        <p>{current.summary}</p>
        <p>
          <strong>Contexto financiero.</strong> {current.financialContext}
        </p>
        <p>
          <strong>Qué se modificó.</strong> {current.modelChanges}
        </p>
        <p>
          <strong>Interpretación financiera.</strong> {current.financialInterpretation}
        </p>
      </Card>
    </Section>
  );
}
