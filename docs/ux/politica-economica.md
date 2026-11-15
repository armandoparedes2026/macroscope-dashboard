# Política económica — octava experiencia

Ruta: `#politica-economica`. Acceso desde la tarjeta 08 de Inicio, cabecera, búsqueda y menú móvil. Conserva los siete destinos anteriores, sus alias y el gesto táctil del carrusel; la profundidad orbital admite ocho tarjetas, incluida la posición antipodal.

## Funcionalidad real

- **Fundamentos (entrada predeterminada):** definición de política económica como decisiones, reglas y actuaciones de autoridades públicas orientadas a objetivos de bienestar. Se organiza mediante seis componentes: objetivos, instrumentos, instituciones, transmisión, restricciones y evaluación. Es una síntesis pedagógica, no una clasificación oficial única.
- **Mapa de ámbitos:** fiscal; monetario; cambiario y externo; comercial; financiero y macroprudencial; productivo y estructural; social, laboral y distributivo; ambiental y de recursos. No son ámbitos excluyentes ni exhaustivos. Cada ficha explica finalidad, instrumentos, autoridades, canales, tensiones y alcance real en Macroscope.
- **Exploración por objetivos:** estabilidad de precios, actividad/empleo, productividad/desarrollo, equidad/protección y sostenibilidad/resiliencia. El selector marca ámbitos relacionados sin recomendar políticas ni alterar el paquete o sus parámetros. Las acciones llevan al modelo parcial disponible o a la guía de evaluación.
- **Diseño y evaluación:** diagnóstico → diseño → implementación → evaluación/ajuste. Se distinguen pertinencia, coherencia, eficacia, eficiencia, impacto y sostenibilidad, junto con distribución y atribución causal. Observar un cambio temporal no demuestra que lo causó una política.
- **Comercio y bienestar:** arancel ad valorem y específico, subsidio unitario a producción, costo real unitario de cumplimiento y cuota cuantitativa, combinables. La renta de cuota se asigna a licenciatarios nacionales, subasta pública o beneficiarios extranjeros. Se pueden variar precio mundial y pendientes de oferta/demanda.
- **Resultados:** precio consumidor/productor, producción, consumo, importaciones, excedentes, recaudación, costo de subsidio, rentas y bienestar nacional. Gráfico oferta/demanda, distribución y contabilidad completa. Botón de ampliación y gráficos desplazables horizontalmente en móvil para conservar legibilidad.
- **Paquetes:** comparación de base/A/B, edición de cada alternativa, guardado/carga/borrado local (máximo veinte paquetes), CSV de resultados/parámetros y JSON con metodología y fuentes. Los paquetes conservan su estructura: comparar contextos diferentes también modifica los resultados.
- **Mezcla macroeconómica:** usa `MacroScope.ISLM.createModel`, sin modificar el motor existente. Combina ΔG, ΔT autónomo y ΔM/M con movilidad de capitales y regímenes flexible/fijo/cerrado. Muestra E0/E1/E2 y advierte que en tipo fijo M es endógena. Base explícitamente ilustrativa: Y0=100, i0=4 %, e0=100.
- **Biblioteca:** doce instrumentos con filtros. Cuatro son operativos en comercio; cuatro usan el motor macro; cuatro fichas son conceptuales. No se presentan regulación de competencia, compras públicas, medidas sanitarias o represalias como simulaciones resueltas.
- **Casos:** predicción evaluada sobre arancel/subsidio, comparación de asignación de rentas y paquete combinado; enlaces funcionales al simulador y metodología.

No hay datos económicos oficiales inventados ni APIs nuevas. Todos los valores son ejercicios teóricos. El panel macro y el sectorial están separados: no existe conversión automática de un arancel en NX, PBI o inflación agregada.

## Modelo sectorial y contabilidad

País pequeño importador, competencia perfecta y bien homogéneo. Pw es exógeno, en unidades monetarias ilustrativas (UM) por unidad. Las cantidades son unidades del bien; los excedentes y presupuestos son UM.

