# Módulos funcionales

## 1. Autenticación y roles

### Responsabilidad

Gestionar identidades, sesiones y control de acceso basado en roles (RBAC).

### Roles

| Rol | Código | Descripción |
|-----|--------|-------------|
| Usuario | `USER` | Reporta incidencias y consulta sus propios tickets |
| Técnico | `TECHNICIAN` | Gestiona tickets de su área asignada |
| Admin | `ADMIN` | *(Fase 2)* Gestión de usuarios y configuración |

### Flujos

#### Registro / Login

```
Usuario ingresa email + contraseña
  → POST /auth/login
  → Backend valida credenciales
  → Retorna { accessToken, user: { id, name, role } }
  → Frontend almacena token (httpOnly cookie o localStorage)
  → Redirige según rol:
      USER       → /mis-tickets
      TECHNICIAN → /dashboard
```

#### Protección de rutas

| Ruta frontend | Roles permitidos |
|---------------|------------------|
| `/reportar` | USER, TECHNICIAN |
| `/mis-tickets` | USER |
| `/mis-tickets/[id]` | USER (solo propios) |
| `/dashboard` | TECHNICIAN, ADMIN |
| `/dashboard/tickets/[id]` | TECHNICIAN, ADMIN |

### Reglas de negocio

- Un usuario solo puede ver tickets donde `ticket.reporterId === user.id`
- Un técnico ve tickets de su `areaId` o tickets asignados a él (`assigneeId`)
- El token JWT expira en 7 días (configurable)
- Contraseñas hasheadas con bcrypt (mínimo 10 rounds)

---

## 2. Creación de tickets (El reporte)

### Responsabilidad

Permitir a cualquier usuario reportar un problema de infraestructura con la información mínima necesaria para que un técnico lo atienda.

### Formulario (frontend)

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|------------|
| Título | `text` | Sí | 5–120 caracteres |
| Categoría | `select` | Sí | Enum: `HARDWARE`, `NETWORK`, `INFRASTRUCTURE`, `ELECTRICAL` |
| Ubicación | `text` | Sí | 3–200 caracteres (ej. "Lab 3, Edificio B, Piso 2") |
| Descripción | `textarea` | Sí | 10–2000 caracteres |
| Foto | `file` | No | JPG/PNG/WebP, máx. 5 MB |
| Prioridad | `select` | No | Default: `MEDIUM`. Opciones: `LOW`, `MEDIUM`, `HIGH` |

### Flujo de creación

```
1. Usuario completa formulario en /reportar
2. Validación Zod en cliente
3. Si hay foto → upload a Supabase Storage → obtener URL pública
4. POST /api/tickets con CreateTicketDto
5. Backend:
   a. Valida DTO (class-validator)
   b. Asigna reporterId del JWT
   c. Estado inicial: OPEN
   d. Crea registro en Ticket
   e. Crea entrada en TicketHistory: "Ticket creado"
6. Retorna 201 con ticket creado
7. Frontend redirige a /mis-tickets/[id] con toast de confirmación
```

### DTO de creación

```typescript
// CreateTicketDto
{
  title: string;
  category: 'HARDWARE' | 'NETWORK' | 'INFRASTRUCTURE' | 'ELECTRICAL';
  location: string;
  description: string;
  photoUrl?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

---

## 3. Tablero de gestión (Dashboard del técnico)

### Responsabilidad

Interfaz central para que los técnicos visualicen, filtren, asignen y gestionen tickets.

### Vistas

#### Vista Kanban (default)

Columnas alineadas con estados del ticket:

| Columna | Estado(s) |
|---------|-----------|
| Abierto | `OPEN` |
| En progreso | `IN_PROGRESS` |
| Pendiente | `PENDING` |
| Resuelto | `RESOLVED` |

Cada tarjeta muestra: `#id`, título, categoría, prioridad, ubicación, tiempo transcurrido.

#### Vista tabla (alternativa)

Tabla paginada con columnas: ID, Título, Categoría, Estado, Prioridad, Asignado, Creado, Acciones.

