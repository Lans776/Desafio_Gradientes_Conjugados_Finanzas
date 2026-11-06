import type { FinancialScenario, ScenarioId } from '../types';

/**
 * Escenarios precargados. Unidad: miles de bolivianos (miles de Bs).
 * Orden de variables: x1 Desarrollo, x2 Infraestructura, x3 Marketing, x4 Soporte.
 *
 * Las matrices fueron verificadas numéricamente (simetría, definición positiva por Cholesky,
 * autovalores y criterio de Sylvester, κ(A), κ(M⁻¹A) y convergencia de GC/GCP) con el propio
 * código del proyecto; el módulo QA vuelve a comprobarlo en cada ejecución.
 */

/** ESCENARIO 1 — Ideal: diagonal dominante, acoplamientos pequeños y de magnitud similar. */
const A_IDEAL = [
  [10, 2, 1, 0.5],
  [2, 12, 1.5, 1],
  [1, 1.5, 8, 0.5],
  [0.5, 1, 0.5, 9],
];
const B_IDEAL = [1490, 1505, 855, 905];

/**
 * ESCENARIO 2 — Bajo estrés: inflación/tipo de cambio.
 * Costos propios: +20 % (x1), +25 % (x2), +10 % (x3), +15 % (x4); acoplamientos +10 %.
 * Recursos disponibles: b = 0.92 · b_ideal (redondeado).
 */
const A_STRESS = [
  [12, 2.2, 1.1, 0.55],
  [2.2, 15, 1.65, 1.1],
  [1.1, 1.65, 8.8, 0.55],
  [0.55, 1.1, 0.55, 10.35],
];
const B_STRESS = [1371, 1385, 787, 833];

/**
 * ESCENARIO 3 — Mal condicionado por mal escalamiento: A = S C S con
 *   S = diag(2, 5, 20, 60)  (escalas de costo muy distintas entre áreas)
 *   C = 0.6 I + 0.4 · 11ᵀ   (correlación uniforme ρ = 0.4: factor macroeconómico común)
 * Así D^(-1/2) A D^(-1/2) = C y el mal condicionamiento proviene del escalamiento diagonal,
 * que es precisamente lo que corrige el precondicionador de Jacobi.
 */
const A_ILL = [
  [4, 4, 16, 48],
  [4, 25, 40, 120],
  [16, 40, 400, 480],
  [48, 120, 480, 3600],
];
const B_ILL = [5420, 14165, 67160, 316680];

export const SCENARIOS: FinancialScenario[] = [
  {
    id: 'ideal',
    name: 'Escenario Ideal',
    shortName: 'Ideal',
    A: A_IDEAL,
    b: B_IDEAL,
    x0: [0, 0, 0, 0],
    tolerance: 1e-6,
    maxIterations: 1000,
    preconditioner: 'jacobi',
    ssorOmega: 1,
    summary: 'Situación financiera estable y equilibrada: costos propios dominantes y acoplamientos moderados.',
    financialContext:
      'Cada área tiene un costo propio claramente mayor que su dependencia de las demás (a_ii ≫ |a_ij|). Los requerimientos b guardan proporción con el tamaño relativo de cada área. Las áreas se influyen poco entre sí, de modo que una pequeña variación en una de ellas apenas altera el reparto de las otras.',
    modelChanges: 'Escenario base: no hay perturbaciones respecto del modelo de referencia.',
    financialInterpretation:
      'Estabilidad presupuestaria: la matriz de costos es diagonalmente dominante y bien equilibrada, por lo que el reparto de presupuesto es robusto frente a pequeñas variaciones de los requerimientos y los métodos iterativos convergen sin dificultad.',
  },
  {
    id: 'estres',
    name: 'Bajo Estrés Financiero',
    shortName: 'Bajo Estrés',
    A: A_STRESS,
    b: B_STRESS,
    x0: [0, 0, 0, 0],
    tolerance: 1e-6,
    maxIterations: 1000,
    preconditioner: 'jacobi',
    ssorOmega: 1,
    summary: 'Inflación y encarecimiento de insumos importados con menor disponibilidad de recursos.',
    financialContext:
      'Se modela un episodio de inflación y presión cambiaria: los costos propios de las áreas con insumos importados (licencias y equipos) suben más que los de Marketing y Soporte, mientras que los recursos disponibles se reducen un 8 %.',
    modelChanges:
      'A: a11 +20 %, a22 +25 %, a33 +10 %, a44 +15 % y todos los acoplamientos +10 % (simétricos). b: cada requerimiento se multiplica por 0,92 (redondeado a entero). Las mismas cuatro variables, la misma estructura.',
    financialInterpretation:
      'Cada unidad presupuestaria rinde menos (costos mayores) y hay menos recursos: el punto de equilibrio se desplaza hacia asignaciones menores, con mayor caída en las áreas cuyo costo propio más aumentó. El cambio es multiplicativo y casi uniforme sobre la diagonal, por lo que afecta poco al condicionamiento: principalmente desplaza la solución en lugar de volver el problema más difícil numéricamente.',
  },
  {
    id: 'mal-condicionado',
    name: 'Mal Condicionado',
    shortName: 'Mal Condicionado',
    A: A_ILL,
    b: B_ILL,
    x0: [0, 0, 0, 0],
    tolerance: 1e-6,
    maxIterations: 1000,
    preconditioner: 'jacobi',
    ssorOmega: 1,
    summary: 'Escalas de costo muy dispares y un factor macroeconómico común que acopla a las cuatro áreas.',
    financialContext:
      'Los costos y requerimientos de las áreas están expresados en escalas muy distintas (por ejemplo, contratos de soporte y operaciones frente a horas de desarrollo), de modo que a_44 es cientos de veces mayor que a_11. Además, todas las áreas comparten un factor común (inflación/tipo de cambio) que introduce una correlación uniforme entre ellas.',
    modelChanges:
      'A = S·C·S con S = diag(2, 5, 20, 60) y C = 0,6·I + 0,4·11ᵀ. La estructura del modelo es la misma, pero la diferencia de escalas hace que los autovalores de A se separen en varios órdenes de magnitud.',
    financialInterpretation:
      'El mal escalamiento hace que una pequeña perturbación en datos de áreas de poco peso pueda amplificarse en la solución (sensibilidad numérica, acotada por κ(A)). El precondicionador de Jacobi reescala las ecuaciones por el costo propio de cada área y, al hacerlo, reduce de forma drástica el número de condición efectivo, lo que acelera la convergencia de GCP frente a GC.',
  },
];

export function getScenario(id: ScenarioId): FinancialScenario {
  const s = SCENARIOS.find((sc) => sc.id === id);
  if (!s) throw new Error(`Escenario desconocido: ${id}`);
  return s;
}
