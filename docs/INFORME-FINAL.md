# MacroScope — Informe final de la reestructuración

Coordinador: Claude Code. Fecha: 2026-10-18. Run de Orca: `run_1622e46c2cf5`.
Rama integrada para revisión: **`feature/ui-premium`** (contiene todas las demás). Base: `origin/main` 7631444.
Nada se ha fusionado con `main`, publicado (`push`) ni desplegado.

Documentos complementarios:
[auditoría económica](auditoria-economica.md) (entregable B) ·
[diagnóstico inicial](diagnostico-inicial.md) ·
[arquitectura](arquitectura.md) ·
[fuentes WDI](fuentes-wdi.md) · [fuentes BCRP](fuentes-bcrp.md) ·
evidencias en `docs/evidence/{fase1,fase-modularizacion,fase3,fase4,fase5}/`.

---

## G. Resumen ejecutivo

**Qué cambió**

1. **Rigor económico.** El motor IS–LM–BP distingue la balanza de bienes y servicios (NX, parte del PBI)
   de la cuenta corriente (CA = NX + renta primaria y secundaria). Antes se usaba la CA como NX: para Perú
   2025 eso subestimaba NX en ≈ 4,5 pp del PBI (NX = +8,1 %, CA = +3,6 %). La propensión a importar se
   deriva de las importaciones observadas (antes, de las exportaciones con un factor 0,8 arbitrario). Cada
   magnitud se etiqueta como dato observado, parámetro calibrado, supuesto, valor ilustrativo o resultado.
   Se corrigió el impacto (E₁) del régimen fijo ante una expansión monetaria.
2. **Laboratorio en una sola pestaña** con panel de parámetros, cuatro diagramas animados (IS–LM–BP,
   IS*–LM*, mercado de dinero, cruz keynesiana), tabla E₀/E₁/E₂ con unidades correctas (pp para tasas),
   multiplicadores, transmisión paso a paso, comparación A/B y de regímenes, y capas visibles.
3. **Pedagogía**: tres niveles (introductorio, intermedio, avanzado), 6 escenarios guiados
   (problema → predicción → simulación → mecanismo → contraste), glosario y 14 referencias reales.
   Una prueba automatizada impide que el texto teórico contradiga al modelo; detectó y corrigió un error
   del propio contenido (shock de precios de exportación bajo flotación).
4. **Datos**: conector WDI con paginación, último año real por serie, nulos visibles, reintentos, caché
   de 24 h y actualización manual; respaldo local **regenerado por script** desde la API (antes transcrito
   a mano, con 11 cifras de cuenta corriente de LCN sin fuente, ya eliminadas); integración **BCRP** vía
   función serverless (4 series verificadas).
5. **Comparador**: 19 economías (12 nuevas), hasta 4 simultáneas, años comunes, ausencias visibles,
   normalización solo para niveles, crecimiento acumulado y convergencia PPA.
6. **Correcciones**: «Explorar análisis» ya no deja el destino oculto bajo la barra fija (causa raíz:
   `scrollIntoView` sin compensar los elementos *sticky*); insignia recortada en móvil; reposicionamiento
   como «Laboratorio Interactivo de Economía Aplicada».
7. **Ingeniería**: `index.html` pasó de ~1 800 a ~215 líneas; CSS y JS en 17 archivos (scripts clásicos,
   sin frameworks ni dependencias nuevas). Pruebas: de 11 + 14 a **42 unitarias + 35 e2e**.

**Qué funciona (con evidencia)**: `npm test` completo en verde (`docs/evidence/fase5/npm-test.txt`);
sin desbordamiento horizontal ni controles sin nombre accesible a 360/390/768/1440 px; números del
laboratorio contrastados a mano con las fórmulas cerradas (ver §E).

**Qué queda pendiente** — ver §H.

**Qué debe aprobar para publicar** — ver §I.

---

## C. Inventario de fuentes

| Fuente | Acceso | Series / códigos | Países | Frecuencia | Cobertura | Transformación | Comprobación (2026-10-18) |
|---|---|---|---|---|---|---|---|
| Banco Mundial WDI | `https://api.worldbank.org/v2/` directo desde el navegador (CORS `*`) | NY.GDP.MKTP.KD.ZG, FP.CPI.TOTL.ZG, SL.UEM.TOTL.ZS, NY.GDP.PCAP.CD, NY.GDP.PCAP.PP.KD, NE.EXP.GNFS.ZS, NE.IMP.GNFS.ZS, NE.RSB.GNFS.ZS, BN.CAB.XOKA.GD.ZS | 18 países + LCN | Anual | 2014–2025; ver huecos abajo | Ninguna sobre el dato; comparador: índice base 100 (solo niveles), crecimiento acumulado Π(1+g) − 1, PPA relativo a EE. UU. | Respuestas reales, cabeceras CORS, `pages`, definiciones oficiales (`/v2/indicator`) — detalle en `fuentes-wdi.md` |
| BCRPData | `https://estadisticas.bcrp.gob.pe/estadisticas/series/api/` vía `api/bcrp.js` (Vercel) | PD04722MM tasa de referencia (%); PN01273PM IPC Lima var. 12 m (%); PN01207PM TC interbancario promedio (S/ por US$); PN00027MM RIN (millones US$) | Perú | Mensual | Hasta oct./sep. 2026 | `"n.d."` → null; periodo → fecha | 200 OK, **sin** `Access-Control-Allow-Origin` (de ahí el proxy), `Content-Type: text/html`, sufijo PHP ocasional; PN01288PM descontinuada (excluida) — `fuentes-bcrp.md` |
| Open ER API | `https://open.er-api.com/v6/latest/USD` | Tipos de cambio indicativos (PEN, CLP, COP, MXN, BRL, EUR) | 6 monedas | Diaria | Último | Ninguna | Agregador no oficial: etiquetado como indicativo |
| Supuestos del simulador | — | Meta de inflación por banco central (6 países), tasa real neutral ilustrativa, i* = 3 %, ε_Y = 1, parámetros didácticos | — | — | — | — | Etiquetados en la UI; sin fuente empírica propia (auditoría §5) |

