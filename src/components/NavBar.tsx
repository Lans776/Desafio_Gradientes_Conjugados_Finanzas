const LINKS: Array<[string, string]> = [
  ['inicio', 'Inicio'],
  ['caso', 'Caso de estudio'],
  ['formulacion', 'Formulación'],
  ['entrada', 'Entrada de datos'],
  ['escenarios', 'Escenarios'],
  ['resultados', 'Resultados'],
  ['gc-gcp', 'GC vs GCP'],
  ['errores', 'Errores'],
  ['comparacion', 'Comparación'],
  ['qa', 'QA'],
  ['conclusiones', 'Conclusiones'],
  ['referencias', 'Referencias'],
];

export function NavBar() {
  const go = (id: string) => (e: { preventDefault: () => void }) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <nav className="navbar" aria-label="Secciones">
      <ul>
        {LINKS.map(([id, label]) => (
          <li key={id}>
            <a href={`#${id}`} onClick={go(id)}>
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
