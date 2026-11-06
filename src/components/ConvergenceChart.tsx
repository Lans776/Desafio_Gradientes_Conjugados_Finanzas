import type { SolverResult } from '../types';

interface Props {
  gc: SolverResult;
  gcp: SolverResult;
  tolerance: number;
}

const W = 640;
const H = 340;
const M = { top: 20, right: 24, bottom: 52, left: 70 };
const FLOOR = 1e-17;

/** Gráfico SVG propio (sin dependencias): residuo relativo vs iteración, eje Y logarítmico. */
export function ConvergenceChart({ gc, gcp, tolerance }: Props) {
  const toLog = (v: number) => Math.log10(Math.max(v, FLOOR));
  const series = [
    { name: 'GC', color: '#b45309', dash: '', data: gc.history.map((h) => ({ k: h.k, y: h.relativeResidual })) },
    {
      name: `GCP (${gcp.preconditioner ?? 'M'})`,
      color: '#1e3a8a',
      dash: '',
      data: gcp.history.map((h) => ({ k: h.k, y: h.relativeResidual })),
    },
  ];
  const maxK = Math.max(1, ...series.map((s) => s.data[s.data.length - 1].k));
  const allLogs = series.flatMap((s) => s.data.map((d) => toLog(d.y))).concat(toLog(tolerance));
  let yMax = Math.ceil(Math.max(...allLogs, 0));
  let yMin = Math.floor(Math.min(...allLogs));
  if (yMax - yMin < 2) yMin = yMax - 2;
  if (!Number.isFinite(yMax) || !Number.isFinite(yMin)) {
    yMax = 0;
    yMin = -10;
  }
  const iw = W - M.left - M.right;
  const ih = H - M.top - M.bottom;
  const px = (k: number) => M.left + (maxK === 0 ? 0 : (k / maxK) * iw);
  const py = (ly: number) => M.top + ((yMax - ly) / (yMax - yMin)) * ih;

  const yTicks: number[] = [];
  const step = Math.max(1, Math.ceil((yMax - yMin) / 8));
  for (let e = yMin; e <= yMax; e += step) yTicks.push(e);
  const xTicks: number[] = [];
  const xStep = Math.max(1, Math.ceil(maxK / 10));
  for (let k = 0; k <= maxK; k += xStep) xTicks.push(k);

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfico de convergencia del residuo relativo por iteración" className="chart-svg">
        <rect x={M.left} y={M.top} width={iw} height={ih} fill="#fff" stroke="#cbd5e1" />
        {yTicks.map((e) => (
          <g key={`y${e}`}>
            <line x1={M.left} x2={M.left + iw} y1={py(e)} y2={py(e)} stroke="#e2e8f0" />
            <text x={M.left - 8} y={py(e) + 4} textAnchor="end" fontSize="11" fill="#334155">
              {`1e${e}`}
            </text>
          </g>
        ))}
        {xTicks.map((k) => (
          <g key={`x${k}`}>
            <line x1={px(k)} x2={px(k)} y1={M.top + ih} y2={M.top + ih + 5} stroke="#64748b" />
            <text x={px(k)} y={M.top + ih + 18} textAnchor="middle" fontSize="11" fill="#334155">
              {k}
            </text>
          </g>
        ))}
        <line
          x1={M.left}
          x2={M.left + iw}
          y1={py(toLog(tolerance))}
          y2={py(toLog(tolerance))}
          stroke="#b91c1c"
          strokeDasharray="6 4"
        />
        <text x={M.left + iw - 4} y={py(toLog(tolerance)) - 5} textAnchor="end" fontSize="11" fill="#b91c1c">
          {`tolerancia ${tolerance.toExponential(0)}`}
        </text>
        {series.map((s) => (
          <g key={s.name}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth="2.2"
              points={s.data.map((d) => `${px(d.k)},${py(toLog(d.y))}`).join(' ')}
            />
            {s.data.map((d) => (
              <circle key={d.k} cx={px(d.k)} cy={py(toLog(d.y))} r="3.6" fill={s.color}>
                <title>{`${s.name} — k = ${d.k}, residuo relativo = ${d.y.toExponential(3)}`}</title>
              </circle>
            ))}
          </g>
        ))}
        <text x={M.left + iw / 2} y={H - 10} textAnchor="middle" fontSize="12" fill="#0f172a">
          Iteración k
        </text>
        <text
          transform={`translate(16 ${M.top + ih / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="12"
          fill="#0f172a"
        >
          Residuo relativo ‖r_k‖₂/‖b‖₂ (escala log)
        </text>
      </svg>
      <figcaption className="legend">
        {series.map((s) => (
          <span key={s.name} className="legend-item">
            <span className="legend-swatch" style={{ background: s.color }} /> {s.name}
          </span>
        ))}
        <span className="legend-item">
          <span className="legend-swatch" style={{ background: '#b91c1c' }} /> tolerancia
        </span>
      </figcaption>
      <p className="note">
        Los residuos menores que 1e-17 se dibujan en ese piso para poder usar escala logarítmica; las tablas muestran el valor real.
      </p>
    </figure>
  );
}
