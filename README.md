# FixDesk

Sistema de gestión de incidencias de infraestructura para campus educativos y grandes corporaciones. Permite reportar, asignar y resolver problemas como equipos defectuosos, fallas de red o desperfectos en instalaciones.

> Inspirado en flujos tipo Jira, optimizado para equipos de mantenimiento y usuarios finales sin formación técnica.

## Casos de uso típicos

- Proyector defectuoso en un laboratorio de informática
- Caída de red en un edificio o pabellón
- Desperfecto en zona de bicicleteros o áreas comunes
- Fallas eléctricas o de climatización en espacios compartidos

## Stack tecnológico

| Capa        | Tecnología                          | Hosting (gratuito)   |
|-------------|-------------------------------------|----------------------|
| Frontend    | Next.js (App Router) + Tailwind 4   | Vercel               |
| Backend     | NestJS + Bun                        | Koyeb / Render       |
| Base de datos | PostgreSQL + Prisma               | Supabase             |
| Auth        | JWT (NestJS) o Supabase Auth        | —                    |

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [Visión y alcance](docs/01-vision-y-alcance.md) | Problema, usuarios, objetivos |
| [Arquitectura](docs/02-arquitectura.md) | Microservicios, stack, comunicación |
| [Sistema de diseño](docs/03-diseno-ui.md) | Paleta, tipografía, componentes |
| [Módulos funcionales](docs/04-modulos-funcionales.md) | Auth, tickets, dashboard, historial |
| [Modelo de datos](docs/05-modelo-de-datos.md) | Esquema Prisma y relaciones |
| [API REST](docs/06-api-rest.md) | Endpoints, DTOs, códigos de respuesta |
| [Flujos de trabajo](docs/07-flujos-de-trabajo.md) | Estados, transiciones, reglas de negocio |
| [Despliegue](docs/08-despliegue.md) | Guía de despliegue con costo $0 |

## Estructura del monorepo (planeada)

```
FixDesk/
├── apps/
│   ├── web/          # Next.js — frontend
│   └── api/          # NestJS — backend
├── packages/
│   └── shared/       # Tipos y constantes compartidos
└── docs/             # Documentación del proyecto
```

## Inicio rápido

```bash
# Instalar dependencias (desde la raíz del monorepo)
cd FixDesk
bun install

# Variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Base de datos (PostgreSQL local)
cd apps/api
bunx prisma db push
bun run db:seed

# Desarrollo — en terminales separadas
bun run dev:api   # http://localhost:3001
bun run dev:web   # http://localhost:3000
```

### Credenciales de prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `tecnico@fixdesk.dev` | `fixdesk123` | Técnico |
| `usuario@fixdesk.dev` | `fixdesk123` | Usuario |

## Licencia

Por definir.
