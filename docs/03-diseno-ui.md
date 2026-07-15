# Sistema de diseño

FixDesk prioriza legibilidad en entornos de trabajo prolongado (técnicos frente a consolas) y simplicidad para usuarios que reportan incidentes sin formación técnica.

## Principios

1. **Alto contraste** — Texto legible sobre fondos oscuros; estados distinguibles por color y texto.
2. **Modo oscuro nativo** — Tema oscuro por defecto; modo claro como variante futura.
3. **Acción clara** — Un botón primario por vista; acciones destructivas siempre en rojo.
4. **Densidad adaptable** — Tablero técnico más denso; formulario de reporte más espacioso.

## Paleta de colores

Configuración vía variables CSS globales (Tailwind CSS 4). Sin `tailwind.config.js`.

```css
/* apps/web/app/globals.css */
@import "tailwindcss";

@theme {
  --color-background: #020617;      /* slate-950 */
  --color-surface: #0f172a;         /* slate-900 */
  --color-accent: #6366f1;          /* indigo-500 */
  --color-success: #34d399;         /* emerald-400 */
  --color-warning: #fbbf24;         /* amber-400 */
  --color-danger: #f43f5e;          /* rose-500 */
  --color-text-primary: #e2e8f0;    /* slate-200 */
  --color-text-secondary: #94a3b8;  /* slate-400 */
}
```

### Tabla de uso

| Propósito | Clase Tailwind | Hex | Uso |
|-----------|----------------|-----|-----|
| Fondo principal | `bg-slate-950` | `#020617` | Fondo general de la app |
| Superficies / tarjetas | `bg-slate-900` | `#0f172a` | Tickets, modales, sidebar |
| Acento principal | `text-indigo-500` / `bg-indigo-500` | `#6366f1` | Botones primarios, enlaces, bordes activos |
| Estado: Resuelto | `text-emerald-400` | `#34d399` | Badges terminados, iconos de éxito |
| Estado: Pendiente | `text-amber-400` | `#fbbf24` | En espera de asignación o repuestos |
| Estado: Urgente / Falla | `text-rose-500` | `#f43f5e` | Alertas críticas, eliminar, cancelar |
| Texto principal | `text-slate-200` | `#e2e8f0` | Títulos y cuerpo |
| Texto secundario | `text-slate-400` | `#94a3b8` | Fechas, metadatos, subtítulos |

## Tipografía

| Elemento | Clase sugerida |
|----------|----------------|
| Título de página | `text-2xl font-semibold text-slate-200` |
| Título de ticket | `text-lg font-medium text-slate-200` |
| Cuerpo | `text-sm text-slate-200` |
| Metadatos | `text-xs text-slate-400` |
| Badge de estado | `text-xs font-medium uppercase tracking-wide` |

Fuente del sistema: stack por defecto de Tailwind (`font-sans`).

## Componentes base

### Botones

```
Primario:    bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg
Secundario:  border border-slate-700 text-slate-200 hover:bg-slate-800
Peligro:     bg-rose-500 hover:bg-rose-600 text-white
Deshabilitado: opacity-50 cursor-not-allowed
```

### Tarjeta de ticket

```
bg-slate-900 border border-slate-800 rounded-xl p-4
hover:border-slate-700 transition-colors
```

### Badge de estado

| Estado | Estilo |
|--------|--------|
| Abierto | `bg-slate-800 text-slate-300` |
| En progreso | `bg-indigo-500/20 text-indigo-400` |
| Pendiente (repuestos) | `bg-amber-400/20 text-amber-400` |
| Resuelto | `bg-emerald-400/20 text-emerald-400` |
| Cancelado | `bg-rose-500/20 text-rose-500` |

### Badge de prioridad

| Prioridad | Estilo |
|-----------|--------|
| Baja | `text-slate-400` |
| Media | `text-amber-400` |
| Alta | `text-rose-500 font-semibold` |

### Input de formulario

```
bg-slate-900 border border-slate-700 rounded-lg px-3 py-2
text-slate-200 placeholder:text-slate-500
focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
```

### Sidebar (panel técnico)

```
bg-slate-900 border-r border-slate-800 w-64 min-h-screen
Enlaces activos: text-indigo-500 bg-indigo-500/10
Enlaces inactivos: text-slate-400 hover:text-slate-200
```

## Layouts

### Portal del usuario

```
┌─────────────────────────────────────┐
│  Header: logo + "Mis tickets" + user│
├─────────────────────────────────────┤
│                                     │
│   [+ Nuevo reporte]                 │
│                                     │
│   ┌─────────────────────────────┐   │
│   │ Ticket #42 — Proyector...   │   │
│   │ Hardware · Abierto · hace 2h│   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Panel del técnico (Kanban)

```
┌──────┬──────────────────────────────────────────────────┐
│ Side │  Filtros: [Mis tickets] [Alta prioridad] [Hoy]  │
│ bar  ├──────────┬──────────┬──────────┬─────────────────┤
│      │  Abierto │ En prog. │ Pendiente│    Resuelto     │
│ Nav  │ ┌──────┐ │ ┌──────┐ │          │                 │
│      │ │ #42  │ │ │ #38  │ │          │                 │
│      │ └──────┘ │ └──────┘ │          │                 │
└──────┴──────────┴──────────┴──────────┴─────────────────┘
```

## Iconografía

Usar [Lucide React](https://lucide.dev) para consistencia:

| Contexto | Icono sugerido |
|----------|----------------|
| Nuevo ticket | `Plus` |
| Hardware | `Monitor` |
| Redes | `Wifi` |
| Infraestructura | `Building` |
| Eléctrico | `Zap` |
| Ubicación | `MapPin` |
| Foto adjunta | `Camera` |
| Historial | `Clock` |
| Urgente | `AlertTriangle` |

## Accesibilidad

- Contraste mínimo WCAG AA en texto principal sobre `slate-950`
- Estados no dependen solo del color: incluir etiqueta textual en badges
- Focus visible en todos los elementos interactivos (`focus:ring-2`)
- Formularios con `<label>` asociado a cada input

## Responsive

| Breakpoint | Comportamiento |
|------------|----------------|
| `< md` | Kanban → lista vertical con filtros en drawer |
| `md+` | Sidebar fija + contenido principal |
| `lg+` | Kanban con 4 columnas visibles |
