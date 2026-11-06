import type { ComparisonResult } from '../../types';
import { fmtKappa, fmtSci } from '../../utils/format';
import { BUDGET_UNIT } from '../../data/variables';
import { Card, Section } from '../Section';

export function Conclusions({ baselines }: { baselines: ComparisonResult[] }) {
  const [ideal, stress, ill] = baselines;
  const ok = baselines.every((b) => b.analysis.ok);
  if (!ok) {
    return (
      <Section id="conclusiones" title="11. Conclusiones">
        <div className="alert alert-error">No se pudieron calcular los escenarios base; las conclusiones dinámicas no están disponibles.</div>
      </Section>
    );
  }
  const a = (c: ComparisonResult) => c.analysis;
  const illGc = a(ill).gc!.iterations;
  const illGcp = a(ill).gcp!.iterations;
  const kA = a(ill).condition!.kappaA;
  const kM = a(ill).condition!.kappaPrecond;
  const idealK = a(ideal).condition!.kappaA;
  const stressK = a(stress).condition!.kappaA;
  const totalIdeal = a(ideal).direct!.x.reduce((s, v) => s + v, 0);
  const totalStress = a(stress).direct!.x.reduce((s, v) => s + v, 0);
  const dropPct = ((totalStress - totalIdeal) / totalIdeal) * 100;
  const maxAbs = Math.max(...baselines.map((c) => a(c).errors!.maxAbsolute));
  const maxRel = Math.max(...baselines.map((c) => a(c).gcp!.finalRelativeResidual));

  let precondText: string;
  if (illGcp < illGc) {
    precondText = `En el escenario mal condicionado el precondicionador (${a(ill).preconditioner!.label}) redujo las iteraciones de ${illGc} (GC) a ${illGcp} (GCP) y el número de condición de ${fmtKappa(kA)} a ${fmtKappa(kM)}.`;
  } else if (illGcp === illGc) {
    precondText = `En el escenario mal condicionado GC y GCP necesitaron ${illGc} iteraciones; el número de condición pasó de ${fmtKappa(kA)} a ${fmtKappa(kM)}, pero con n = 4 el recuento de iteraciones no mostró ventaja.`;
  } else {
    precondText = `En el escenario mal condicionado GCP necesitó más iteraciones (${illGcp}) que GC (${illGc}) con la configuración actual.`;
  }

  return (
    <Section id="conclusiones" title="11. Conclusiones">
      <div className="grid-2">
        <Card title="Conclusión matemática">
          <ul>
            <li>
              <strong>Utilidad de GC:</strong> resuelve sistemas simétricos definidos positivos usando solo productos
              matriz-vector. En los tres escenarios convergió (máx. error absoluto frente a la referencia: {fmtSci(maxAbs, 2)}).
            </li>
            <li>
              <strong>Utilidad de GCP:</strong> añade un precondicionador M para resolver el sistema equivalente M⁻¹Ax =
              M⁻¹b, cuyo espectro está más concentrado. Residuo relativo final máximo de GCP entre escenarios:{' '}
              {fmtSci(maxRel, 2)}.
            </li>
            <li>
              <strong>Efecto del condicionamiento:</strong> κ(A) = {fmtKappa(idealK)} (ideal), {fmtKappa(stressK)} (estrés) y{' '}
              {fmtKappa(kA)} (mal condicionado).
            </li>
            <li>
              <strong>Efecto del precondicionamiento:</strong> {precondText} En aritmética exacta GC termina en a lo sumo
              n = 4 pasos, por lo que la mejora observable es acotada para este tamaño.
            </li>
          </ul>
        </Card>
        <Card title="Conclusión financiera">
          <ul>
            <li>
              <strong>Ideal:</strong> asignación total de {totalIdeal.toFixed(2)} {BUDGET_UNIT} con un sistema estable
              (κ = {fmtKappa(idealK)}).
            </li>
            <li>
              <strong>Bajo estrés:</strong> el total asignado pasa a {totalStress.toFixed(2)} {BUDGET_UNIT} (
              {dropPct.toFixed(1)} % respecto al ideal) mientras κ(A) pasa de {fmtKappa(idealK)} a {fmtKappa(stressK)}:{' '}
              {Math.abs(stressK! / idealK! - 1) < 0.5
                ? 'el cambio desplaza sobre todo el punto de equilibrio y altera poco el condicionamiento.'
                : 'el cambio altera también de forma apreciable el condicionamiento.'}
            </li>
            <li>
              <strong>Mal condicionado:</strong> con escalas de costo muy dispares, pequeñas variaciones en los datos pueden
              amplificarse hasta un factor del orden de κ(A) = {fmtKappa(kA)} en la solución; reescalar con el
              precondicionador mitiga el efecto numérico, pero no cambia el modelo financiero.
            </li>
          </ul>
        </Card>
      </div>
      <p className="note">
        Los valores de esta sección se recalculan al ejecutar los tres escenarios base; los datos son ilustrativos
        (con fines académicos).
      </p>
    </Section>
  );
}
