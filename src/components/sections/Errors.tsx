import type { AnalysisResult } from '../../types';
import { fmtError, fmtFixed, fmtPercent, fmtSci } from '../../utils/format';
import { Section } from '../Section';

export function Errors({ analysis }: { analysis: AnalysisResult | null }) {
  const e = analysis?.errors ?? null;
  return (
    <Section id="errores" title="8. Análisis de errores (GCP vs solución numérica de referencia)">
      {e ? (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Referencia</th>
                  <th>GCP</th>
                  <th>Error absoluto</th>
                  <th>Error relativo</th>
                  <th>Error porcentual</th>
                </tr>
              </thead>
              <tbody>
                {e.rows.map((r) => (
                  <tr key={r.variable}>
                    <td>
                      <strong>{r.variable}</strong>
                    </td>
                    <td className="num">{fmtFixed(r.reference, 6)}</td>
                    <td className="num">{fmtFixed(r.approx, 6)}</td>
                    <td className="num">{fmtError(r.absolute)}</td>
                    <td className="num">{fmtError(r.relative)}</td>
                    <td className="num">{fmtPercent(r.percent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Residuo relativo global ‖b − A·x_GCP‖₂ / ‖b‖₂ ={' '}
            <strong>{e.globalRelativeResidual === null ? 'No definido (‖b‖₂ = 0)' : fmtSci(e.globalRelativeResidual, 3)}</strong>
          </p>
          <p className="note">
            Ea = |x_ref − x_GCP|, Er = Ea/|x_ref| (No definido si x_ref = 0), Ep = Er × 100 %. Error absoluto máximo:{' '}
            {fmtError(e.maxAbsolute)}.
          </p>
        </>
      ) : (
        <div className="alert alert-warning">No hay análisis de errores: los datos actuales no son válidos.</div>
      )}
    </Section>
  );
}