`Qd(Pc) = max(0, aD − bD·Pc)` y `Qs(Pc+s) = max(0, aS + bS·(Pc+s))`.

Base: aD=160, bD=1, aS=−20, bS=1, Pw=50. Entonces Qd=110, Qs=30, M=80, CS=6050, PS=450 y W=6500.

La frontera, antes de rentas de cuota, cuesta `Pw·(1+tarifa/100) + arancelEspecífico + costoReal`. Sin cuota vinculante y con importaciones, Pc iguala ese costo. Si una cuota vincula, se resuelve `Qd(Pc) − Qs(Pc+s) = cuota`. Una búsqueda monótona acotada conserva la esquina de oferta cero. Si la frontera es prohibitiva o la cuota es cero, Pc queda limitado por el precio autárquico. Se rechazan bases exportadoras y subsidios que llevarían a exportar al precio mundial: son otro modelo.

La prima de cuota es `max(0, Pc − costoFrontera)` cuando la cuota vincula; la renta multiplica esa prima por las importaciones efectivas. Recaudación arancelaria: arancel unitario × M. Costo de subsidio: s × Qs. El saldo fiscal suma aranceles y subasta, y resta subsidio.

`W = CS + PS + saldoFiscal + rentaPrivadaNacional`. La renta extranjera queda fuera del bienestar nacional. El costo real no es recaudación. Los excedentes y las distorsiones se obtienen integrando demanda y costo marginal, conservando las esquinas:

`ΔW = −pérdidaConsumo −pérdidaProducción −costoReal·M −rentaExtranjera`.

La igualdad se verifica en una grilla de combinaciones y con soluciones numéricas independientes. No incluye externalidades, beneficios regulatorios, poder de mercado, costos marginales de fondos públicos, empleo agregado, represalias, términos de intercambio de país grande ni dinámica temporal. Por ello, una pérdida calculada en el modelo competitivo no demuestra que una norma sanitaria o toda intervención real sea perjudicial.

## Arquitectura y contratos

- `js/ui/policy-foundations.js`: contenido y render de fundamentos, fuentes de cada ámbito, exploración objetivo/ámbito y enlaces hacia los paneles existentes. API `policyFoundationsHTML()` / `setupPolicyFoundations(root, navigate)`. No contiene ni modifica motores económicos.
- `js/policy-model.js`: API pura `MacroScope.Policy.solve(input)`, constantes de parámetros, escenarios, instrumentos y fuentes. No requiere DOM.
- `js/ui/policy.js`: estado de controles, paquetes, lectura, SVGs, diálogo accesible, casos y mezcla macro. `setupPolicy()` inicializa una vez; `policySnapshot()` expone un resumen para verificaciones.
- `css/policy.css`: estilos aislados de la experiencia. Sin framework ni dependencias nuevas.
- Scripts clásicos con `defer`, espacio `globalThis.MacroScope`, apertura directa `file://` y rutas hash. El motor `js/islm-model.js` queda intacto.
- Persistencia `macroscope_policy_packages_v1`: se valida la versión y cada escenario al cargar. Si falla almacenamiento, el escenario sigue en memoria y se comunica el límite.

## Fuentes

El marco general precede a los modelos. Se apoya en:

