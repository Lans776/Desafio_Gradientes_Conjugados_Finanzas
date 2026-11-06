import { BUDGET_UNIT, VARIABLES } from '../../data/variables';
import { describeConditioning } from '../../math/conditionNumber';
import type { AnalysisResult } from '../../types';
import { fmtFixed, fmtKappa, fmtSci } from '../../utils/format';
import { Card, Section } from '../Section';

export function Results({ analysis }: { analysis: AnalysisResult | null }) {
  const d = analysis?.direct ?? null;
  const c = analysis?.condition ?? null;
  const total = d ? d.x.reduce((a, v) => a + v, 0) : null;
  return (
    <Section id="resultados" title="6. Solución numérica de referencia">
      {d ? (
        <div className="grid-2">
          <Card title="Método directo: Cholesky (A = L·Lᵀ)">
            <p className="note">
              Solución numérica de referencia (L y = b, Lᵀ x = y). Residuo relativo del método directo: {fmtSci(d.relativeResidual, 2)}
              {d.gaussCrossCheck !== null ? `; verificación cruzada con eliminación de Gauss: diferencia máx. ${fmtSci(d.gaussCrossCheck, 2)}.` : '.'}
            </p>
            <table className="kv">
              <tbody>
                {d.x.map((v, i) => (
                  <tr key={i}>
                    <td>
                      <strong>{VARIABLES[i].symbol}</strong> — {VARIABLES[i].short}
                    </td>
                    <td className="num">
                      {fmtFixed(v, 6)} {BUDGET_UNIT}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>Total asignado</td>
                  <td className="num">
                    {fmtFixed(total, 6)} {BUDGET_UNIT}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="note">
              Interpretación: el reparto de equilibrio entre Desarrollo, Infraestructura, Marketing y Soporte que satisface
              simultáneamente las cuatro ecuaciones del modelo con los datos actuales.
            </p>
          </Card>
          <Card title="Número de condición">
            {c ? (
              <table className="kv">
                <tbody>
                  <tr>
                    <td>λmin(A), λmax(A)</td>
                    <td className="num">
                      {c.lambdaMin?.toPrecision(5)} ; {c.lambdaMax?.toPrecision(5)}
                    </td>
                  </tr>
                  <tr>
                    <td>κ₂(A)</td>
                    <td className="num">
                      <strong>{fmtKappa(c.kappaA)}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="note" colSpan={2}>
                      {describeConditioning(c.kappaA)}
                    </td>
                  </tr>
                  <tr>
                    <td>κ₂(M⁻¹A)</td>
                    <td className="num">
                      <strong>{fmtKappa(c.kappaPrecond)}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="note" colSpan={2}>
                      {describeConditioning(c.kappaPrecond)} — con {analysis?.preconditioner?.label}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : null}
            {c ? <p className="note">{c.note} Las categorías cualitativas son orientativas, no umbrales universales.</p> : null}
          </Card>
        </div>
      ) : (
        <div className="alert alert-warning">
          No hay solución de referencia: los datos actuales no son válidos (revise la sección “Entrada de datos”).
        </div>
      )}
    </Section>
  );
}
