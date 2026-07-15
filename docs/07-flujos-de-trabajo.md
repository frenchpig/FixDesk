# Flujos de trabajo

Define el ciclo de vida de un ticket: estados, transiciones permitidas y reglas de negocio.

## Estados del ticket

```
                    ┌─────────────┐
                    │   OPEN      │  ← Estado inicial al crear
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌────────────┐ ┌───────────┐ ┌───────────┐
     │IN_PROGRESS │ │ CANCELLED │ │  PENDING  │
     └─────┬──────┘ └───────────┘ └─────┬─────┘
           │                             │
           ├──────────────┐              │
           ▼              ▼              ▼
     ┌───────────┐  ┌───────────┐ ┌───────────┐
     │  PENDING  │  │ RESOLVED  │ │IN_PROGRESS│
     └─────┬─────┘  └───────────┘ └───────────┘
           │
           ▼
     ┌───────────┐
     │ RESOLVED  │  ← Estado final
     └───────────┘
```

## Tabla de transiciones

| Desde | Hacia | Quién | Condición |
|-------|-------|-------|-----------|
| `OPEN` | `IN_PROGRESS` | Técnico | Ticket asignado o auto-asignado |
| `OPEN` | `CANCELLED` | Usuario / Técnico | Usuario solo sus propios tickets |
| `OPEN` | `PENDING` | Técnico | Esperando repuestos o acceso |
| `IN_PROGRESS` | `PENDING` | Técnico | Requiere repuesto o autorización |
| `IN_PROGRESS` | `RESOLVED` | Técnico | Problema solucionado |
| `IN_PROGRESS` | `OPEN` | Técnico | Reasignación o error de diagnóstico |
| `PENDING` | `IN_PROGRESS` | Técnico | Repuesto disponible o acceso concedido |
| `PENDING` | `RESOLVED` | Técnico | Resuelto sin pasar por IN_PROGRESS |
| `PENDING` | `CANCELLED` | Técnico / Usuario | Ya no aplica |
| `RESOLVED` | `OPEN` | Técnico | Reapertura por problema recurrente |
| `CANCELLED` | — | — | Estado final (sin transiciones) |

## Reglas de negocio por estado

### OPEN (Abierto)

- Ticket recién creado, sin técnico asignado
- Visible en columna "Abierto" del Kanban
- Cualquier técnico del área correspondiente puede asignárselo
- El usuario puede cancelar su propio ticket

### IN_PROGRESS (En progreso)

- Un técnico está trabajando activamente
- Debe tener `assigneeId` definido
- Se espera que el técnico agregue notas de avance

### PENDING (Pendiente)

- Bloqueado por factor externo: repuesto, acceso al área, proveedor
- La nota al cambiar a este estado es **obligatoria** (motivo del bloqueo)
- Badge color ámbar en la UI

### RESOLVED (Resuelto)

- Problema solucionado
- Se establece `resolvedAt = now()`
- Visible en filtro "Resueltos hoy" si `resolvedAt` es del día actual
- El usuario puede ver el ticket pero no reabrirlo (solo técnico)

### CANCELLED (Cancelado)

- Reporte duplicado, error del usuario o ya no aplica
- Estado final; no se puede reactivar (crear ticket nuevo)
- Badge color rojo atenuado

## Flujo completo: ejemplo

### Escenario: Proyector defectuoso en laboratorio

```
Paso 1 — Reporte (Usuario: María)
  María detecta proyector roto en Lab 3
  → Completa formulario en /reportar
  → Adjunta foto del proyector
  → POST /tickets
  → Estado: OPEN
  → Historial: CREATED

Paso 2 — Asignación (Técnico: Juan)
  Juan ve el ticket en dashboard, columna "Abierto"
  → Click "Asignarme"
  → PATCH /tickets/:id/assign
  → assigneeId = Juan
  → Historial: ASSIGNED

Paso 3 — Diagnóstico (Técnico: Juan)
  Juan va al laboratorio y confirma falla
  → PATCH /tickets/:id/status { status: "IN_PROGRESS", note: "Lámpara fundida" }
  → Historial: STATUS_CHANGED (OPEN → IN_PROGRESS)

Paso 4 — Bloqueo (Técnico: Juan)
  No tiene lámpara de repuesto
  → PATCH /tickets/:id/status { status: "PENDING", note: "Esperando lámpara XYZ-200" }
  → Historial: STATUS_CHANGED (IN_PROGRESS → PENDING)

Paso 5 — Resolución (Técnico: Juan)
  Llega el repuesto, instala y verifica
  → PATCH /tickets/:id/status { status: "IN_PROGRESS" }
  → PATCH /tickets/:id/status { status: "RESOLVED", note: "Lámpara reemplazada, proyector operativo" }
  → resolvedAt = now()
  → Historial: STATUS_CHANGED (IN_PROGRESS → RESOLVED)

Paso 6 — Consulta (Usuario: María)
  María revisa /mis-tickets/42
  → Ve estado "Resuelto" con línea de tiempo completa
```

## Prioridades

| Prioridad | Criterio sugerido | SLA objetivo (MVP) |
|-----------|-------------------|---------------------|
| `LOW` | Estético, no bloquea actividades | 5 días laborables |
| `MEDIUM` | Molesto pero con workaround | 2 días laborables |
| `HIGH` | Bloquea actividades o afecta seguridad | 4 horas laborables |

### Reglas de prioridad automática (fase 2)

- Categoría `NETWORK` con palabras clave "sin internet", "caída" → auto `HIGH`
- Ticket sin asignar > 24 h con prioridad `HIGH` → alerta visual

## Categorías y áreas

| Categoría | Área sugerida | Ejemplos |
|-----------|---------------|----------|
| `HARDWARE` | Hardware y equipos | Proyectores, PCs, impresoras |
| `NETWORK` | Redes y conectividad | WiFi caído, switch, cableado |
| `INFRASTRUCTURE` | Infraestructura física | Bicicleteros, puertas, mobiliario |
| `ELECTRICAL` | Instalaciones eléctricas | Luces, tomas, tableros |

La asignación de área puede ser automática al crear el ticket según la categoría seleccionada.

## Validación de transiciones (backend)

```typescript
// Pseudocódigo — tickets.service.ts
const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN:         ['IN_PROGRESS', 'PENDING', 'CANCELLED'],
  IN_PROGRESS:  ['PENDING', 'RESOLVED', 'OPEN'],
  PENDING:      ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED:     ['OPEN'],
  CANCELLED:    [],
};

function validateTransition(from: TicketStatus, to: TicketStatus): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new BadRequestException(
      `Transición inválida: ${from} → ${to}`
    );
  }
}
```

## Notas obligatorias

| Transición | Nota requerida |
|------------|----------------|
| → `PENDING` | Sí — motivo del bloqueo |
| → `CANCELLED` | Sí — razón de cancelación |
| → `RESOLVED` | Recomendada — descripción de la solución |
| Otras | Opcional |
