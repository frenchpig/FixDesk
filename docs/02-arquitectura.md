# Arquitectura y stack tecnológico

## Principios de diseño

1. **Desacoplamiento total** — Frontend y backend son aplicaciones independientes que se comunican exclusivamente vía API REST.
2. **Costo cero** — Toda la infraestructura debe caber en tiers gratuitos sin sacrificar funcionalidad core.
3. **Eficiencia de recursos** — Bun como runtime del backend reduce consumo de memoria frente a Node.js tradicional.
4. **Consultas selectivas** — El cliente solicita solo los campos necesarios para cada vista (listado vs. detalle).

## Diagrama de arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                               │
│  Next.js (App Router) — Vercel                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  Pages   │  │Components│  │  Hooks   │                  │
│  │ (RSC/CSR)│  │ Tailwind │  │  fetch   │                  │
│  └────┬─────┘  └──────────┘  └────┬─────┘                  │
└───────┼────────────────────────────┼────────────────────────┘
        │         HTTPS / JSON       │
        ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API REST                                 │
│  NestJS + Bun — Koyeb / Render                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Controllers│ │ Services │  │   DTOs   │  │  Guards  │   │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └──────────┘   │
│       │             │                                        │
│       │      ┌──────┴──────┐                                │
│       │      │   Prisma    │                                │
│       │      │   Client    │                                │
│       │      └──────┬──────┘                                │
└───────┼─────────────┼───────────────────────────────────────┘
        │             │
        ▼             ▼
┌──────────────┐  ┌──────────────┐
│  Supabase    │  │ Supabase     │
│  Auth (opt.) │  │ PostgreSQL   │
└──────────────┘  └──────────────┘
```

## Stack por capa

### Frontend — Next.js (App Router)

| Aspecto | Decisión |
|---------|----------|
| Renderizado | Híbrido: RSC para layouts y datos estáticos; CSR para formularios e interacciones |
| Estilos | Tailwind CSS 4 — configuración vía variables CSS globales, sin `tailwind.config.js` |
| Estado | React hooks + fetch nativo (sin Redux en MVP) |
| Validación | Zod en cliente antes de enviar al backend |
| Hosting | Vercel (tier gratuito) |

### Backend — NestJS + Bun

| Aspecto | Decisión |
|---------|----------|
| Estructura | Módulos por dominio: `auth`, `tickets`, `users`, `history` |
| Validación | `class-validator` + DTOs en cada endpoint |
| Auth | JWT firmado por NestJS, o delegado a Supabase Auth |
| ORM | Prisma con migraciones versionadas |
| Runtime | Bun (`bun run start:prod`) |
| Hosting | Koyeb o Render (tier gratuito, ~512 MB RAM) |

### Base de datos — PostgreSQL (Supabase)

| Aspecto | Decisión |
|---------|----------|
| Conexión | Connection string vía variable de entorno `DATABASE_URL` |
| Pooling | Supabase PgBouncer en modo transaction para serverless |
| Migraciones | `prisma migrate deploy` en CI/CD |
| Storage | Supabase Storage para fotos adjuntas a tickets |

## Módulos NestJS (planeados)

```
apps/api/src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   └── guards/
│       ├── jwt-auth.guard.ts
│       └── roles.guard.ts
├── tickets/
│   ├── tickets.module.ts
│   ├── tickets.controller.ts
│   ├── tickets.service.ts
│   └── dto/
│       ├── create-ticket.dto.ts
│       └── update-ticket.dto.ts
├── history/
│   ├── history.module.ts
│   └── history.service.ts      # Llamado internamente por tickets.service
├── users/
│   └── ...
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
```

## Comunicación frontend ↔ backend

```
Frontend                          Backend
────────                          ───────
GET  /api/tickets?fields=id,title,status,createdAt
                                  → Prisma select parcial
                                  → 200 { data: [...], meta: { total, page } }

POST /api/tickets
  Body: CreateTicketDto           → Validación DTO
                                  → Prisma create + history entry
                                  → 201 { data: ticket }

PATCH /api/tickets/:id/status
  Body: { status, note? }         → Verificar rol técnico
                                  → Transición de estado válida
                                  → Crear TicketHistory
                                  → 200 { data: ticket }
```

## Autenticación

### Opción A — JWT propio (NestJS)

```
Login → AuthService valida credenciales → firma JWT { sub, role }
Request → JwtAuthGuard → extrae payload → RolesGuard verifica permisos
```

### Opción B — Supabase Auth

```
Login → Supabase Auth → access_token
Request → NestJS valida token con Supabase JWT secret → extrae user
```

**Recomendación MVP:** Opción A para menor acoplamiento. Migrar a Supabase Auth si se necesita OAuth social.

## Consideraciones de rendimiento (tier gratuito)

| Riesgo | Mitigación |
|--------|------------|
| Cold start en Koyeb/Render | Health check endpoint; keep-alive con cron externo (opcional) |
| Límite de memoria (~512 MB) | Bun en lugar de Node; evitar cargar relaciones innecesarias |
| Conexiones DB limitadas | PgBouncer de Supabase; `connection_limit=1` en Prisma |
| Payloads grandes (fotos) | Subir a Supabase Storage; guardar solo URL en ticket |

## Variables de entorno

### Backend (`apps/api/.env`)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
SUPABASE_URL=...          # Solo si se usa Supabase Storage/Auth
SUPABASE_SERVICE_KEY=...
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### Frontend (`apps/web/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```
