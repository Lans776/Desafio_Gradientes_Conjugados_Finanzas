import type { Matrix, MatrixValidation, NumericInput, RawInput, ValidationMessage, Vector } from '../types';
import { cholesky } from './cholesky';
import { leadingPrincipalMinors, symmetricEigenvalues } from './eigen';
import { allFinite, isSquare, isSymmetric, maxAbsEntry, maxAsymmetry } from './matrix';

const SYM_TOL = 1e-10;

/** Convierte un texto en número. Acepta coma decimal. Devuelve null si no es numérico. */
export function parseNumber(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (t === '') return null;
  // Rechaza formatos que Number() aceptaría pero no son números decimales claros (hex, etc.)
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t) && !/^[+-]?(Infinity|NaN)$/i.test(t)) return null;
  return Number(t);
}

export interface ParseResult {
  numeric: NumericInput | null;
  messages: ValidationMessage[];
}

/** Convierte la entrada textual del formulario en datos numéricos, reportando cada problema. */
export function parseRawInput(raw: RawInput): ParseResult {
  const messages: ValidationMessage[] = [];
  let bad = false;

  const parseCell = (text: string, label: string): number => {
    const v = parseNumber(text);
    if (v === null) {
      messages.push({
        level: 'error',
        code: text.trim() === '' ? 'EMPTY_VALUE' : 'NON_NUMERIC',
        message:
          text.trim() === ''
            ? `${label} está vacío: ingrese un número.`
            : `${label} = "${text}" no es un valor numérico.`,
      });
      bad = true;
      return NaN;
    }
    if (!Number.isFinite(v)) {
      messages.push({
        level: 'error',
        code: 'NON_FINITE',
        message: `${label} = "${text}" no es un número finito (NaN o Infinity).`,
      });
      bad = true;
      return NaN;
    }
    return v;
  };

  if (raw.A.length === 0) {
    messages.push({ level: 'error', code: 'EMPTY_MATRIX', message: 'La matriz A está vacía.' });
    return { numeric: null, messages };
  }

  const A: Matrix = raw.A.map((row, i) => row.map((c, j) => parseCell(c, `a${i + 1}${j + 1}`)));
  const b: Vector = raw.b.map((c, i) => parseCell(c, `b${i + 1}`));
  const x0: Vector = raw.x0.map((c, i) => parseCell(c, `x0_${i + 1}`));
  const tolerance = parseCell(raw.tolerance, 'La tolerancia');
  const maxIterations = parseCell(raw.maxIterations, 'El máximo de iteraciones');
  const ssorOmega = raw.preconditioner === 'ssor' ? parseCell(raw.ssorOmega, 'El parámetro ω') : 1;

  if (bad) return { numeric: null, messages };
  return {
    numeric: {
      A,
      b,
      x0,
      tolerance,
      maxIterations,
      preconditioner: raw.preconditioner,
      ssorOmega,
    },
    messages,
  };
}

/** Valida los parámetros del algoritmo (tolerancia y máximo de iteraciones). */
export function validateParameters(tolerance: number, maxIterations: number, bNorm: number | null): ValidationMessage[] {
  const out: ValidationMessage[] = [];
  if (!Number.isFinite(tolerance) || tolerance <= 0) {
    out.push({ level: 'error', code: 'BAD_TOLERANCE', message: 'La tolerancia debe ser un número mayor que 0.' });
  } else if (tolerance >= 1) {
    out.push({
      level: 'warning',
      code: 'LARGE_TOLERANCE',
      message: 'Una tolerancia ≥ 1 detiene el algoritmo casi de inmediato; los resultados serán muy poco precisos.',
    });
  }
  if (!Number.isFinite(maxIterations) || maxIterations <= 0) {
    out.push({
      level: 'error',
      code: 'BAD_MAX_ITER',
      message: 'El máximo de iteraciones debe ser un entero mayor que 0.',
    });
  } else if (!Number.isInteger(maxIterations)) {
    out.push({
      level: 'error',
      code: 'BAD_MAX_ITER',
      message: 'El máximo de iteraciones debe ser un número entero.',
    });
  }
  if (bNorm === 0) {
    out.push({
      level: 'warning',
      code: 'ZERO_B',
      message:
        'El vector b es nulo: ‖b‖₂ = 0, por lo que el residuo relativo no está definido. Se usa el residuo absoluto ‖r‖₂ como criterio y la solución esperada es x = 0.',
    });
  }
  return out;
}