- [BCRP — cartilla educativa de política económica](https://www.bcrp.gob.pe/docs/Proyeccion-Institucional/sala-economia/cartillas/cartilla-profesores-3-secundaria.pdf): definición introductoria y pilares fiscal/monetario de la estabilidad macroeconómica.
- [BCRP — finalidad, autonomía y funciones](https://www.bcrp.gob.pe/docs/Transparencia/Organizacion/Organigrama/rof-bcrp.pdf): contexto institucional peruano. No se asigna a un banco central toda la política económica.
- [FMI — política fiscal](https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/fiscal-policy) y [monetaria](https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/monetary-policy): objetivos, instrumentos, canales, horizontes y límites.
- [FMI — políticas estructurales](https://www.imf.org/external/pubs/ft/fandd/basics/24_strucutral-policies.htm) y [macroprudenciales](https://www.imf.org/external/pubs/ft/fandd/basics/macropru.htm): capacidad productiva e instituciones frente a estabilidad sistémica. Los artículos se verificaron mediante resultados indexados; el acceso automatizado directo a la antigua URL estructural respondió 403.
- [OCDE — finanzas públicas y desigualdad](https://www.oecd.org/en/publications/public-finance-economic-growth-and-inequality_094bdaa5-en.html) e [instrumentos ambientales](https://www.oecd.org/en/topics/policy-issues/environmental-policies-and-evaluation.html): ámbitos distributivo y ambiental.
- [OCDE — criterios de evaluación](https://www.oecd.org/en/publications/applying-evaluation-criteria-thoughtfully_543e84ed-en.html): preguntas para evaluar intervenciones, sin convertirlas en una regla automática de elección de políticas.

Referencias específicas de los simuladores:

- [FAO — Instruments of Protection and their Economic Impact](https://www.fao.org/4/x7352e/X7352E03.htm): marco de equilibrio parcial y distribución. Las ecuaciones de esta implementación se documentan arriba.
- [UNCTAD — Non-tariff measures from A to Z](https://unctad.org/publication/non-tariff-measures-z): contexto de medidas no arancelarias y objetivos públicos. La publicación estaba indexada; su servidor restringió la lectura automatizada (403).
- [OMC — Restricciones cuantitativas](https://www.wto.org/english/tratop_e/markacc_e/qr_e.htm): definiciones y contexto institucional; la app no evalúa cumplimiento jurídico ni excepciones.
- [BCRP — Reportes de inflación](https://www.bcrp.gob.pe/publicaciones/reporte-de-inflacion.html): referencia institucional para explorar la política monetaria; la calibración macro de este módulo es ilustrativa.

## Verificación reproducible

`node --test tests/policy-model.test.mjs`: soluciones de libre comercio, tarifa20 %, cuotas, subsidio, costos reales, prohibición, combinaciones, identidades y validación.

`node tests/policy-e2e.mjs`: ruta y octava tarjeta, combinación, guardado/carga, exportación, zoom/foco, macro, filtros, caso calificado y capturas en1440/1672/390/360 claro/oscuro.

La prueba verifica además que la entrada abre Fundamentos, que los ocho ámbitos muestran fuente y alcance, que objetivos/ámbitos funcionan, que los enlaces llevan al panel correcto, que la evaluación recibe foco, que las pestañas se recorren por teclado y que leer fundamentos conserva el paquete configurado. El estado anterior produjo el fallo esperado «La entrada debe explicar la política económica antes de simular» antes de incorporar la mejora.

`npm test` integra las dos pruebas anteriores, `tests/lab-stages.mjs`, las pruebas existentes del proyecto y `tests/landing-touch.mjs` ampliado a ocho tarjetas. La evidencia se genera en `test-results/policy-*` y se publica una selección en `docs/evidence/politica-economica/`.

Safari/iOS y hardware móvil físico no están verificados. La emulación táctil corresponde a Chromium/CDP.

## Capturas

[Fundamentos — escritorio](../evidence/politica-economica/fundamentos-escritorio.png) · [Fundamentos — móvil](../evidence/politica-economica/fundamentos-movil.png) · [Fundamentos — oscuro](../evidence/politica-economica/fundamentos-oscuro.png).

[Tarjeta en Inicio](../evidence/politica-economica/inicio.png) · [Comercio y bienestar](../evidence/politica-economica/comercio.png) · [Paquetes](../evidence/politica-economica/paquetes.png) · [Mezcla macro](../evidence/politica-economica/mezcla-macro.png) · [Instrumentos](../evidence/politica-economica/instrumentos.png) · [Móvil](../evidence/politica-economica/movil.png) · [Oscuro](../evidence/politica-economica/oscuro.png).
