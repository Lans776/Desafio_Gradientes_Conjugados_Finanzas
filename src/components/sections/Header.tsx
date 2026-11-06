import { INSTITUTION, PROJECT_TITLE, STUDENT } from '../../data/student';

export function Header() {
  return (
    <header id="inicio" className="hero">
      <p className="hero-inst">{INSTITUTION.university}</p>
      <p>{INSTITUTION.faculty}</p>
      <p>{INSTITUTION.career}</p>
      <p>{INSTITUTION.course}</p>
      <h1>{PROJECT_TITLE}</h1>
      <dl className="hero-meta">
        <div>
          <dt>Estudiante</dt>
          <dd>{STUDENT.name}</dd>
        </div>
        <div>
          <dt>Mención</dt>
          <dd>{STUDENT.mention}</dd>
        </div>
        <div>
          <dt>Modalidad</dt>
          <dd>{STUDENT.modality}</dd>
        </div>
      </dl>
      <p className="hero-sum">
        Simulador de asignación presupuestaria con cuatro áreas (n = 4). El sistema simétrico definido positivo A·x = b se
        resuelve con un método directo de referencia (Cholesky), Gradientes Conjugados (GC) y Gradientes Conjugados
        Precondicionado (GCP), en tres escenarios: ideal, bajo estrés financiero y mal condicionado.
      </p>
    </header>
  );
}