### Filtros rápidos

| Filtro | Query param | Lógica |
|--------|-------------|--------|
| Mis tickets asignados | `?assigneeId=me` | `ticket.assigneeId === currentUser.id` |
| Alta prioridad | `?priority=HIGH` | `ticket.priority === 'HIGH'` |
| Resueltos hoy | `?status=RESOLVED&resolvedToday=true` | `resolvedAt >= startOfDay` |
| Por categoría | `?category=HARDWARE` | Filtro exacto |
| Búsqueda texto | `?q=proyector` | `title` o `description` ILIKE |

### Acciones del técnico

| Acción | Descripción |
|--------|-------------|
| Asignarse | `PATCH /tickets/:id/assign` — asigna `assigneeId` al técnico actual |
| Cambiar estado | `PATCH /tickets/:id/status` — con validación de transiciones |
| Agregar nota | `POST /tickets/:id/notes` — nota técnica visible en historial |
| Ver detalle | Navega a `/dashboard/tickets/[id]` con historial completo |

### Optimización de consultas

```
// Listado Kanban — solo campos necesarios
GET /api/tickets?fields=id,title,category,status,priority,location,createdAt,assignee.name

// Detalle completo
GET /api/tickets/:id
```

Respuesta paginada:

```json
{
  "data": [...],
  "meta": {
    "total": 142,
    "page": 1,
    "perPage": 20,
    "totalPages": 8
  }
}
```

---

## 4. Trazabilidad (Historial)

### Responsabilidad

Registrar cada evento significativo en el ciclo de vida de un ticket para auditoría y transparencia.

### Eventos registrados

| Evento | Trigger | Campos en historial |
|--------|---------|---------------------|
| `CREATED` | Creación del ticket | `userId`, `timestamp` |
| `STATUS_CHANGED` | Cambio de estado | `userId`, `oldStatus`, `newStatus`, `note?` |
| `ASSIGNED` | Asignación a técnico | `userId`, `assigneeId` |
| `NOTE_ADDED` | Nota técnica | `userId`, `note` |
| `PHOTO_ADDED` | Foto adjunta post-creación | `userId`, `photoUrl` |

### Modelo TicketHistory

Cada registro es inmutable (append-only). Ver [Modelo de datos](05-modelo-de-datos.md).

### Línea de tiempo (frontend)

```
┌─────────────────────────────────────────┐
│  Historial del ticket #42               │
├─────────────────────────────────────────┤
│  ● 06 Jul 2026, 14:30                   │
│    Juan Pérez cambió estado             │
│    Abierto → En progreso                │
│    "Revisando el proyector en sitio"    │
│                                         │
│  ● 06 Jul 2026, 10:15                   │
│  │ María García creó el ticket          │
│  └─────────────────────────────────────┘
```

### Reglas

- El historial no se edita ni elimina
- Cada cambio de estado genera automáticamente una entrada (el servicio de tickets invoca al servicio de history)
- Las notas técnicas son visibles para técnicos; el usuario ve solo cambios de estado y notas públicas

---

## Mapa de rutas (resumen)

### Frontend (Next.js)

| Ruta | Módulo |
|------|--------|
| `/login` | Auth |
| `/reportar` | Tickets |
| `/mis-tickets` | Tickets |
| `/mis-tickets/[id]` | Tickets + History |
| `/dashboard` | Dashboard |
| `/dashboard/tickets/[id]` | Dashboard + History |

### Backend (NestJS)

| Endpoint | Módulo |
|----------|--------|
| `POST /auth/login` | Auth |
| `POST /auth/register` | Auth |
| `GET /auth/me` | Auth |
| `POST /tickets` | Tickets |
| `GET /tickets` | Tickets |
| `GET /tickets/:id` | Tickets |
| `PATCH /tickets/:id/status` | Tickets + History |
| `PATCH /tickets/:id/assign` | Tickets + History |
| `POST /tickets/:id/notes` | Tickets + History |
| `GET /tickets/:id/history` | History |
