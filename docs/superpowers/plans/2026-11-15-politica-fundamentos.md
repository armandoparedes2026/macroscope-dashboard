# Fundamentos de política económica — diseño y ejecución

**Objetivo:** definir la política económica y su composición antes de presentar sus simulaciones.

**Base conceptual:** decisiones públicas orientadas a objetivos de bienestar mediante instrumentos y reglas, con competencias institucionales, mecanismos de transmisión, restricciones y evaluación. Síntesis pedagógica; no se atribuye a una fuente una clasificación única o exhaustiva.

**Diseño:** Fundamentos será la entrada predeterminada. Definición, seis componentes, cinco objetivos explorables y ocho ámbitos no excluyentes. Cada ámbito explica finalidad, instrumentos, autoridades, transmisión, tensiones y cobertura real de la app. Una guía de evaluación distinguirá resultados observados de efectos causales. Se conservarán comercio, paquetes, mezcla macro, biblioteca y casos.

**Arquitectura:** nuevo script clásico `js/ui/policy-foundations.js` con contenido y render educativo aislados. `policy.js` lo monta y conecta sus acciones con las pestañas existentes. Estilos en `css/policy.css`; motores sin cambios. La tarjeta de Inicio reflejará objetivos e instrumentos, no solo comercio.

**Fuentes:** BCRP (cartilla educativa y misión institucional); FMI (fiscal, monetaria, estructural y macroprudencial); OCDE (evaluación y políticas ambientales); FAO/OMC ya disponibles para comercio. Enlaces y alcance de cada fuente visibles.

## Plan

- [x] Ampliar `tests/policy-e2e.mjs`: entrada por fundamentos, ámbitos/objetivos, enlaces con simuladores, navegación por teclado y conservación de parámetros. Fallo inicial observado antes de implementar.
- [x] Implementar definición, composición, mapa interactivo, evaluación y fuentes; conectar pestañas sin modificar escenarios del usuario.
- [x] Verificar recorrido de Política, smoke y suite completa; inspeccionar capturas en móvil/escritorio y claro/oscuro. `npm test` terminó con código 0: 85 unitarias, 89 E2E, 7 táctiles y recorridos de curvas y Política. Cobertura conceptual documentada y capturas publicadas en el repositorio.
- [ ] Commit, PR, CI, vista previa y publicación según autorización vigente; verificar producción y conservar el worktree existente.

**Restricciones:** `globalThis.MacroScope`, scripts `defer`, apertura `file://`, sin dependencias nuevas, sin estadísticas inventadas, sin afirmar que IS–LM–BP calcula inflación o que el mercado comercial representa toda la política económica.