Huecos verificados en WDI: Argentina IPC 2014–2017 y 2025; Bolivia y Japón comercio exterior hasta 2024;
EE. UU. IPC y comercio exterior hasta 2024; LCN sin cuenta corriente en ningún año. Se muestran como
«sin dato», nunca como 0 ni interpolados.

**Fuentes evaluadas y no integradas**: FMI, OCDE, INEI y FRED. Ninguna fue necesaria para los indicadores
actuales (WDI ya los cubre de forma homogénea entre países); integrarlas solo se justificaría para un
módulo nuevo concreto (p. ej., expectativas o series trimestrales). No se verificaron sus API en esta
iteración.

---

## D. Informe técnico

**Arquitectura** (detalle en `arquitectura.md`): página estática + una función serverless.

```
index.html ─┬─ css/{tokens,base,layout,components,islm}.css
            ├─ js/islm-model.js        motor puro (Node y navegador)
            ├─ js/lab-content.js       escenarios, glosario, referencias (datos puros)
            ├─ js/config/*             países, indicadores, metas, estado
            ├─ js/data/fallback-wdi.js GENERADO por scripts/build-fallback.mjs
            ├─ js/services/{wdi,bcrp-client,fx,compare}.js
            ├─ js/ui/{format,charts,overview,islm-lab}.js
            └─ js/app.js               arranque
api/bcrp.js  proxy BCRP (allowlist, validación, timeout 10 s, caché CDN 6 h)
```

Decisiones:

* **Scripts clásicos `defer` + `globalThis.MacroScope`**, no módulos ES: la página sigue funcionando al
  abrirse por `file://` y en los e2e; sin *bundler*.
* **Sin frameworks ni dependencias nuevas** (solo `playwright` de desarrollo, ya existente).
* **Proxy BCRP mínimo** en Vercel en lugar de un servicio externo: es la única forma de consultar BCRPData
  desde el navegador sin CORS. La lista blanca de códigos y la validación de periodos evitan usarlo como
  proxy abierto.
* **Registro `MacroScope.labs`** para añadir otros modelos (oferta y demanda, OA–DA, Phillips, Solow)
  sin reescribir la página; no se implementaron todavía, como se pidió.

**Bugs resueltos**: F1 «Explorar análisis»; F2 NX ≡ CA; F3 m desde exportaciones; F4/C5 calibración
presentada como empírica; F6 conector WDI frágil; F7 respaldo desactualizado; F10 impacto en régimen
fijo; F15 insignia recortada; F16 cifras sin fuente en el respaldo; efecto lateral de la e2e que
reescribía evidencia versionada.

---

## E. Evidencia de pruebas

| Conjunto | Resultado | Archivo |
|---|---|---|
| Smoke (sintaxis de 17 JS, referencias locales, SRI) | OK | `docs/evidence/fase5/npm-test.txt` |
| Unitarias (`node --test`): motor (22), contenido pedagógico (4), BCRP, WDI, comparador | 42/42 | ídem |
| E2E Playwright (Chromium): hero en 4 tamaños, calibración, WDI (éxito, fallo, malformado), BCRP (éxito, fallo, malformado), comparador en 4 tamaños, laboratorio (escenario guiado, niveles, A/B, capas, unidades, reduced-motion, 4 tamaños, puntos dibujados = `solve()`) | 35/35 | ídem |
| Sondeo independiente del coordinador: overflow, nombres accesibles, ids duplicados, errores JS (3 pestañas × 4 tamaños) | 0 incidencias | — |
| Paridad visual de la modularización (12 pares de capturas) | Idénticos | `docs/evidence/fase-modularizacion/` |
| Capturas responsive finales | 1440/768/390/360 | `docs/evidence/fase5/` |

Verificación manual del laboratorio (Perú, tipo fijo, movilidad perfecta, ΔG = +3, m = 0,22):
ΔY = 3/(1 − 0,6 + 0,22) = 4,84 ✓; ΔM = k·ΔY = 2,42 ✓; ΔNX = −m·ΔY = −1,06 ✓; dY/di* = −b/s = −2,42 ✓;
dY/dē = n/s = 0,40 ✓; bajo flotación Δe = −ΔG/n = −12 % ✓.

