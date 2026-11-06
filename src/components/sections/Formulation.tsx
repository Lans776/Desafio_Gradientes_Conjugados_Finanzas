import type { Matrix, Vector } from '../../types';
import { VARIABLES } from '../../data/variables';
import { buildEquations } from '../../utils/equations';
import { MatrixView, VectorView } from '../MatrixView';
import { Card, Section } from '../Section';

interface Props {
  A: Matrix | null;
  b: Vector | null;
}

export function Formulation({ A, b }: Props) {
  const eqs = A && b ? buildEquations(A, b) : null;
  return (
    <Section id="formulacion" title="3. Formulación matemática">
      <p className="formula-big">A · x = b</p>
      {A && b ? (
        <div className="system-row">
          <MatrixView data={A} label="A" />
          <VectorView data={VARIABLES.map((v) => v.symbol)} label="x" symbols />
          <VectorView data={b} label="b" />
        </div>
      ) : (
        <p className="note">Corrija los datos de entrada para visualizar el sistema actual.</p>
      )}
      <h3>Sistema de ecuaciones (generado a partir de los datos actuales)</h3>
      {eqs ? (
        <ol className="equations">
          {eqs.map((e, i) => (
            <li key={i}>
              <code>{e}</code>
            </li>
          ))}
        </ol>
      ) : (
        <p className="note">Hay valores no numéricos o vacíos en A o b.</p>
      )}
      <h3>Interpretación de los coeficientes</h3>
      <div className="grid-2">
        <Card title="a_ii (diagonal)">
          <p>
            Influencia o costo propio del área i: cuánto “pesa” en su propia ecuación cada unidad de presupuesto asignada al
            área. Valores grandes indican áreas con costos unitarios altos.
          </p>
        </Card>
        <Card title="a_ij (fuera de la diagonal)">
          <p>
            Interacción o dependencia financiera entre las áreas i y j (costos compartidos, servicios que una presta a la
            otra). Por la simetría a_ij = a_ji, la dependencia es <strong>recíproca</strong>: el efecto financiero de
            asignar presupuesto a i sobre j es el mismo que de j sobre i.
          </p>
        </Card>
      </div>
      <p>
        La simetría y la definición positiva (xᵀAx &gt; 0 para todo x ≠ 0) garantizan solución única y la aplicabilidad de
        Cholesky, GC y GCP. Equivale a que la forma cuadrática ½xᵀAx − bᵀx, que GC minimiza, tenga un único mínimo.
      </p>
    </Section>
  );
}
