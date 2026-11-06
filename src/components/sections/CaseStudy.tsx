import { BUDGET_UNIT, VARIABLES } from '../../data/variables';
import { Card, Section } from '../Section';

export function CaseStudy() {
  return (
    <Section id="caso" title="2. Caso de estudio">
      <p>
        Una unidad de tecnología debe repartir un presupuesto entre cuatro áreas. Las áreas no son independientes: el
        software se despliega sobre la infraestructura, el marketing genera demanda que carga el soporte, y todas comparten
        factores de costo como la inflación o el tipo de cambio. Estas dependencias se resumen en un sistema lineal{' '}
        <strong>A·x = b</strong> con n = 4 ecuaciones e incógnitas.
      </p>
      <div className="grid-3">
        <Card title="Vector x (incógnitas)">
          <p>
            Asignación presupuestaria de cada área, expresada en <strong>{BUDGET_UNIT}</strong> (unidad usada de forma
            consistente en toda la aplicación).
          </p>
        </Card>
        <Card title="Matriz A">
          <p>
            Matriz de costos e interacciones: a_ii es el costo propio del área i y a_ij (i ≠ j) la dependencia financiera entre
            las áreas i y j. Es simétrica (a_ij = a_ji, interacción recíproca) y definida positiva (los costos de cualquier
            combinación de asignaciones son positivos).
          </p>
        </Card>
        <Card title="Vector b">
          <p>
            Requerimientos u objetivos financieros ponderados de cada área, es decir, lo que cada ecuación de balance debe
            satisfacer. Los datos son <em>ilustrativos</em>: se diseñaron con fines académicos y no provienen de una
            institución real.
          </p>
        </Card>
      </div>
      <h3>Variables del modelo</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Variable</th>
              <th>Área</th>
              <th>Significado</th>
            </tr>
          </thead>
          <tbody>
            {VARIABLES.map((v) => (
              <tr key={v.symbol}>
                <td>
                  <strong>{v.symbol}</strong>
                </td>
                <td>{v.name}</td>
                <td>
                  {v.meaning} Unidad: {BUDGET_UNIT}.
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        <strong>Utilidad del análisis numérico.</strong> Resolver el sistema con distintos métodos permite contrastar
        exactitud, costo y estabilidad. Los métodos iterativos (GC/GCP) escalan a sistemas grandes y ralos, y el
        número de condición κ(A) mide cuánto puede amplificarse en la solución un error pequeño en los datos; el
        precondicionamiento busca reducir ese efecto y acelerar la convergencia.
      </p>
    </Section>
  );
}