/**
 * Valida el sistema Ax = b: forma, finitud, compatibilidad de dimensiones,
 * simetría y definición positiva (Cholesky + autovalores + criterio de Sylvester).
 */
export function validateSystem(A: Matrix, b: Vector, x0: Vector): MatrixValidation {
  const messages: ValidationMessage[] = [];
  const empty: MatrixValidation = {
    wellFormed: false,
    isSquare: false,
    isFinite: false,
    dimensionsOk: false,
    isSymmetric: false,
    maxAsymmetry: 0,
    isPositiveDefinite: false,
    choleskyOk: false,
    eigenvalues: [],
    leadingMinors: [],
    sylvesterOk: false,
    validForCG: false,
    messages,
  };

  if (A.length === 0 || A.every((r) => r.length === 0)) {
    messages.push({ level: 'error', code: 'EMPTY_MATRIX', message: 'La matriz A está vacía.' });
    return empty;
  }
  const square = isSquare(A);
  if (!square) {
    messages.push({
      level: 'error',
      code: 'NOT_SQUARE',
      message: `A debe ser cuadrada; las dimensiones recibidas son ${A.length}×${A[0]?.length ?? 0} (o filas de distinta longitud).`,
    });
  }
  const finite = allFinite(A) && allFinite(b) && allFinite(x0);
  if (!finite) {
    messages.push({
      level: 'error',
      code: 'NON_FINITE',
      message: 'Existen valores NaN o Infinity en A, b o x0.',
    });
  }
  const n = A.length;
  const dimsOk = square && b.length === n && x0.length === n;
  if (square && b.length !== n) {
    messages.push({
      level: 'error',
      code: 'DIM_B',
      message: `El vector b tiene ${b.length} componentes pero A es ${n}×${n}.`,
    });
  }
  if (square && x0.length !== n) {
    messages.push({
      level: 'error',
      code: 'DIM_X0',
      message: `El vector inicial x0 tiene ${x0.length} componentes pero A es ${n}×${n}.`,
    });
  }
  const wellFormed = square && finite && dimsOk;
  if (!wellFormed) {
    return { ...empty, isSquare: square, isFinite: finite, dimensionsOk: dimsOk, messages };
  }

  const asym = maxAsymmetry(A);
  const symmetric = isSymmetric(A, SYM_TOL);
  if (!symmetric) {
    messages.push({
      level: 'error',
      code: 'NOT_SYMMETRIC',
      message: `A no es simétrica: la mayor diferencia |a_ij − a_ji| es ${asym.toExponential(3)}. GC/GCP exigen A = Aᵀ.`,
    });
  }

  // Evidencia espectral: sobre A si es simétrica; si no, sobre su parte simétrica (solo informativa).
  const sym = A.map((row, i) => row.map((v, j) => 0.5 * (v + A[j][i])));
  const eigenvalues = symmetricEigenvalues(sym);
  const minors = leadingPrincipalMinors(sym);
  const scale = Math.max(maxAbsEntry(A), Number.MIN_VALUE);
  const eigTol = 1e-12 * scale;
  const eigOk = eigenvalues.every((l) => l > eigTol);
  const sylOk = minors.every((m) => m > 0);
  const chol = cholesky(sym);

  let positiveDefinite = chol.ok && eigOk;
  if (symmetric) {
    if (!positiveDefinite) {
      const lmin = eigenvalues[0];
      messages.push({
        level: 'error',
        code: 'NOT_PD',
        message: `A no es definida positiva: su menor autovalor es λmin = ${lmin.toExponential(3)} (≤ 0)${
          chol.ok ? '' : ' y la factorización de Cholesky falló en el pivote ' + ((chol.failedAt ?? 0) + 1)
        }. GC/GCP requieren xᵀAx > 0 para todo x ≠ 0.`,
      });
    }
  } else {
    positiveDefinite = false;
  }

  const validForCG = symmetric && positiveDefinite;
  return {
    wellFormed,
    isSquare: square,
    isFinite: finite,
    dimensionsOk: dimsOk,
    isSymmetric: symmetric,
    maxAsymmetry: asym,
    isPositiveDefinite: positiveDefinite,
    choleskyOk: chol.ok,
    eigenvalues,
    leadingMinors: minors,
    sylvesterOk: sylOk,
    validForCG,
    messages,
  };
}
