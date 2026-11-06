# Aplicación del Método de Gradientes Conjugados Precondicionado en la Asignación Presupuestaria

**Universidad Mayor de San Andrés · Facultad de Ciencias Puras y Naturales · Carrera de Informática · Métodos Numéricos**
Mención: Desarrollo de Sistemas · Modalidad: Individual · Autor: **[NOMBRE DEL ESTUDIANTE]**

## Descripción

Página web interactiva (SPA estática, sin backend) que modela un **simulador de asignación presupuestaria** de cuatro áreas
como un sistema lineal simétrico definido positivo `A·x = b` y lo resuelve con un método directo de referencia,
Gradientes Conjugados (GC) y Gradientes Conjugados Precondicionado (GCP), con análisis de errores, número de condición,
tres escenarios, edición interactiva de datos y un módulo de pruebas (QA) que se ejecuta de verdad.

## Objetivo

Modelar y resolver un problema financiero con GCP, analizando precisión, número de condición y velocidad de
convergencia en tres escenarios (ideal, bajo estrés y mal condicionado), según el desafío académico de la asignatura.

## Caso financiero

Unidad: **miles de bolivianos (miles de Bs)**. Datos ilustrativos, diseñados con fines académicos.

| Variable | Área |
|---|---|
| x1 | Desarrollo de Software |
| x2 | Infraestructura Tecnológica |
| x3 | Marketing |
| x4 | Soporte y Operaciones |

`a_ii` = costo/influencia propia del área *i*; `a_ij = a_ji` = interacción financiera recíproca entre *i* y *j*;
`b` = requerimientos ponderados de cada área.

## Métodos implementados (código propio, en `src/math`)

- **Cholesky** (`A = L·Lᵀ`) como solución numérica de referencia, con verificación cruzada por eliminación de Gauss.
- **Gradientes Conjugados** (`conjugateGradient.ts`) con historial por iteración (k, ‖r‖, residuo relativo, α, β, x_k).
- **Gradientes Conjugados Precondicionado** (`preconditionedCG.ts`): resuelve `M z = r` en cada iteración.
- **Precondicionadores** (`preconditioners.ts`): Jacobi (`M = diag(A)`), SSOR (ω configurable) y ninguno (`M = I`).
- **Autovalores** por Jacobi cíclico, κ₂(A) = λmax/λmin y κ₂(M⁻¹A) vía `L_M⁻¹ A L_M⁻ᵀ`.
- **Validaciones** (`validation.ts`): vacío, NaN/Infinity, no numérico, dimensiones, simetría, definición positiva
  (Cholesky + autovalores + Sylvester), tolerancia, máximo de iteraciones, diagonal cero, `b = 0`, ruptura numérica.

## Tecnologías

React 18 · Vite 5 · TypeScript (estricto). Gráfico de convergencia en SVG propio (sin librerías de gráficos).

## Requisitos

Node.js ≥ 18 y npm.

## Instalación, ejecución y build

```bash
npm install
npm run dev        # servidor de desarrollo
npm run build      # genera dist/
npm run preview    # sirve dist/ localmente
npm run typecheck  # comprobación de tipos
npm test           # tests unitarios (node:test + tsx)
```

## Estructura del proyecto

```
src/
  math/        vector, matrix, cholesky, lu, eigen, conditionNumber, conjugateGradient,
               preconditionedCG, preconditioners, validation, errors, analysis, __tests__/
  data/        scenarios.ts (los tres escenarios), student.ts (SU NOMBRE), variables.ts, references.ts
  qa/          qaTests.ts (las 4 pruebas obligatorias)
  components/  secciones de la página, editor de matriz, gráfico
  hooks/       useAnalysis (recálculo reactivo con debounce)
  utils/       formato numérico, ecuaciones dinámicas, línea base de escenarios
  types/       FinancialScenario, SolverResult, IterationData, MatrixValidation, ErrorAnalysis, QAResult, ComparisonResult…
```

**Para colocar su nombre:** edite `STUDENT.name` en `src/data/student.ts` (se muestra en la cabecera) y la línea «Autor» de este README.

## Los tres escenarios

1. **Ideal** — `A` diagonalmente dominante con acoplamientos pequeños; κ(A) ≈ 1,9; GC 4 y GCP (Jacobi) 4 iteraciones.
2. **Bajo estrés** — inflación: costos propios +20 %, +25 %, +10 %, +15 %; acoplamientos +10 %; recursos `b × 0,92`.
   κ(A) ≈ 2,05: el cambio desplaza la solución (total asignado menor) sin empeorar el condicionamiento.
3. **Mal condicionado** — `A = S·C·S`, `S = diag(2,5,20,60)`, `C = 0,6·I + 0,4·11ᵀ`. κ(A) ≈ 1265 y, con Jacobi,
   κ(M⁻¹A) ≈ 3,67 (el mal condicionamiento proviene del mal escalamiento diagonal). GC 4 vs GCP 2 iteraciones.

Las cifras anteriores son las obtenidas al ejecutar el código; la página las recalcula en cada carga.

## Descripción matemática resumida

GC minimiza `½xᵀAx − bᵀx` con direcciones A-conjugadas; GCP aplica GC al sistema equivalente con espectro más concentrado
resolviendo `M z_k = r_k`. Criterio de parada: `‖r_k‖₂/‖b‖₂ < tolerancia` (1e-6 por defecto). Con n = 4, GC termina
en a lo sumo 4 pasos en aritmética exacta, así que la mejora observable en iteraciones está acotada por ese tamaño.

## Pruebas QA

Módulo visible en la web (botón «Ejecutar pruebas QA») y tests de código (`npm test`):
QA-01 carga de escenarios · QA-02 matriz no válida · QA-03 edición dinámica · QA-04 comparación GCP ≤ GC en el escenario mal condicionado.

## Despliegue

`vite.config.ts` usa `base: './'`, por lo que `dist/` funciona sin cambios en:
- **Vercel / Netlify:** importar el repositorio; comando `npm run build`, directorio de salida `dist`.
- **GitHub Pages:** subir el contenido de `dist/` (p. ej. con una Action de Pages o a la rama `gh-pages`).

## Referencias

- Suñagua S., P. (2020). Método de Gradientes Conjugados Precondicionado. Revista Boliviana de Matemática – UMSA, 04, 2–7.
- Golub, G. H., & Van Loan, C. F. (2013). Matrix Computations (4th ed.). Johns Hopkins University Press.
- Saad, Y. (2003). Iterative Methods for Sparse Linear Systems (2nd ed.). SIAM.

---
Autor: **[NOMBRE DEL ESTUDIANTE]** — Universidad Mayor de San Andrés · Carrera de Informática · Métodos Numéricos
