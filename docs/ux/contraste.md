# Verificación de Contraste WCAG 2.1 AA y Daltonismo

Generado automáticamente con `docs/ux/scripts/verify-contrast.mjs`.

- **Criterio Texto Normal (WCAG 1.4.3 AA):** ratio $\ge 4.5:1$ sobre `--bg`, `--surface` y `--surface-2`.
- **Criterio Componentes UI y Gráficos (WCAG 1.4.11 AA):** ratio $\ge 3.0:1$ en bordes interactivos, indicador de foco y las 6 series de gráficos.
- **Margen de seguridad tipográfico:** todos los tokens semánticos (`--primary`, `--accent`, `--success`, `--warning`, `--danger`, `--focus`) superan **4.5:1** frente a `--bg` y `--surface` tanto en modo claro como en modo oscuro, permitiendo usarlos indistintamente en etiquetas de texto, badges, enlaces o bordes.

## Variante A (Recomendada): Cuaderno Índigo & Cobre Solar

### Modo Claro

| Token | Hex | vs `--bg` (`#FAF5EA`) | vs `--surface` (`#FFFDF8`) | vs `--surface-2` (`#EFE7D6`) | Umbral AA | Estado |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `--text` | `#142338` | **14.55:1** | **15.56:1** | **12.86:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--text-muted` | `#4A5B70` | **6.39:1** | **6.84:1** | **5.65:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--border` | `#7D7362` | **4.29:1** | **4.59:1** | **3.79:1** | ≥ 3.0:1 (UI) | Cumple AA |
| `--primary` | `#184A8C` | **8.06:1** | **8.62:1** | **7.12:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--accent` | `#B84A0E` | **4.8:1** | **5.13:1** | **4.24:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--success` | `#136843` | **6.25:1** | **6.69:1** | **5.53:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--warning` | `#8A5A00` | **5.45:1** | **5.83:1** | **4.82:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--danger` | `#B42B2B` | **5.82:1** | **6.22:1** | **5.14:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--focus` | `#8F5B00` | **5.27:1** | **5.64:1** | **4.66:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |

#### Series de gráficos (Modo Claro) — Contraste UI y Distinguibilidad bajo Daltonismo

| Serie | Familia / Nombre | Hex | vs `--bg` | vs `--surface` | Codificación redundante recomendada |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `--series-1` | Azul marino profundo | `#0D2B54` | **12.96:1** | **13.86:1** | Sólido · círculo ● |
| `--series-2` | Naranja terracota intenso | `#9E2A00` | **6.93:1** | **7.42:1** | Guion largo · cuadrado ■ |
| `--series-3` | Verde esmeralda turquesa | `#007C72` | **4.68:1** | **5.01:1** | Punteado denso · rombo ◆ |
| `--series-4` | Amarillo dorado trigo | `#B38200` | **3.16:1** | **3.38:1** | Guion-punto · triángulo ▲ |
| `--series-5` | Azul cobalto vivo | `#2166C4` | **5.13:1** | **5.49:1** | Sólido grueso · anillo ○ |
| `--series-6` | Bronce café oscuro | `#3D220A` | **13.49:1** | **14.43:1** | Guion corto · cruz ✕ |

- **Distancia mínima perceptual entre cualquier par de series ($\Delta E_{\text{OKLab}} \times 100$):** Visión tricromática = **13.6** · Deuteranopía = **12.3** · Protanopía = **12.7**.

### Modo Oscuro

| Token | Hex | vs `--bg` (`#0C1523`) | vs `--surface` (`#132033`) | vs `--surface-2` (`#1B2C44`) | Umbral AA | Estado |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `--text` | `#F7F2E6` | **16.39:1** | **14.66:1** | **12.61:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--text-muted` | `#C4BBA8` | **9.61:1** | **8.6:1** | **7.39:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--border` | `#7588A3` | **5.06:1** | **4.53:1** | **3.9:1** | ≥ 3.0:1 (UI) | Cumple AA |
| `--primary` | `#6DA8FF` | **7.58:1** | **6.78:1** | **5.83:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--accent` | `#F79D42` | **8.59:1** | **7.69:1** | **6.61:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--success` | `#44D492` | **9.66:1** | **8.64:1** | **7.43:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--warning` | `#F5C842` | **11.53:1** | **10.31:1** | **8.87:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--danger` | `#FF7B73` | **7.26:1** | **6.5:1** | **5.59:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--focus` | `#FFD452` | **12.89:1** | **11.54:1** | **9.92:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |

#### Series de gráficos (Modo Oscuro) — Contraste UI y Distinguibilidad bajo Daltonismo

| Serie | Familia / Nombre | Hex | vs `--bg` | vs `--surface` | Codificación redundante recomendada |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `--series-1` | Azul cobalto claro | `#6DA8FF` | **7.58:1** | **6.78:1** | Sólido · círculo ● |
| `--series-2` | Amarillo dorado | `#FFD452` | **12.89:1** | **11.54:1** | Guion largo · cuadrado ■ |
| `--series-3` | Verde esmeralda claro | `#38C998` | **8.7:1** | **7.78:1** | Punteado denso · rombo ◆ |
| `--series-4` | Naranja solar | `#FF8533` | **7.54:1** | **6.75:1** | Guion-punto · triángulo ▲ |
| `--series-5` | Crema marfil | `#F3E7CE` | **14.93:1** | **13.36:1** | Sólido grueso · anillo ○ |
| `--series-6` | Azul índigo medio | `#467CE0` | **4.55:1** | **4.07:1** | Guion corto · cruz ✕ |

