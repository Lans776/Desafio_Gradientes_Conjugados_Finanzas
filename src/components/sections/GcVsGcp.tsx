import { useState } from 'react';
import type { AnalysisResult, SolverResult } from '../../types';
import { fmtFixed, fmtSci, yesNo } from '../../utils/format';
import { ConvergenceChart } from '../ConvergenceChart';
import { Card, Section } from '../Section';

function IterTable({ result }: { result: SolverResult }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>k</th>
            <th>‖r_k‖₂</th>
            <th>Residuo relativo</th>
            <th>α (paso aplicado)</th>
            <th>β (siguiente dirección)</th>
            <th>x1</th>
            <th>x2</th>
            <th>x3</th>
            <th>x4</th>
          </tr>
        </thead>
        <tbody>
          {result.history.map((h) => (
            <tr key={h.k}>
              <td>{h.k}</td>
              <td className="num">{fmtSci(h.residualNorm, 3)}</td>
              <td className="num">{fmtSci(h.relativeResidual, 3)}</td>
              <td className="num">{h.alpha === null ? '—' : fmtSci(h.alpha, 4)}</td>
              <td className="num">{h.beta === null ? '—' : fmtSci(h.beta, 4)}</td>
              {h.x.map((v, i) => (
                <td key={i} className="num">
                  {fmtFixed(v, 4)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GcVsGcp({ analysis, tolerance }: { analysis: AnalysisResult | null; tolerance: number | null }) {
  const [which, setWhich] = useState<'GCP' | 'GC'>('GCP');
  const gc = analysis?.gc ?? null;
  const gcp = analysis?.gcp ?? null;
  return (
    <Section id="gc-gcp" title="7. GC vs GCP">
      {gc && gcp && tolerance !== null ? (
        <>
          <p>
            Precondicionador utilizado en GCP: <strong>{analysis?.preconditioner?.label}</strong>.{' '}
            {analysis?.preconditioner?.description}
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th>GC</th>
                  <th>GCP</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>¿Convergió?</td>
                  <td>{yesNo(gc.converged)}</td>
                  <td>{yesNo(gcp.converged)}</td>
                </tr>
                <tr>
                  <td>Iteraciones</td>
                  <td className="num">{gc.iterations}</td>
                  <td className="num">{gcp.iterations}</td>
                </tr>
                <tr>
                  <td>Residuo final ‖r‖₂</td>
                  <td className="num">{fmtSci(gc.finalResidualNorm, 3)}</td>
                  <td className="num">{fmtSci(gcp.finalResidualNorm, 3)}</td>
                </tr>
                <tr>
                  <td>Residuo relativo final</td>
                  <td className="num">{fmtSci(gc.finalRelativeResidual, 3)}</td>
                  <td className="num">{fmtSci(gcp.finalRelativeResidual, 3)}</td>
                </tr>
                <tr>
                  <td>Residuo verdadero ‖b − Ax‖₂/‖b‖₂</td>
                  <td className="num">{fmtSci(gc.trueRelativeResidual, 3)}</td>
                  <td className="num">{fmtSci(gcp.trueRelativeResidual, 3)}</td>
                </tr>
                <tr>
                  <td>Estado</td>
                  <td>{gc.statusMessage}</td>
                  <td>{gcp.statusMessage}</td>
                </tr>
                <tr>
                  <td>Solución obtenida</td>
                  <td className="num">[{gc.x.map((v) => fmtFixed(v, 4)).join('; ')}]</td>
                  <td className="num">[{gcp.x.map((v) => fmtFixed(v, 4)).join('; ')}]</td>
                </tr>
                <tr>
                  <td>Tiempo (referencial)</td>
                  <td className="num">{gc.elapsedMs.toFixed(3)} ms</td>
                  <td className="num">{gcp.elapsedMs.toFixed(3)} ms</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="note">
            Con n = 4 el tiempo es despreciable y no es un indicador válido de eficiencia; la comparación relevante son las
            iteraciones y la reducción del residuo. En aritmética exacta GC termina en a lo sumo n = 4 iteraciones, de modo
            que con n = 4 la mejora posible del precondicionamiento es acotada.
          </p>
          <Card title="Gráfico de convergencia">
            <ConvergenceChart gc={gc} gcp={gcp} tolerance={tolerance} />
          </Card>
          <h3>Detalle de iteraciones</h3>
          <div className="tabs" role="tablist">
            {(['GCP', 'GC'] as const).map((w) => (
              <button
                key={w}
                type="button"
                role="tab"
                aria-selected={which === w}
                className={`tab ${which === w ? 'active' : ''}`}
                onClick={() => setWhich(w)}
              >
                {w}
              </button>
            ))}
          </div>
          <IterTable result={which === 'GCP' ? gcp : gc} />
        </>
      ) : (
        <div className="alert alert-warning">
          GC y GCP no se ejecutaron porque los datos actuales no son válidos para el método.
        </div>
      )}
    </Section>
  );
}
