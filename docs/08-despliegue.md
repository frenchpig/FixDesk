<!--
Responsabilidad: guiar el despliegue gratuito y reproducible de FixDesk.
Usado por: responsables de publicar la demo desde GitHub.
NO hace: configurar Storage, correo, colas ni un entorno productivo con SLA.
-->

# Despliegue gratuito de FixDesk

Esta guía publica la demo con la siguiente arquitectura:

```text
Vercel (Next.js) → Koyeb (NestJS + Bun) → Supabase (PostgreSQL)
```

Está pensada para una demostración personal y no comercial. Los planes gratuitos
pueden suspender servicios inactivos y no ofrecen garantías de disponibilidad.

## 1. Antes de empezar

Necesitas:

- El repositorio actualizado en GitHub.
- Cuentas gratuitas en [Supabase](https://supabase.com),
  [Koyeb](https://koyeb.com) y [Vercel](https://vercel.com).
- Bun 1.3.13 o compatible instalado localmente.
- Una rama que Koyeb y Vercel puedan desplegar, por ejemplo `develop`.

Comprueba el proyecto antes de subirlo:

```bash
bun install --frozen-lockfile
bun run build
```

No subas archivos `.env` ni copies secretos dentro del código fuente.

## 2. Crear PostgreSQL en Supabase

1. En Supabase, selecciona **New project**.
2. Elige una región cercana a la región de Koyeb.
3. Guarda la contraseña de la base de datos.
4. Abre **Connect** y copia la URL de **Session pooler**, puerto `5432`.

Para una API persistente como Koyeb, Session pooler es la opción más simple:

```text
postgresql://postgres.PROJECT_REF:PASSWORD@HOST.pooler.supabase.com:5432/postgres
```

Configura ambas variables con esa URL:

```text
DATABASE_URL=URL_SESSION_POOLER
DIRECT_URL=URL_SESSION_POOLER
```

`DATABASE_URL` es usada por Prisma Client y `DIRECT_URL` por Prisma CLI para las
migraciones. Si se cambia la API a un entorno serverless, puede usarse el
Transaction pooler en `DATABASE_URL` (puerto `6543` y `?pgbouncer=true`) y
mantener Session pooler en `DIRECT_URL`.

### Crear tablas y datos demo

Desde `apps/api`, puedes aplicar migraciones y el seed de forma manual (útil en
setup local o la primera vez que creas la base):

```bash
cd apps/api

DATABASE_URL="URL_SESSION_POOLER" \
DIRECT_URL="URL_SESSION_POOLER" \
bun run db:migrate:deploy

DATABASE_URL="URL_SESSION_POOLER" \
DIRECT_URL="URL_SESSION_POOLER" \
bun run db:seed
```

En el contenedor de producción (Koyeb, Render, etc.) **no es obligatorio**
ejecutar el seed a mano: `start:deploy` ya corre migraciones y resiembra la
demo en cada arranque.

El seed crea áreas, etiquetas, workflow, SLA, tickets de ejemplo y estas
cuentas:

| Rol | Usuario | Contraseña |
|---|---|---|
| Usuario | `usuario@fixdesk.dev` | `fixdesk123` |
| Técnico | `tecnico@fixdesk.dev` | `fixdesk123` |
| Administrador | `admin@fixdesk.dev` | `fixdesk123` |

## 3. Publicar la API en Koyeb

1. En Koyeb, selecciona **Create Web Service** y conecta GitHub.
2. Selecciona el repositorio y la rama que contiene los cambios.
3. Usa **Dockerfile** como builder.
4. Conserva la raíz del repositorio como **Work directory**.
5. Usa `apps/api/Dockerfile` como ruta del archivo de construcción.
6. Selecciona la instancia **Free**.
7. Expón el puerto HTTP `3001`.
8. Configura el health check `GET /api/v1/health`.

El contenedor ejecuta `prisma migrate deploy` y luego `db:seed` antes de
arrancar la API (`start:deploy`). Cada reinicio o spin-up **borra los datos
previos y vuelve a generar la demo** (usuarios, tickets, historial,
notificaciones, labels y workflow). Los cambios hechos durante una sesión se
pierden al reiniciar el servicio.

El seed tarda unos segundos (hash de contraseñas + tickets de ejemplo). Si el
health check falla en el primer boot, aumenta el grace period / startup timeout
del servicio (p. ej. 60–90 s).

### Variables de Koyeb

```text
DATABASE_URL=URL_SESSION_POOLER
DIRECT_URL=URL_SESSION_POOLER
JWT_SECRET=SECRETO_LARGO_Y_ALEATORIO
JWT_EXPIRES_IN=7d
PORT=3001
CORS_ORIGIN=https://temporal.invalid
THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=120
AUTH_THROTTLE_TTL_MS=60000
AUTH_THROTTLE_LIMIT=10
SLA_TARGET_HOURS=48
```

Genera `JWT_SECRET` localmente:

```bash
openssl rand -base64 48
```

No reutilices el secreto de desarrollo. Después del deploy, guarda la URL
asignada por Koyeb:

```text
https://NOMBRE-API.koyeb.app
```

Verifica:

```bash
curl https://NOMBRE-API.koyeb.app/api/v1/health
```

La respuesta debe incluir `status: "ok"` y `db: "connected"`.

## 4. Publicar el frontend en Vercel

1. Importa el mismo repositorio en Vercel.
2. Selecciona **Next.js** como framework.
3. Configura **Root Directory** como `apps/web`.
4. Selecciona la misma rama de producción usada para la demo.
5. Agrega esta variable antes de compilar:

```text
NEXT_PUBLIC_API_URL=https://NOMBRE-API.koyeb.app/api/v1
```

6. Ejecuta el deploy y guarda la URL estable de producción:

```text
https://NOMBRE-WEB.vercel.app
```

`NEXT_PUBLIC_API_URL` queda incorporada durante el build. Si cambia la URL de la
API, hay que reconstruir el frontend.

## 5. Terminar la configuración de CORS

En Koyeb, reemplaza el valor temporal:

```text
CORS_ORIGIN=https://NOMBRE-WEB.vercel.app
```

Guarda la configuración y espera el nuevo deploy de la API.

El backend acepta un único origen exacto. Usa la URL de producción de Vercel;
las URLs variables de Preview no están habilitadas.

## 6. Verificación posterior

### Health y Swagger

```text
GET https://NOMBRE-API.koyeb.app/api/v1/health
GET https://NOMBRE-API.koyeb.app/api/docs
```

### Login por API

```bash
curl -X POST https://NOMBRE-API.koyeb.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tecnico@fixdesk.dev","password":"fixdesk123"}'
```

Debe responder con un token JWT.

### Flujo en navegador

1. Abre la URL de Vercel.
2. Inicia sesión como usuario y crea un ticket.
3. Inicia sesión como técnico y asigna o cambia el estado del ticket.
4. Comprueba el historial, las notificaciones y los reportes.
5. Inicia sesión como administrador y verifica SLA y workflow.

Las notificaciones usan Socket.IO en `/notifications`. Si el servicio se
despierta o se reinicia, el cliente reconecta y conserva polling REST como
respaldo.

### Comprobar rate limiting

La API limita peticiones por IP. Login y registro tienen un límite más estricto.
Al superar el límite configurado debe responder HTTP `429 Too Many Requests`.

## 7. Restaurar la demo

En hosting, reiniciar el servicio de la API ya restaura la demo (via
`start:deploy` → `db:seed`).

Para un reset total local o forzado (incluye `migrate reset`):

> ADVERTENCIA: es destructivo. Úsalo exclusivamente con la base descartable de
> la demo; nunca con datos reales.

```bash
cd apps/api

DATABASE_URL="URL_SESSION_POOLER" \
DIRECT_URL="URL_SESSION_POOLER" \
bun run db:reset:demo
```

El seed restaura nombres, roles, contraseñas, áreas, etiquetas, SLA, estados
predeterminados y el set de tickets demo.

## 8. Límites y seguridad de la demo

- Vercel Hobby solo permite proyectos personales y no comerciales.
- Koyeb Free ofrece una instancia de 512 MB y escala a cero después de una hora
  sin tráfico. El primer acceso posterior tendrá cold start.
- Supabase Free puede pausar proyectos con poca actividad durante una semana.
  Confirma que esté activo antes de presentar la demo.
- La cuenta administradora y su contraseña aparecen en la pantalla de login.
  Cualquier visitante puede modificar SLA, workflow y datos de demostración.
- Login y registro tienen rate limiting, pero no CAPTCHA ni verificación de
  correo. Revisa periódicamente la base y usa el reset cuando sea necesario.
- No cargues información personal o confidencial.

## 9. Funcionalidades no desplegadas

- Los adjuntos son placeholders: no se envían bytes ni se usa Supabase Storage.
- No hay envío de correo.
- No existen Redis, colas ni workers.
- No hay backups automáticos en el plan gratuito.
- El realtime está diseñado para una única instancia; no usa adaptador Redis.

No configures `SUPABASE_SERVICE_KEY`, buckets ni SMTP para esta versión.

## 10. Resolución de problemas

### El health check responde error

- Confirma que Supabase esté activo.
- Revisa `DATABASE_URL` y `DIRECT_URL`.
- Verifica que la contraseña esté correctamente codificada en la URL.
- Consulta los logs de Koyeb para errores de `prisma migrate deploy`.

### El frontend muestra errores de red

- Confirma que `NEXT_PUBLIC_API_URL` termina en `/api/v1`.
- Vuelve a desplegar Vercel después de cambiar esa variable.
- Comprueba que `CORS_ORIGIN` coincide exactamente con la URL del frontend.

### La API no arranca

- Confirma que Koyeb usa la raíz del repositorio como Work directory.
- Comprueba que el builder use `apps/api/Dockerfile`.
- Verifica que estén definidas `DATABASE_URL`, `DIRECT_URL` y `JWT_SECRET`.

### El primer acceso tarda

Es normal después del scale-to-zero de Koyeb. Abre primero el health check y
espera una respuesta correcta antes de presentar la demo.
