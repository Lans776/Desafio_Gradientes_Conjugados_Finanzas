/** Tipos compartidos de la aplicación. */

export type Matrix = number[][];
export type Vector = number[];

export type PreconditionerKind = 'none' | 'jacobi' | 'ssor';
export type ScenarioId = 'ideal' | 'estres' | 'mal-condicionado';

/** Valores de entrada tal como se editan en la interfaz (texto, para admitir entradas inválidas). */
export interface RawInput {
  A: string[][];
  b: string[];
  x0: string[];
  tolerance: string;
  maxIterations: string;
  preconditioner: PreconditionerKind;
  ssorOmega: string;
}

/** Datos numéricos ya convertidos. */
export interface NumericInput {
  A: Matrix;
  b: Vector;
  x0: Vector;
  tolerance: number;
  maxIterations: number;
  preconditioner: PreconditionerKind;
  ssorOmega: number;
}

export interface FinancialScenario {
  id: ScenarioId;
  name: string;
  shortName: string;
  A: Matrix;
  b: Vector;
  x0: Vector;
  tolerance: number;
  maxIterations: number;
  preconditioner: PreconditionerKind;
  ssorOmega: number;
  summary: string;
  financialContext: string;
  modelChanges: string;
  financialInterpretation: string;
}

export interface ValidationMessage {
  level: 'error' | 'warning' | 'info';
  code: string;
  message: string;
}

export interface MatrixValidation {
  /** Forma correcta: A cuadrada, finita, b y x0 compatibles. */
  wellFormed: boolean;
  isSquare: boolean;
  isFinite: boolean;
  dimensionsOk: boolean;
  isSymmetric: boolean;
  /** Máxima asimetría |a_ij − a_ji| encontrada. */
  maxAsymmetry: number;
  isPositiveDefinite: boolean;
  /** Resultado de la prueba por Cholesky (intento de factorización). */
  choleskyOk: boolean;
  eigenvalues: number[];
  /** Menores principales líderes (criterio de Sylvester). */
  leadingMinors: number[];
  sylvesterOk: boolean;
  /** Válida para ejecutar GC/GCP. */
  validForCG: boolean;
  messages: ValidationMessage[];
}

export interface IterationData {
  /** Número de iteración (0 = estado inicial). */
  k: number;
  residualNorm: number;
  relativeResidual: number;
  /** Paso α aplicado para llegar a x_k (null en k = 0). */
  alpha: number | null;
  /** Coeficiente β usado para construir la siguiente dirección (null si no se calculó). */
  beta: number | null;
  x: Vector;
}

export type SolverStatus = 'converged' | 'max-iterations' | 'breakdown' | 'invalid';

export interface SolverResult {
  method: 'GC' | 'GCP';
  preconditioner: PreconditionerKind | null;
  x: Vector;
  iterations: number;
  converged: boolean;
  status: SolverStatus;
  statusMessage: string;
  finalResidualNorm: number;
  finalRelativeResidual: number;
  /** ‖b − A x‖₂ / ‖b‖₂ recalculado con el x final (residuo verdadero). */
  trueRelativeResidual: number;
  history: IterationData[];
  elapsedMs: number;
}

export interface DirectSolution {
  method: 'Cholesky';
  x: Vector;
  /** Factor triangular inferior L tal que A = L Lᵀ. */
  L: Matrix;
  /** ‖b − A x_ref‖₂ / ‖b‖₂ */
  relativeResidual: number;
  /** Diferencia máxima con una solución independiente por eliminación de Gauss. */
  gaussCrossCheck: number | null;
}

export interface ErrorRow {
  variable: string;
  reference: number;
  approx: number;
  absolute: number;
  /** null cuando x_ref_i = 0 (no definido). */
  relative: number | null;
  percent: number | null;
}

export interface ErrorAnalysis {
  rows: ErrorRow[];
  globalRelativeResidual: number | null;
  maxAbsolute: number;
  maxPercent: number | null;
}

export interface ConditionInfo {
  kappaA: number | null;
  lambdaMin: number | null;
  lambdaMax: number | null;
  kappaPrecond: number | null;
  precondLambdaMin: number | null;
  precondLambdaMax: number | null;
  precondEigenvalues: number[];
  note: string;
}

export interface PreconditionerInfo {
  kind: PreconditionerKind;
  label: string;
  description: string;
}

export interface AnalysisResult {
  ok: boolean;
  validation: MatrixValidation;
  paramMessages: ValidationMessage[];
  direct: DirectSolution | null;
  gc: SolverResult | null;
  gcp: SolverResult | null;
  errors: ErrorAnalysis | null;
  condition: ConditionInfo | null;
  preconditioner: PreconditionerInfo | null;
}

export interface ComparisonResult {
  scenario: FinancialScenario;
  analysis: AnalysisResult;
}

export type QAStatus = 'APROBADO' | 'FALLIDO';

export interface QAResult {
  id: string;
  name: string;
  input: string;
  expected: string;
  obtained: string;
  status: QAStatus;
}
