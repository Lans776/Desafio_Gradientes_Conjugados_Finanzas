import { useEffect, useState } from 'react';
import { runQATests } from '../../qa/qaTests';
import type { QAResult } from '../../types';
import { Section } from '../Section';

export function QA() {
  const [results, setResults] = useState<QAResult[]>([]);
  const [ranAt, setRanAt] = useState<string | null>(null);

  const run = () => {
    setResults(runQATests());
    setRanAt(new Date().toLocaleTimeString('es-BO'));
  };
  useEffect(run, []);

  const passed = results.filter((r) => r.status === 'APROBADO').length;
  return (
    <Section id="qa" title="10. Módulo de Pruebas (QA)">
      <p>
        Las pruebas se ejecutan de verdad sobre el código matemático de la aplicación cada vez que se carga la sección o se
        pulsa el botón. Ninguna usa los datos que está editando en pantalla, por lo que no alteran su sesión.
      </p>
      <div className="button-row">
        <button type="button" className="btn" onClick={run}>
          Ejecutar pruebas QA
        </button>
        {ranAt ? (
          <span className="note">
            Última ejecución: {ranAt} — {passed}/{results.length} aprobadas
          </span>
        ) : null}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Caso de prueba</th>
              <th>Entrada</th>
              <th>Resultado esperado</th>
              <th>Resultado obtenido</th>
              <th>Conclusión</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>{r.id}</strong>
                  <br />
                  {r.name}
                </td>
                <td className="text-cell">{r.input}</td>
                <td className="text-cell">{r.expected}</td>
                <td className="text-cell">{r.obtained}</td>
                <td>
                  <span className={`badge ${r.status === 'APROBADO' ? 'badge-ok' : 'badge-bad'}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