**No verificado** (limitaciones de entorno, no del código): Firefox, Safari y dispositivos físicos;
lectores de pantalla; ejecución real de `api/bcrp.js` en Vercel; consumo real de WDI desde un navegador
desplegado; Node 22 (las pruebas se ejecutaron en Node 24.21; `package.json` declara `engines: 22.x`).

---

## F. Informe multiagente

| Tarea (Orca) | Agente | Worktree / rama | Resultado | Commits |
|---|---|---|---|---|
| Auditoría, motor, pedagogía, documentos | Claude (coordinador) | `auditoria-claude` / `audit/technical-review` | Hecho | 2180438, 5717f1f, 847595c, 927cc84, 0d6debd |
| `task_1b44dab01eba` Fase 1–2 | Codex | `ui-premium-codex` / `feature/ui-premium` | Aceptado tras verificación | e02586f |
| `task_220f29269872` Modularización | Codex | ídem | Aceptado | a6326ef, 3e3d2ba, 82c4511, 51e635e, 25098b9 |
| `task_66a38ae6d933` Prototipo visual | Antigravity | `graficos-antigravity` / `feature/graficos-antigravity` | Aceptado (referencia de diseño) | 6c59230 |
| `task_9f2c5a5c3169` Fase 4 | Codex | `comparador-codex` / `armandoparedes2026/comparador-codex` | Aceptado | 7f7ae68 |
| `task_06b3c8ae0bcb` Laboratorio y pedagogía | Codex | `ui-premium-codex` / `feature/ui-premium` | Aceptado | 66da2ea, b84a75e, 43b92a7, 102c356 |
| Consolidación final | Claude | `feature/ui-premium` | Hecho | a580ca8, cfec32d y este informe |

Conflictos y decisiones de integración:

* Los worktrees estaban 8 commits por detrás de `origin/main`; se alinearon por *fast-forward* antes de
  empezar. `D:/ORCA/macroscope-dashboard` (`main`) no se tocó.
* Para evitar ediciones simultáneas de `index.html`, Fase 1–2, modularización y laboratorio se
  ejecutaron en serie en un mismo worktree; la Fase 4 se aisló en un worktree propio con propiedad de
  archivos disjunta. Las fusiones no produjeron conflictos.
* El motor y el contenido pedagógico fueron propiedad exclusiva del coordinador; los trabajadores no los
  modificaron (verificado con `git diff`).
* Cada entrega se aceptó solo tras reejecutar `npm test` y revisar el diff y las capturas. Hallazgos
  del coordinador durante la revisión: capturas reescritas por la e2e, texto de calibración
  desactualizado y reposicionamiento no aplicado; se corrigieron en a580ca8 y cfec32d.
* Una sesión estructurada de Codex no puede reutilizarse como terminal; cada tarea usó un trabajador
  nuevo y el anterior se liberó tras aceptar su entrega. La terminal de Antigravity quedó retenida por
  ser propiedad del usuario.
* Error propio corregido: el diagnóstico inicial afirmaba que la CI no ejecutaba unitarias ni e2e; eso
  era cierto en 0df3892 pero no en 7631444 (F14, corregido en el documento).

---

## H. Pendientes

1. **Simulador por debajo del pliegue**: a 1440×900, el encabezado y el selector de nivel ocupan la
   primera pantalla; compactarlos haría del laboratorio el elemento principal.
2. El botón «Explorar análisis» roza el borde inferior de la tarjeta del hero.
3. Ampliar BCRP (PBI mensual, términos de intercambio, balanza comercial, crédito, expectativas) solo
   tras verificar cada código con una petición real.
4. Opción de calibrar i₀ de Perú con la tasa de referencia observada (PD04722MM) en lugar del supuesto.
5. Pruebas en Firefox/Safari, dispositivos físicos y lector de pantalla.
6. Modelos adicionales mediante el registro `MacroScope.labs`.

## I. Decisiones que requieren su aprobación

1. **Revisar y fusionar `feature/ui-premium` en `main`** (preferiblemente mediante un pull request; nada
   se ha publicado en GitHub todavía). Un push a `main` dispara el despliegue a producción.
2. **Despliegue de vista previa antes de producción**: `api/bcrp.js` es la primera función serverless del
   proyecto y `package.json` fija `engines.node = 22.x`; conviene validarlos en un *preview* de Vercel.
3. **`vercel-deploy.yml` solo ejecuta el smoke test antes de publicar** en producción. Se recomienda
   ejecutar `npm test` completo (requiere instalar Chromium en el job); no se cambió porque está fuera del
   alcance autorizado.
4. Si se conservan en el repositorio las ramas auxiliares (`audit/technical-review`,
   `feature/graficos-antigravity`, `armandoparedes2026/comparador-codex`) y el prototipo
   `prototypes/lab-v2/`, que hoy **sí** se publicaría con el sitio porque `.vercelignore` no lo excluye.
5. Las monedas del panel cambiario no se ampliaron a las 12 economías nuevas (sigue con 6).
