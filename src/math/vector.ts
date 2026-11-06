import type { Matrix, Vector } from '../types';

/** Producto punto xᵀy. */
export function dot(x: Vector, y: Vector): number {
  if (x.length !== y.length) throw new RangeError('dot: dimensiones incompatibles');
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * y[i];
  return s;
}

/** Norma euclídea ‖x‖₂, con escalado para evitar desbordes intermedios. */
export function norm2(x: Vector): number {
  let scale = 0;
  for (const v of x) scale = Math.max(scale, Math.abs(v));
  if (scale === 0 || !Number.isFinite(scale)) return scale;
  let s = 0;
  for (const v of x) {
    const t = v / scale;
    s += t * t;
  }
  return scale * Math.sqrt(s);
}

/** Producto matriz-vector A·x. */
export function matVec(A: Matrix, x: Vector): Vector {
  const n = A.length;
  const y = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (A[i].length !== x.length) throw new RangeError('matVec: dimensiones incompatibles');
    let s = 0;
    for (let j = 0; j < x.length; j++) s += A[i][j] * x[j];
    y[i] = s;
  }
  return y;
}

export function add(x: Vector, y: Vector): Vector {
  return x.map((v, i) => v + y[i]);
}

export function sub(x: Vector, y: Vector): Vector {
  return x.map((v, i) => v - y[i]);
}

/** a·x */
export function scale(a: number, x: Vector): Vector {
  return x.map((v) => a * v);
}

/** x + a·y (axpy) */
export function axpy(a: number, y: Vector, x: Vector): Vector {
  return x.map((v, i) => v + a * y[i]);
}

export function zeros(n: number): Vector {
  return new Array<number>(n).fill(0);
}

/** Residuo r = b − A·x */
export function residual(A: Matrix, b: Vector, x: Vector): Vector {
  return sub(b, matVec(A, x));
}
