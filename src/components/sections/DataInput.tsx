import type { AnalysisResult, RawInput, ValidationMessage } from '../../types';
import { fmtSci, yesNo } from '../../utils/format';
import { Alerts } from '../Alerts';
import { MatrixEditor } from '../MatrixEditor';
import { Badge, Card, Section } from '../Section';

interface Props {
  raw: RawInput;
  onChange: (r: RawInput) => void;
  onRestore: () => void;
  onRecalculate: () => void;
  analysis: AnalysisResult | null;
  parseMessages: ValidationMessage[];
  pending: boolean;
  scenarioName: string;
  edited: boolean;
}

export function DataInput(p: Props) {
  const v = p.analysis?.validation ?? null;
  const messages: ValidationMessage[] = [
    ...p.parseMessages,
    ...(p.analysis ? p.analysis.validation.messages : []),
    ...(p.analysis ? p.analysis.paramMessages : []),
  ];
  const blocked = !p.analysis || !p.analysis.ok;
  return (
    <Section id="entrada" title="4. Entrada de datos">
      <p>
        Edite cualquier coeficiente de A, b o x0, la tolerancia, el máximo de iteraciones o el precondicionador. Los
        resultados se recalculan automáticamente (con una breve espera tras escribir). Escenario actual:{' '}
        <strong>{p.scenarioName}</strong>
        {p.edited ? ' (modificado)' : ''}.
      </p>
      <MatrixEditor raw={p.raw} onChange={p.onChange} />
      <div className="button-row">
        <button type="button" className="btn" onClick={p.onRecalculate}>
          Calcular / Recalcular
        </button>
        <button type="button" className="btn btn-secondary" onClick={p.onRestore}>
          Restaurar escenario
        </button>
        {p.pending ? <span className="note">Recalculando…</span> : null}
      </div>

      <Alerts messages={messages} />
      {blocked ? (
        <div className="alert alert-error">
          <strong>GC/GCP no se ejecutaron.</strong> Los datos actuales no cumplen los requisitos del método (matriz
          simétrica definida positiva, datos numéricos finitos y parámetros válidos). Corrija los valores señalados
          arriba.
        </div>
      ) : null}

      <h3 id="propiedades">Propiedades matemáticas de A</h3>
      {v ? (
        <div className="grid-2">
          <Card title="Verificación">
            <table className="kv">
              <tbody>
                <tr>
                  <td>A = Aᵀ (simétrica)</td>
                  <td>
                    <Badge ok={v.isSymmetric} /> <span className="note">máx |a_ij − a_ji| = {fmtSci(v.maxAsymmetry, 2)}</span>
                  </td>
                </tr>
                <tr>
                  <td>Definida positiva</td>
                  <td>
                    <Badge ok={v.isPositiveDefinite} />
                  </td>
                </tr>
                <tr>
                  <td>Cholesky (A = LLᵀ) exitoso</td>
                  <td>
                    <Badge ok={v.choleskyOk} />
                  </td>
                </tr>
                <tr>
                  <td>Criterio de Sylvester (menores &gt; 0)</td>
                  <td>
                    <Badge ok={v.sylvesterOk} />
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Matriz válida para GC/GCP</strong>
                  </td>
                  <td>
                    <Badge ok={v.validForCG} />
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
          <Card title="Evidencia numérica">
            {v.eigenvalues.length > 0 ? (
              <>
                <p>Autovalores de A{v.isSymmetric ? '' : ' (de su parte simétrica, solo informativo)'}:</p>
                <ul className="plain">
                  {v.eigenvalues.map((l, i) => (
                    <li key={i}>
                      λ{i + 1} = <code>{l.toPrecision(8)}</code> {l > 0 ? '> 0' : '≤ 0'}
                    </li>
                  ))}
                </ul>
                <p>
                  {v.eigenvalues.every((l) => l > 0)
                    ? 'Todos λi > 0 → A es definida positiva.'
                    : 'Existe algún λi ≤ 0 → A NO es definida positiva.'}
                </p>
                <p className="note">
                  Menores principales: {v.leadingMinors.map((m) => m.toPrecision(6)).join(' ; ')} (¿todos &gt; 0? {yesNo(v.sylvesterOk)})
                </p>
              </>
            ) : (
              <p className="note">No hay evidencia disponible: la matriz no tiene forma válida (cuadrada y finita).</p>
            )}
          </Card>
        </div>
      ) : (
        <div className="alert alert-warning">
          Hay valores vacíos o no numéricos; no se puede evaluar la simetría ni la definición positiva hasta corregirlos.
        </div>
      )}
    </Section>
  );
}
