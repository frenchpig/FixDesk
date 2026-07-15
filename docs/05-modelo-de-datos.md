# Modelo de datos

Esquema PostgreSQL gestionado con Prisma. Diseñado para el MVP con extensibilidad futura.

## Diagrama entidad-relación

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│    User      │       │    Ticket    │       │  TicketHistory   │
├──────────────┤       ├──────────────┤       ├──────────────────┤
│ id           │──┐    │ id           │──┐    │ id               │
│ email        │  │    │ title        │  │    │ ticketId    ─────┤
│ passwordHash │  │    │ description  │  │    │ eventType        │
│ name         │  │    │ category     │  │    │ oldStatus?       │
│ role         │  ├───→│ reporterId   │  ├───→│ newStatus?       │
│ areaId?      │  │    │ assigneeId?──┼──┐    │ note?            │
│ createdAt    │  │    │ status       │  │    │ metadata? (JSON) │
│ updatedAt    │  │    │ priority     │  │    │ userId      ─────┤
└──────────────┘  │    │ location     │  │    │ createdAt        │
       │          │    │ photoUrl?    │  │    └──────────────────┘
       │          │    │ areaId?      │  │
       ▼          │    │ resolvedAt?  │  │
┌──────────────┐  │    │ createdAt    │  │
│    Area      │  │    │ updatedAt    │  │
├──────────────┤  │    └──────────────┘  │
│ id           │──┘           ▲          │
│ name         │              │          │
│ description? │         ┌────┴─────┐    │
└──────────────┘         │ assignee │────┘
                         │ (User)   │
                         └──────────┘
```

## Schema Prisma

```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Para migraciones con PgBouncer
}

enum Role {
  USER
  TECHNICIAN
  ADMIN
}

enum TicketCategory {
  HARDWARE
  NETWORK
  INFRASTRUCTURE
  ELECTRICAL
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  PENDING
  RESOLVED
  CANCELLED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
}

enum HistoryEventType {
  CREATED
  STATUS_CHANGED
  ASSIGNED
  NOTE_ADDED
  PHOTO_ADDED
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(USER)
  areaId       String?
  area         Area?    @relation(fields: [areaId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  reportedTickets Ticket[]        @relation("Reporter")
  assignedTickets Ticket[]        @relation("Assignee")
  historyEntries  TicketHistory[]

  @@index([role])
  @@index([areaId])
}

model Area {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())

  technicians User[]
  tickets     Ticket[]
}

model Ticket {
  id          String         @id @default(cuid())
  title       String
  description String
  category    TicketCategory
  status      TicketStatus   @default(OPEN)
  priority    TicketPriority @default(MEDIUM)
  location    String
  photoUrl    String?

  reporterId String
  reporter   User   @relation("Reporter", fields: [reporterId], references: [id])

  assigneeId String?
  assignee   User?  @relation("Assignee", fields: [assigneeId], references: [id])

  areaId String?
  area   Area?  @relation(fields: [areaId], references: [id])

  resolvedAt DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  history TicketHistory[]

  @@index([status])
  @@index([priority])
  @@index([category])
  @@index([reporterId])
  @@index([assigneeId])
  @@index([createdAt])
  @@index([status, priority])
}

model TicketHistory {
  id        String           @id @default(cuid())
  ticketId  String
  ticket    Ticket           @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  eventType HistoryEventType
  oldStatus TicketStatus?
  newStatus TicketStatus?
  note      String?
  metadata  Json?

  userId String
  user   User   @relation(fields: [userId], references: [id])

  createdAt DateTime @default(now())

  @@index([ticketId])
  @@index([createdAt])
}
```

## Descripción de entidades

### User

Representa tanto a reportantes como a técnicos. El campo `role` determina permisos. Los técnicos pueden tener un `areaId` que define qué tickets ven en su dashboard.

### Area

Agrupa técnicos por especialidad o zona física (ej. "Redes", "Edificio Central"). Un ticket puede heredar el área según la categoría o asignarse manualmente.

### Ticket

Entidad central. Estados iniciales siempre `OPEN`. `resolvedAt` se establece automáticamente al pasar a `RESOLVED`.

### TicketHistory

Tabla append-only. Nunca se actualiza ni elimina (excepto cascade al borrar ticket). El campo `metadata` almacena datos extra en JSON (ej. `{ "photoUrl": "..." }`).

## Índices

| Tabla | Índice | Razón |
|-------|--------|-------|
| Ticket | `(status, priority)` | Filtro combinado en dashboard |
| Ticket | `createdAt` | Ordenamiento y "resueltos hoy" |
| Ticket | `reporterId` | "Mis tickets" del usuario |
| Ticket | `assigneeId` | "Mis tickets asignados" del técnico |
| TicketHistory | `ticketId` | Línea de tiempo por ticket |

## Datos semilla (seed)

```typescript
// prisma/seed.ts — datos de ejemplo para desarrollo

const areas = [
  { name: 'Hardware y equipos', description: 'Proyectores, PCs, periféricos' },
  { name: 'Redes y conectividad', description: 'WiFi, switches, cableado' },
  { name: 'Infraestructura física', description: 'Mobiliario, bicicleteros, señalética' },
  { name: 'Instalaciones eléctricas', description: 'Iluminación, tomas, tableros' },
];

const users = [
  { email: 'tecnico@fixdesk.dev', role: 'TECHNICIAN', area: 'Hardware y equipos' },
  { email: 'usuario@fixdesk.dev', role: 'USER' },
];
```

## Migraciones

```bash
# Crear migración
bunx prisma migrate dev --name init

# Aplicar en producción
bunx prisma migrate deploy

# Seed de desarrollo
bunx prisma db seed
```

## Consideraciones

- **IDs:** `cuid()` para URLs amigables y orden cronológico aproximado
- **Soft delete:** No implementado en MVP; tickets cancelados usan estado `CANCELLED`
- **Fotos:** Solo se almacena la URL; el archivo vive en Supabase Storage
- **PgBouncer:** Usar `directUrl` para migraciones; `DATABASE_URL` con `?pgbouncer=true` para queries
