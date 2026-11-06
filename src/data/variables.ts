/** Variables del modelo. Unidad consistente en toda la aplicación: miles de bolivianos (miles de Bs). */
export const BUDGET_UNIT = 'miles de Bs';

export interface BudgetVariable {
  symbol: string;
  short: string;
  name: string;
  meaning: string;
}

export const VARIABLES: BudgetVariable[] = [
  {
    symbol: 'x1',
    short: 'Desarrollo',
    name: 'Desarrollo de Software',
    meaning: 'Asignación presupuestaria para el área de desarrollo de software (salarios, licencias, herramientas).',
  },
  {
    symbol: 'x2',
    short: 'Infraestructura',
    name: 'Infraestructura Tecnológica',
    meaning: 'Asignación presupuestaria para servidores, redes, nube y equipamiento.',
  },
  {
    symbol: 'x3',
    short: 'Marketing',
    name: 'Marketing',
    meaning: 'Asignación presupuestaria para promoción, publicidad y posicionamiento de los productos.',
  },
  {
    symbol: 'x4',
    short: 'Soporte',
    name: 'Soporte y Operaciones',
    meaning: 'Asignación presupuestaria para atención al usuario, mantenimiento y operación continua.',
  },
];
