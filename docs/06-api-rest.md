# API REST

Contrato de la API del backend NestJS. Base URL: `{API_URL}/api/v1`.

## Convenciones

| Aspecto | Estándar |
|---------|----------|
| Formato | JSON |
| Autenticación | `Authorization: Bearer <token>` |
| Paginación | `?page=1&perPage=20` |
| Campos selectivos | `?fields=id,title,status` |
| Errores | `{ "statusCode": 400, "message": "...", "errors": [...] }` |
| Éxito con datos | `{ "data": ... }` |
| Éxito con lista | `{ "data": [...], "meta": { "total", "page", "perPage", "totalPages" } }` |

## Autenticación

### POST `/auth/register`

Registro de nuevo usuario (rol `USER` por defecto).

**Body:**
```json
{
  "email": "maria@campus.edu",
  "password": "securePass123",
  "name": "María García"
}
```

**Respuesta `201`:**
```json
{
  "data": {
    "accessToken": "eyJhbG...",
    "user": {
      "id": "clx...",
      "email": "maria@campus.edu",
      "name": "María García",
      "role": "USER"
    }
  }
}
```

### POST `/auth/login`

**Body:**
```json
{
  "email": "tecnico@fixdesk.dev",
  "password": "securePass123"
}
```

**Respuesta `200`:** Misma estructura que register.

**Errores:**
- `401` — Credenciales inválidas

### GET `/auth/me`

Retorna el usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Respuesta `200`:**
```json
{
  "data": {
    "id": "clx...",
    "email": "tecnico@fixdesk.dev",
    "name": "Juan Técnico",
    "role": "TECHNICIAN",
    "area": { "id": "...", "name": "Hardware y equipos" }
  }
}
```

---

## Tickets

### POST `/tickets`

Crea un nuevo ticket. Requiere autenticación.

**Roles:** `USER`, `TECHNICIAN`

**Body:**
```json
{
  "title": "Proyector no enciende en Lab 3",
  "category": "HARDWARE",
  "location": "Laboratorio 3, Edificio B, Piso 2",
  "description": "El proyector del techo no responde al control remoto ni al botón de encendido. La lámpara de estado está apagada.",
  "photoUrl": "https://supabase.co/storage/.../foto.jpg",
  "priority": "HIGH"
}
```

**Respuesta `201`:**
```json
{
  "data": {
    "id": "clx...",
    "title": "Proyector no enciende en Lab 3",
    "category": "HARDWARE",
    "status": "OPEN",
    "priority": "HIGH",
    "location": "Laboratorio 3, Edificio B, Piso 2",
    "description": "...",
    "photoUrl": "https://...",
    "reporter": { "id": "...", "name": "María García" },
    "assignee": null,
    "createdAt": "2026-07-06T18:30:00.000Z"
  }
}
```

**Errores:**
- `400` — Validación fallida (campos obligatorios, longitudes)
- `401` — No autenticado

### GET `/tickets`

Lista tickets con filtros y paginación.

**Roles y scoping:**
- `USER` → solo tickets propios (`reporterId = me`)
- `TECHNICIAN` → tickets de su área o asignados a él
- `ADMIN` → todos

**Query params:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `page` | number | Página (default: 1) |
| `perPage` | number | Items por página (default: 20, max: 100) |
| `status` | string | Filtro por estado |
| `priority` | string | Filtro por prioridad |
| `category` | string | Filtro por categoría |
| `assigneeId` | string | `me` para tickets asignados al usuario actual |
| `resolvedToday` | boolean | Solo resueltos hoy |
| `q` | string | Búsqueda en título y descripción |
| `fields` | string | Campos a retornar (comma-separated) |
| `sort` | string | Campo de ordenamiento (default: `-createdAt`) |

**Ejemplo:**
```
GET /tickets?status=OPEN&priority=HIGH&fields=id,title,status,priority,location,createdAt&page=1
```

