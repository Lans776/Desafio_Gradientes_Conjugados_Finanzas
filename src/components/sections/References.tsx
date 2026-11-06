import { REFERENCES } from '../../data/references';
import { Section } from '../Section';

export function References() {
  return (
    <Section id="referencias" title="12. Referencias">
      <ol className="refs">
        {REFERENCES.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ol>
      <p className="note">
        Datos: ilustrativos y diseñados para este trabajo académico (no provienen de fuentes externas).
      </p>
    </Section>
  );
}
