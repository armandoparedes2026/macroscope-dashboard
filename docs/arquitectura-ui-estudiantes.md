# Arquitectura de interfaz — MacroScope para estudiantes

Coordinador: Claude Code. Fecha: 2026-10-18. Base: `origin/main` 2668498.
Público prioritario: estudiantes de pregrado de economía. Docentes: sección «Preliminar».

## 1. Mapa del sitio

La página sigue siendo un solo `index.html` con vistas (`data-view`), sin framework ni enrutador nuevo.
La vista activa se refleja en `location.hash` para que los enlaces, el botón Atrás y los marcadores funcionen
también desde `file://`.

| Hash | Vista | Contenido | Estado |
|---|---|---|---|
| `#inicio` (por defecto) | **Inicio** | Qué es MacroScope, tres caminos, franja de ayuda, mención «Docentes — Preliminar» | Nueva |
| `#laboratorio` | **Aprender** | Simulador IS–LM–BP y escenarios guiados (`LAB_CONTENT.SCENARIOS`) | Existe |
| `#panorama` | **Explorar datos** | Panorama, indicadores, comparador de países, Perú/BCRP | Existe |
| `#fuentes` | **Buscar fuentes** | Directorio `MacroScope.SOURCES_CATALOG` con filtros y cita | Nueva |
| `#ayuda` | **Ayuda** | Cómo usar, glosario (`LAB_CONTENT.GLOSSARY`), preguntas frecuentes, cómo citar | Nueva |

Un hash desconocido abre Inicio. La navegación principal muestra exactamente estas cinco entradas, en este orden.

## 2. Reglas de composición

1. **Una intención por pantalla.** Cada vista abre con un título, una frase de propósito y una acción principal.
   Nada de botones decorativos («Explorar análisis» actual) que no lleven a contenido nuevo.
2. **Una sola forma de hacer cada cosa.** Si dos controles hacen lo mismo (p. ej., la navegación móvil y la de
   escritorio), comparten el mismo código y los mismos destinos.
3. **Nada fijo sobre el contenido salvo la barra superior.** Altura máxima de la barra: 64 px en escritorio y
   56 px en móvil. La navegación móvil no añade una segunda barra fija; usa un menú o una barra inferior, no ambos.
   Todo destino de anclaje respeta `scroll-margin-top` igual a la altura real de la barra.
4. **Tokens únicos.** Colores, espacios, radios y sombras salen solo de `css/tokens.css`. Ningún color literal
   fuera de ese archivo, salvo la paleta de series de los gráficos, que también se define allí y se lee desde JS.
5. **Claro y oscuro de primera clase.** `prefers-color-scheme` como valor inicial, conmutador con
   `[data-theme]` y preferencia recordada (con `try/catch`). Los gráficos de Chart.js se redibujan al cambiar el tema.
6. **Movimiento opcional.** Toda animación y todo avance automático se desactivan con `prefers-reduced-motion`.
   Un contenido que se mueve solo tiene botón de pausa visible.

## 3. Criterios de aceptación (medibles; los verifica `tests/e2e.mjs`)

Anchos: **360, 390, 768, 1024, 1280, 1440 y 1920 px**, en claro y en oscuro.

| # | Criterio | Cómo se mide |
|---|---|---|
| A1 | Sin desplazamiento horizontal | `scrollWidth <= clientWidth` del documento en cada vista y ancho |
| A2 | Sin solapamientos de controles | Para todo par de elementos interactivos visibles, los rectángulos no se intersectan |
| A3 | Objetivos táctiles ≥ 44 × 44 px | Botones, enlaces de navegación, chips de filtro y controles del simulador (≤ 1024 px) |
| A4 | Ningún texto recortado | Títulos, insignias y tarjetas sin `scrollWidth > clientWidth` con `overflow:hidden` |
| A5 | Destinos de anclaje visibles | Tras navegar, el `top` del destino es ≥ al `bottom` de la barra fija |
| A6 | Contraste WCAG AA | Texto ≥ 4,5:1 y componentes de interfaz ≥ 3:1 en ambos temas (pares de tokens) |
| A7 | Foco visible y orden lógico | Todo interactivo recibe foco con `Tab` y muestra un anillo con `--focus` |
| A8 | Inicio orienta en una pantalla | A 1440 × 900 y 390 × 844 los tres caminos son visibles sin hacer scroll |
| A9 | Simulador sobre el pliegue | A 1440 × 900 los controles y el primer gráfico del laboratorio empiezan antes de 900 px |
| A10 | Navegación por hash | Cada hash abre su vista; Atrás vuelve a la anterior; un hash desconocido abre Inicio |
| A11 | Carrusel (si se conserva) | Avanza tras un clic en sus flechas; ninguna diapositiva aparece cortada; tiene botón de pausa; se detiene con `prefers-reduced-motion` |
| A12 | Sin errores de consola | Cero errores en cada vista, con y sin red (respaldo local) |
| A13 | Funciona en `file://` | Las vistas cargan sin servidor, como hoy |

## 4. Directorio de fuentes (`#fuentes`)

* Datos: `js/data/sources-catalog.js` (curado por el coordinador; Codex **no** añade fuentes ni cambia
  enlaces o descripciones; si falta algo, lo reporta).
* Filtros: curso, alcance (Perú, América Latina, mundial, otras regiones), tipo de acceso y búsqueda libre,
  con `filterSources`. El estado de los filtros se refleja en la URL para poder compartir una búsqueda.
* Cada tarjeta: nombre, organismo, para qué sirve (`useFor`), temas, frecuencia, acceso, nivel, botón «Abrir
  fuente» (pestaña nueva, `rel="noopener"`) y botón «Copiar cita» (`citeSource`, con la fecha del día).
* Si `note` existe se muestra como advertencia («Fuente secundaria…»). Si `linkStatus === 'antibot'`, se
  muestra un aviso discreto: «Puede pedir una verificación del navegador al abrirse».
* Pie: «Enlaces comprobados el {checked}».

## 5. Ayuda (`#ayuda`)

* «Cómo usar MacroScope»: tres pasos por camino (aprender, explorar, buscar fuentes).
* Glosario: el de `LAB_CONTENT.GLOSSARY`, con búsqueda. Los términos del laboratorio enlazan a su entrada.
* Preguntas frecuentes, solo sobre la plataforma: ¿de dónde vienen los datos?, ¿por qué un dato dice «respaldo
  local»?, ¿qué significa «ilustrativo» en el simulador?, ¿cómo cito un dato?, ¿por qué dos países muestran años
  distintos?
* Soporte: no se publica un correo ni un formulario hasta que el responsable proporcione un canal real.
  Mientras tanto, enlace a la página de incidencias del repositorio solo si es público.

## 6. Límites para la implementación

* Sin frameworks ni dependencias nuevas; Google Fonts solo si el informe UX lo justifica.
* No cambiar `js/islm-model.js`, `js/lab-content.js` ni `js/data/sources-catalog.js` (propiedad del coordinador).
* No borrar pruebas existentes; adaptarlas cuando cambie un texto o un selector, y explicarlo en el commit.
* No inventar cifras, fuentes ni testimonios en Inicio o Ayuda.