**Respuesta `200`:**
```json
{
  "data": [
    {
      "id": "clx...",
      "title": "Proyector no enciende en Lab 3",
      "status": "OPEN",
      "priority": "HIGH",
      "location": "Laboratorio 3, Edificio B, Piso 2",
      "createdAt": "2026-07-06T18:30:00.000Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "perPage": 20,
    "totalPages": 3
  }
}
```

### GET `/tickets/:id`

Detalle completo de un ticket.

**Autorización:**
- `USER` → solo si `reporterId === me`
- `TECHNICIAN` → si es de su área o está asignado

**Respuesta `200`:**
```json
{
  "data": {
    "id": "clx...",
    "title": "...",
    "description": "...",
    "category": "HARDWARE",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "location": "...",
    "photoUrl": "...",
    "reporter": { "id": "...", "name": "María García", "email": "..." },
    "assignee": { "id": "...", "name": "Juan Técnico" },
    "area": { "id": "...", "name": "Hardware y equipos" },
    "resolvedAt": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errores:**
- `403` — Sin permiso para ver este ticket
- `404` — Ticket no encontrado

### PATCH `/tickets/:id/status`

Cambia el estado de un ticket.

**Roles:** `TECHNICIAN`, `ADMIN`

**Body:**
```json
{
  "status": "IN_PROGRESS",
  "note": "Revisando el proyector en sitio"
}
```

**Respuesta `200`:** Ticket actualizado.

**Errores:**
- `400` — Transición de estado inválida
- `403` — Sin permiso

### PATCH `/tickets/:id/assign`

Asigna el ticket a un técnico.

**Roles:** `TECHNICIAN`, `ADMIN`

**Body:**
```json
{
  "assigneeId": "clx..."
}
```

Si `assigneeId` se omite, se auto-asigna al técnico autenticado.

**Respuesta `200`:** Ticket actualizado con assignee.

### POST `/tickets/:id/notes`

Agrega una nota técnica al ticket.

**Roles:** `TECHNICIAN`, `ADMIN`

**Body:**
```json
{
  "note": "Se requiere lámpara de repuesto modelo XYZ-200"
}
```

**Respuesta `201`:**
```json
{
  "data": {
    "id": "clx...",
    "eventType": "NOTE_ADDED",
    "note": "Se requiere lámpara de repuesto modelo XYZ-200",
    "user": { "id": "...", "name": "Juan Técnico" },
    "createdAt": "2026-07-06T19:00:00.000Z"
  }
}
```

---

## Historial

### GET `/tickets/:id/history`

Retorna la línea de tiempo del ticket, ordenada por `createdAt` descendente.

**Autorización:** Misma que `GET /tickets/:id`.

**Respuesta `200`:**
```json
{
  "data": [
    {
      "id": "clx...",
      "eventType": "STATUS_CHANGED",
      "oldStatus": "OPEN",
      "newStatus": "IN_PROGRESS",
      "note": "Revisando el proyector en sitio",
      "user": { "id": "...", "name": "Juan Técnico" },
      "createdAt": "2026-07-06T19:00:00.000Z"
    },
    {
      "id": "clx...",
      "eventType": "CREATED",
      "user": { "id": "...", "name": "María García" },
      "createdAt": "2026-07-06T18:30:00.000Z"
    }
  ]
}
```

---

## Health check

### GET `/health`

Sin autenticación. Para monitoreo y evitar cold starts.

**Respuesta `200`:**
```json
{
  "status": "ok",
  "timestamp": "2026-07-06T20:00:00.000Z",
  "db": "connected"
}
```

---

## Códigos de estado HTTP

| Código | Uso |
|--------|-----|
| `200` | Lectura o actualización exitosa |
| `201` | Recurso creado |
| `400` | Validación fallida o transición inválida |
| `401` | Token ausente o expirado |
| `403` | Rol insuficiente o recurso ajeno |
| `404` | Recurso no encontrado |
| `500` | Error interno |

## Rate limiting (fase 2)

| Endpoint | Límite sugerido |
|----------|-----------------|
| `POST /auth/login` | 10 req/min por IP |
| `POST /tickets` | 5 req/min por usuario |
| `GET /tickets` | 60 req/min por usuario |
