import type { ChangeEvent } from 'react';
import { parseNumber } from '../math/validation';
import type { PreconditionerKind, RawInput } from '../types';
import { PRECONDITIONER_LABELS } from '../math/preconditioners';
import { VARIABLES } from '../data/variables';

interface Props {
  raw: RawInput;
  onChange: (next: RawInput) => void;
}

function cellClass(text: string): string {
  const v = parseNumber(text);
  return v === null || !Number.isFinite(v) ? 'cell-input cell-invalid' : 'cell-input';
}

export function MatrixEditor({ raw, onChange }: Props) {
  const setA = (i: number, j: number, value: string) => {
    const A = raw.A.map((r) => r.slice());
    A[i][j] = value;
    onChange({ ...raw, A });
  };
  const setVec = (key: 'b' | 'x0', i: number, value: string) => {
    const v = raw[key].slice();
    v[i] = value;
    onChange({ ...raw, [key]: v });
  };
  const onNum = (fn: (v: string) => void) => (e: ChangeEvent<HTMLInputElement>) => fn(e.target.value);

  return (
    <div className="editor">
      <div className="editor-grid">
        <div>
          <h4>Matriz A (4×4)</h4>
          <table className="editor-table">
            <thead>
              <tr>
                <th />
                {VARIABLES.map((v) => (
                  <th key={v.symbol}>{v.symbol}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {raw.A.map((row, i) => (
                <tr key={i}>
                  <th>{`Ec. ${i + 1}`}</th>
                  {row.map((c, j) => (
                    <td key={j}>
                      <input
                        className={cellClass(c)}
                        value={c}
                        inputMode="decimal"
                        aria-label={`a${i + 1}${j + 1}`}
                        onChange={onNum((v) => setA(i, j, v))}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h4>Vector b</h4>
          <table className="editor-table">
            <tbody>
              {raw.b.map((c, i) => (
                <tr key={i}>
                  <th>{`b${i + 1}`}</th>
                  <td>
                    <input
                      className={cellClass(c)}
                      value={c}
                      inputMode="decimal"
                      aria-label={`b${i + 1}`}
                      onChange={onNum((v) => setVec('b', i, v))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h4>Vector inicial x0</h4>
          <table className="editor-table">
            <tbody>
              {raw.x0.map((c, i) => (
                <tr key={i}>
                  <th>{`x0_${i + 1}`}</th>
                  <td>
                    <input
                      className={cellClass(c)}
                      value={c}
                      inputMode="decimal"
                      aria-label={`x0_${i + 1}`}
                      onChange={onNum((v) => setVec('x0', i, v))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="params">
        <label>
          Tolerancia
          <input
            className={cellClass(raw.tolerance)}
            value={raw.tolerance}
            inputMode="decimal"
            onChange={onNum((v) => onChange({ ...raw, tolerance: v }))}
          />
        </label>
        <label>
          Máx. iteraciones
          <input
            className={cellClass(raw.maxIterations)}
            value={raw.maxIterations}
            inputMode="numeric"
            onChange={onNum((v) => onChange({ ...raw, maxIterations: v }))}
          />
        </label>
        <label>
          Precondicionador (GCP)
          <select
            value={raw.preconditioner}
            onChange={(e) => onChange({ ...raw, preconditioner: e.target.value as PreconditionerKind })}
          >
            {(Object.keys(PRECONDITIONER_LABELS) as PreconditionerKind[]).map((k) => (
              <option key={k} value={k}>
                {PRECONDITIONER_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        {raw.preconditioner === 'ssor' ? (
          <label>
            ω de SSOR (0 &lt; ω &lt; 2)
            <input
              className={cellClass(raw.ssorOmega)}
              value={raw.ssorOmega}
              inputMode="decimal"
              onChange={onNum((v) => onChange({ ...raw, ssorOmega: v }))}
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}
