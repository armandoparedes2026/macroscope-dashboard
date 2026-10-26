# Panorama Reference Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replicate the supplied Panorama reference inside the existing seven-module Macroscope architecture with official data.

**Architecture:** Keep the `#panorama` route and plain deferred-JS structure. Extend validated BCRP data, render an expandable KPI registry, reorganize CSS grid and compose actual data charts. Preserve landing ownership to the other working branch.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Chart.js and the existing Playwright/Node test suite.

**Spec:** `docs/superpowers/specs/2026-10-25-panorama-reference-fidelity-design.md`

## Global Constraints

- No homepage edits, no direct main merge, no invented indicators or copied screenshot numbers.
- Quarterly and monthly BCRP groups remain separate, with exact titles and frequencies validated.
- Missing and fallback observations remain explicit; all controls keyboard-accessible and 44 px on touch.

## Review Focus

- Extra series unavailable: hide their values or mark `N/D`, never show screenshots' sample numbers.
- Rebased level lacks complete 2015 base: disable level presentation and explain why.
- Country changed to Chile: no BCRP label or Peru target band on Chile chart.
- Browser narrow or reduced motion: no clipping or overlapping inputs, controls reachable.
- Refresh with partial upstream outage: preserve available frequency groups and status accurately.

---

### Task 1: Official expanded series and rebasing

**Files:** `api/bcrp.js`, `js/services/panorama-client.js`, `js/services/panorama-data.js`, `tests/bcrp.test.mjs`, `tests/panorama-data.test.mjs`, `docs/fuentes-bcrp.md`.

**Interfaces:** `M.buildPanoramaMetrics` additionally yields `extras`; `M.rebaseBcrpIndex(points,2015)` and `M.getPanoramaLevelSeries(bcrp)` validate twelve monthly baseline observations.

- [x] Add failing tests for new official series and rejection of partial rebasing baselines.
- [x] Confirm expected red tests and implement strict normalization and derived level.
- [x] Confirm tests green and document primary sources.

### Task 2: Reference-faithful cards and controls

**Files:** `index.html`, `js/ui/panorama-premium.js`, `css/panorama.css`, `tests/e2e.mjs`.

**Interfaces:** `M.setupPanorama`, `M.renderPanorama`, dynamic six primary cards and additional cards toggle.

- [x] Add failing browser checks for six cards, expandable extras, 03/07 route and frequency/provider control behavior.
- [x] Reorganize toolbar, cards and accessible controls for reference layout.
- [x] Run selected browser checks to green.

### Task 3: Analytical chart grid and visual QA

**Files:** `index.html`, `js/ui/panorama-premium.js`, `css/panorama.css`, `tests/e2e.mjs`, `tests/panorama-visual.mjs`.

**Interfaces:** PBI level/yoy toggle, BCRP inflation chart, three lower charts, context right column.

- [x] Add failing assertions for desktop grid and chart toggle/fallback.
- [x] Implement chart rendering and responsive CSS.
- [x] Verify 1672px reference viewport, 390px mobile and dark theme via actual screenshots.
- [x] Run `npm test` and inspect regression output (58 unit tests, 65 browser checks).
- [x] Commit locally to the feature branch.
