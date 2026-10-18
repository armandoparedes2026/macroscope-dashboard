# Diagnóstico inicial — MacroScope

Fecha: 2026-10-18. Base: `origin/main` 7631444. Coordinador: Claude Code.

## Estado del entorno verificado

* Los tres worktrees (`auditoria-claude`, `ui-premium-codex`, `graficos-antigravity`) estaban en 0df3892,
  **8 commits por detrás de `origin/main`** (faltaban el simulador IS–LM–BP, `package.json`, Playwright,
  Vercel). Estaban limpios y sin commits propios: se alinearon con `git merge --ff-only origin/main`.
  El checkout principal `D:/ORCA/macroscope-dashboard` (rama `main` local, también atrasada) **no se tocó**.
* No hay identidad Git global; los commits de agentes usan `-c user.name/-c user.email` sin modificar la
  configuración del usuario.
* Línea base de pruebas: smoke OK, 11/11 unitarias, 14/14 e2e. El único fallo inicial fue de **entorno**:
  faltaba el navegador de Playwright (`npx playwright install chromium`).
* Orca 1.4.229 activo; Run `run_1622e46c2cf5`.

## Hallazgos (severidad · impacto académico · esfuerzo)

| # | Hallazgo | Sev. | Impacto acad. | Esfuerzo | Responsable |
|---|---|---|---|---|---|
| F1 | «Explorar análisis»: el clic funciona pero `scrollIntoView({block:'start'})` deja `#overviewFilters` en top = 0, **oculto bajo la `.topbar` sticky** (91 px a 1440, 106 px a 768) y en móvil bajo topbar + `.mobile-nav` sticky (137 px a 360/390). Reproducido con Playwright. | Alta | Bajo | Bajo | Codex 1 |
| F2 | NX igualado a la cuenta corriente (ver auditoría económica C1). | Alta | Alto | Medio | Claude (motor, hecho) + Codex 1 (UI) |
| F3 | m derivado de exportaciones (C2). | Media | Alto | Bajo | Claude (hecho) + Codex 1 |
| F4 | Calibración presentada como empírica (C3–C5). | Media | Alto | Bajo | Codex 1 |
| F5 | BCRPData no envía `Access-Control-Allow-Origin` (y responde `Content-Type: text/html`): un `fetch` del navegador queda bloqueado. Requiere función serverless. `PN01288PM` está descontinuada. | Alta (para la integración) | Medio | Medio | Codex 1 |
| F6 | WDI: una sola petición por indicador con `per_page=250` y sin seguir `pages` (se truncaría al ampliar países), un único timeout global de 14 s, sin reintentos ni caché, `obs_status` ignorado, sin fecha de extracción. | Media | Medio | Medio | Codex 1 |
| F7 | El respaldo local termina en 2024; WDI ya publica 2025 para varios indicadores. | Baja | Medio | Bajo | Codex 1 |
| F8 | Comparaciones entre países pueden usar años distintos según la disponibilidad («último año» por país). | Media | Alto | Medio | Codex (fase 4) |
| F9 | `index.html` concentra ~1 800 líneas de HTML, CSS y JS (175 KB). | Media | — | Alto | Codex (modularización) |
| F10 | Régimen fijo: el impacto (E₁) ignoraba la M decidida por el banco central. | Media | Medio | Bajo | Claude (hecho) |
| F11 | Narrativa de la UI no explica el aislamiento completo de shocks de NX bajo flotación (propiedad de la especificación). | Baja | Medio | Bajo | Fase laboratorio |
| F12 | Tipos de cambio de Open ER API: agregador no oficial; correcto que se etiquete como indicativo. | Baja | Bajo | — | Mantener etiqueta |
| F13 | `package.json`/README/`index.html` aún usan el posicionamiento «inteligencia/observatorio para decidir». | Baja | Medio | Bajo | Fase UI |
| F14 | El workflow `validate.yml` solo ejecuta `tests/smoke.mjs`; las pruebas unitarias y e2e no corren en CI. | Media | — | Bajo | Codex 1 |

## Plan por fases y asignación (Orca)

| Fase | Tarea | Agente | Dependencias |
|---|---|---|---|
| 1–2 | Auditoría económica, motor, contenido pedagógico | Claude | — |
| 1–2 | F1, F4–F7, F14, proxy BCRP, integración de calibración | Codex 1 | merge de `audit/technical-review` |
| 3 | Prototipo visual del laboratorio en una pestaña | Antigravity | — |
| 3–4 | Modularización incremental | Codex 2 | Codex 1 |
| 3 | Laboratorio de pestaña única + pedagogía integrada | Codex 3 | Codex 2, Antigravity |
| 4 | Países adicionales y comparador | Codex 4 | Codex 3 |
| 5 | Auditoría independiente, pruebas, responsive | Claude | todas |
