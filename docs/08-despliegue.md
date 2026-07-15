# Despliegue

Guía para desplegar FixDesk con **costo $0** usando tiers gratuitos de Vercel, Supabase y Koyeb (o Render).

## Arquitectura de despliegue

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────→│ Koyeb/Render│────→│  Supabase   │
│  (Next.js)  │     │ (NestJS+Bun)│     │ (PostgreSQL)│
│  Frontend   │     │   Backend   │     │  + Storage  │
└─────────────┘     └─────────────┘     └─────────────┘
     Gratis              Gratis              Gratis
```

## Prerrequisitos

- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Koyeb](https://koyeb.com) o [Render](https://render.com)
- [Bun](https://bun.sh) instalado localmente
- Repositorio Git (GitHub recomendado)

---

## 1. Supabase (Base de datos + Storage)

### Crear proyecto

1. Ir a [supabase.com/dashboard](https://supabase.com/dashboard) → New Project
2. Elegir región cercana a los usuarios
3. Guardar la contraseña de la base de datos

### Obtener connection strings

En **Settings → Database**:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Connection string con **PgBouncer** (puerto 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Connection string directa (puerto 5432) para migraciones |

### Configurar Storage

1. **Storage → New bucket** → nombre: `ticket-photos`
2. Política: lectura pública, escritura autenticada
3. Guardar `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` (Settings → API)

### Ejecutar migraciones

```bash
cd apps/api
DATABASE_URL="postgresql://..." DIRECT_URL="postgresql://..." bunx prisma migrate deploy
bunx prisma db seed  # Datos de desarrollo
```

---

## 2. Backend (NestJS + Bun en Koyeb)

### Preparar el Dockerfile

```dockerfile
# apps/api/Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lockb ./
COPY apps/api/package.json ./apps/api/
RUN bun install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages ./packages

WORKDIR /app/apps/api
RUN bunx prisma generate

EXPOSE 3001
CMD ["bun", "run", "start:prod"]
```

### Variables de entorno (Koyeb)

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Connection string PgBouncer de Supabase |
| `DIRECT_URL` | Connection string directa |
| `JWT_SECRET` | String aleatorio de 64+ caracteres |
| `JWT_EXPIRES_IN` | `7d` |
| `PORT` | `3001` |
| `CORS_ORIGIN` | URL del frontend en Vercel |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | Service role key |

### Desplegar en Koyeb

1. Conectar repositorio GitHub
2. Tipo: **Web Service** con Dockerfile
3. Puerto: `3001`
4. Instancia: **Nano** (gratis — 512 MB RAM, ecomode)
5. Health check path: `/api/v1/health`
6. Agregar variables de entorno

### Alternativa: Render

1. New → Web Service → conectar repo
2. Runtime: Docker
3. Plan: Free (se duerme tras 15 min de inactividad)
4. Mismas variables de entorno

> **Nota:** Render free tier tiene cold starts de ~30 s. Koyeb ecomode es más estable para APIs.

---

## 3. Frontend (Next.js en Vercel)

### Variables de entorno (Vercel)

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | URL del backend en Koyeb (ej. `https://fixdesk-api.koyeb.app/api/v1`) |

### Desplegar

1. Importar repositorio en [vercel.com](https://vercel.com)
2. Framework preset: **Next.js**
3. Root directory: `apps/web`
4. Agregar variable de entorno
5. Deploy

Vercel detecta automáticamente Next.js y configura build/deploy.

---

## 4. Configurar CORS

En el backend NestJS, asegurar que `CORS_ORIGIN` apunte a la URL de producción del frontend:

```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
});
```

---

## 5. Verificación post-despliegue

```bash
# Health check del backend
curl https://fixdesk-api.koyeb.app/api/v1/health

# Login de prueba
curl -X POST https://fixdesk-api.koyeb.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tecnico@fixdesk.dev","password":"..."}'

# Frontend
open https://fixdesk.vercel.app
```

---

## Límites del tier gratuito

| Servicio | Límite | Impacto | Mitigación |
|----------|--------|---------|------------|
| **Vercel** | 100 GB bandwidth/mes | Bajo para uso interno | Suficiente para campus mediano |
| **Supabase** | 500 MB DB, 1 GB storage | Medio a largo plazo | Limpiar fotos antiguas; comprimir imágenes |
| **Supabase** | 2 proyectos activos | Bajo | Un proyecto por entorno |
| **Koyeb** | 1 Nano service | Bajo | Suficiente para MVP |
| **Koyeb** | 512 MB RAM | Medio | Bun + queries selectivas |
| **Render** | Sleep tras 15 min | Alto (cold start) | Cron keep-alive o preferir Koyeb |

---

## CI/CD (recomendado)

### GitHub Actions — migraciones automáticas

```yaml
# .github/workflows/deploy-api.yml
name: Deploy API
on:
  push:
    branches: [main]
    paths: ['apps/api/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: cd apps/api && bunx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
```

Vercel y Koyeb despliegan automáticamente al push a `main`.

---

## Entornos

| Entorno | Frontend | Backend | Base de datos |
|---------|----------|---------|---------------|
| Local | `localhost:3000` | `localhost:3001` | Supabase local o Docker |
| Staging | `fixdesk-staging.vercel.app` | `fixdesk-api-staging.koyeb.app` | Proyecto Supabase staging |
| Producción | `fixdesk.vercel.app` | `fixdesk-api.koyeb.app` | Proyecto Supabase prod |

---

## Desarrollo local

```bash
# Clonar e instalar
git clone <repo> && cd FixDesk
bun install

# Configurar entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Editar .env con credenciales de Supabase

# Base de datos
cd apps/api
bunx prisma migrate dev
bunx prisma db seed

# Levantar servicios
cd ../..
bun run dev          # Levanta frontend + backend en paralelo
```

### Supabase local (opcional)

```bash
npx supabase init
npx supabase start   # PostgreSQL local en Docker
```

---

## Monitoreo (fase 2)

| Herramienta | Costo | Uso |
|-------------|-------|-----|
| [Better Stack](https://betterstack.com) | Gratis (10 monitors) | Uptime del health check |
| [Sentry](https://sentry.io) | Gratis (5K events/mes) | Errores en frontend y backend |
| Supabase Dashboard | Incluido | Queries lentas, uso de storage |