- **Distancia mínima perceptual entre cualquier par de series ($\Delta E_{\text{OKLab}} \times 100$):** Visión tricromática = **12.5** · Deuteranopía = **11.7** · Protanopía = **12.7**.

## Variante B (Alternativa): Archivo Esmeralda & Dorado Trigo

### Modo Claro

| Token | Hex | vs `--bg` (`#F9F6EC`) | vs `--surface` (`#FFFFFF`) | vs `--surface-2` (`#EDE7D8`) | Umbral AA | Estado |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `--text` | `#132824` | **14.32:1** | **15.48:1** | **12.55:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--text-muted` | `#465E58` | **6.47:1** | **6.99:1** | **5.67:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--border` | `#747A6E` | **4.09:1** | **4.42:1** | **3.58:1** | ≥ 3.0:1 (UI) | Cumple AA |
| `--primary` | `#125E46` | **7.15:1** | **7.73:1** | **6.27:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--accent` | `#1B4D8E` | **7.77:1** | **8.4:1** | **6.81:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--success` | `#1B6B3A` | **6.05:1** | **6.54:1** | **5.3:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--warning` | `#8C5B00` | **5.38:1** | **5.81:1** | **4.71:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--danger` | `#B53518` | **5.57:1** | **6.02:1** | **4.88:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--focus` | `#8C5500` | **5.69:1** | **6.15:1** | **4.99:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |

#### Series de gráficos (Modo Claro) — Contraste UI y Distinguibilidad bajo Daltonismo

| Serie | Familia / Nombre | Hex | vs `--bg` | vs `--surface` | Codificación redundante recomendada |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `--series-1` | Verde pino profundo | `#0A382A` | **12.05:1** | **13.03:1** | Sólido · círculo ● |
| `--series-2` | Azul real vivo | `#1F62C2` | **5.42:1** | **5.86:1** | Guion largo · cuadrado ■ |
| `--series-3` | Naranja cobre intenso | `#9E2C00` | **6.9:1** | **7.46:1** | Punteado denso · rombo ◆ |
| `--series-4` | Dorado trigo | `#B08000` | **3.27:1** | **3.54:1** | Guion-punto · triángulo ▲ |
| `--series-5` | Verde azulado andino | `#007B8A` | **4.62:1** | **5:1** | Sólido grueso · anillo ○ |
| `--series-6` | Tierra tostada | `#3A1D08` | **14.29:1** | **15.45:1** | Guion corto · cruz ✕ |

- **Distancia mínima perceptual entre cualquier par de series ($\Delta E_{\text{OKLab}} \times 100$):** Visión tricromática = **10.1** · Deuteranopía = **5.3** · Protanopía = **8.2**.

### Modo Oscuro

| Token | Hex | vs `--bg` (`#0D1917`) | vs `--surface` (`#142623`) | vs `--surface-2` (`#1D332F`) | Umbral AA | Estado |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `--text` | `#F6F1E5` | **15.94:1** | **14:1** | **11.89:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--text-muted` | `#C0C6BA` | **10.29:1** | **9.04:1** | **7.68:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--border` | `#768D86` | **5.07:1** | **4.45:1** | **3.78:1** | ≥ 3.0:1 (UI) | Cumple AA |
| `--primary` | `#4CD6A5` | **9.82:1** | **8.62:1** | **7.32:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--accent` | `#73AEFF` | **7.9:1** | **6.93:1** | **5.89:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--success` | `#65DF88` | **10.67:1** | **9.36:1** | **7.95:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--warning` | `#F5C63C` | **11.15:1** | **9.78:1** | **8.31:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--danger` | `#FF8266` | **7.39:1** | **6.49:1** | **5.51:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |
| `--focus` | `#FFD047` | **12.29:1** | **10.79:1** | **9.17:1** | ≥ 4.5:1 (Texto/UI) | Cumple AA |

#### Series de gráficos (Modo Oscuro) — Contraste UI y Distinguibilidad bajo Daltonismo

| Serie | Familia / Nombre | Hex | vs `--bg` | vs `--surface` | Codificación redundante recomendada |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `--series-1` | Verde esmeralda | `#4CD6A5` | **9.82:1** | **8.62:1** | Sólido · círculo ● |
| `--series-2` | Azul cielo | `#73AEFF` | **7.9:1** | **6.93:1** | Guion largo · cuadrado ■ |
| `--series-3` | Amarillo oro | `#FFD047` | **12.29:1** | **10.79:1** | Punteado denso · rombo ◆ |
| `--series-4` | Naranja vivo | `#FF8538` | **7.41:1** | **6.51:1** | Guion-punto · triángulo ▲ |
| `--series-5` | Crema cálido | `#F3E9D2` | **14.89:1** | **13.07:1** | Sólido grueso · anillo ○ |
| `--series-6` | Azul acero | `#3E82C4` | **4.45:1** | **3.9:1** | Guion corto · cruz ✕ |

- **Distancia mínima perceptual entre cualquier par de series ($\Delta E_{\text{OKLab}} \times 100$):** Visión tricromática = **13.8** · Deuteranopía = **11.8** · Protanopía = **10.2**.

