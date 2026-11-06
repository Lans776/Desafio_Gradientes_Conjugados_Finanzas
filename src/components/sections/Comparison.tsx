import type { ComparisonResult } from '../../types';
import { fmtError, fmtFixed, fmtKappa, fmtPercent, fmtSci, yesNo } from '../../utils/format';
import { Section } from '../Section';

export function Comparison({ baselines }: { baselines: ComparisonResult[] }) {
  const cell = (c: ComparisonResult, f: (a: NonNullable<ComparisonResult['analysis']>) => string) =>
    c.analysis.ok ? f(c.analysis) : 'No disponible';
  const vec = (x: number[] | undefined) => (x ? `[${x.map((v) => fmtFixed(v, 4)).join('; ')}]` : '—');
  const rows: Array<[string, (c: ComparisonResult) => string]> = [
    ['Solución numérica de referencia', (c) => cell(c, (a) => vec(a.direct?.x))],
    ['Solución GCP', (c) => cell(c, (a) => vec(a.gcp?.x))],
    ['Error absoluto (por variable)', (c) => cell(c, (a) => `[${a.errors!.rows.map((r) => fmtError(r.absolute)).join('; ')}]`)],
    ['Error porcentual (por variable)', (c) => cell(c, (a) => `[${a.errors!.rows.map((r) => fmtPercent(r.percent)).join('; ')}]`)],
    ['Iteraciones GC (sin precondicionar)', (c) => cell(c, (a) => String(a.gc!.iterations))],
    ['Iteraciones GCP (precondicionado)', (c) => cell(c, (a) => String(a.gcp!.iterations))],
    ['Precondicionador', (c) => cell(c, (a) => a.preconditioner!.label)],
    ['κ(A)', (c) => cell(c, (a) => fmtKappa(a.condition!.kappaA))],
    ['κ(M⁻¹A)', (c) => cell(c, (a) => fmtKappa(a.condition!.kappaPrecond))],
    ['Residuo relativo final GCP', (c) => cell(c, (a) => fmtSci(a.gcp!.finalRelativeResidual, 3))],
    ['¿Convergió? (GC / GCP)', (c) => cell(c, (a) => `${yesNo(a.gc!.converged)} / ${yesNo(a.gcp!.converged)}`)],
    ['Interpretación financiera', (c) => c.scenario.financialInterpretation],
  ];
  return (
    <Section id="comparacion" title="9. Comparación de los tres escenarios">
      <p>
        Esta tabla se calcula ejecutando realmente los tres escenarios base. No cambia cuando usted edita A o b en la
        sección de entrada de datos.
      </p>
      <div className="table-wrap">
        <table className="compare">
          <thead>
            <tr>
              <th>Indicador</th>
              {baselines.map((c) => (
                <th key={c.scenario.id}>{c.scenario.shortName}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, f]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {baselines.map((c) => (
                  <td key={c.scenario.id} className={label.startsWith('Interpretación') ? 'text-cell' : 'num'}>
                    {f(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
