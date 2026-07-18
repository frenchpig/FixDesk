# Responsabilidad: construir y ejecutar la API NestJS con Bun en Koyeb
# Usado por: despliegue del servicio web desde apps/api
# NO hace: alojar el frontend ni almacenar datos persistentes

FROM oven/bun:1.3.13

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN bun install --frozen-lockfile

COPY apps/api ./apps/api

WORKDIR /app/apps/api
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    DIRECT_URL="postgresql://build:build@localhost:5432/build" \
    bun run db:generate
RUN bun run build

ENV NODE_ENV=production

EXPOSE 3001

CMD ["bun", "run", "start:deploy"]
