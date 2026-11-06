import { fmtCoef } from '../utils/format';

/** Presenta matrices/vectores con corchetes tipográficos. */
export function MatrixView({ data, label }: { data: number[][]; label?: string }) {
  return (
    <div className="matrix-view" aria-label={label}>
      {label ? <span className="matrix-label">{label} =</span> : null}
      <table className="bracket">
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {row.map((v, j) => (
                <td key={j}>{fmtCoef(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function VectorView({ data, label, symbols }: { data: number[] | string[]; label: string; symbols?: boolean }) {
  return (
    <div className="matrix-view">
      <span className="matrix-label">{label} =</span>
      <table className="bracket">
        <tbody>
          {data.map((v, i) => (
            <tr key={i}>
              <td>{symbols ? String(v) : typeof v === 'number' ? fmtCoef(v) : v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
