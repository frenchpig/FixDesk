# Visión y alcance

## Problema

En campus educativos y corporaciones grandes, los reportes de infraestructura suelen dispersarse en correos, mensajes internos o hojas de cálculo. Esto genera:

- Pérdida de trazabilidad sobre quién atendió qué y cuándo
- Duplicación de reportes del mismo incidente
- Falta de visibilidad para el usuario que reportó el problema
- Dificultad para priorizar incidencias críticas (red caída vs. lámpara fundida)

## Solución

FixDesk centraliza el ciclo de vida de incidencias de infraestructura en una plataforma web con dos experiencias diferenciadas:

1. **Portal del usuario** — reportar problemas de forma simple, con foto y ubicación
2. **Panel del técnico** — gestionar, asignar y resolver tickets con historial completo

## Usuarios del sistema

| Rol | Descripción | Permisos principales |
|-----|-------------|----------------------|
| **Usuario** | Estudiante, docente o empleado que detecta un problema | Crear tickets, subir fotos, ver estado de sus propios reportes |
| **Técnico** | Personal de mantenimiento o TI | Ver tickets de su área, cambiar estados, agregar notas técnicas, asignarse tickets |
| **Administrador** *(futuro)* | Coordinador del área de infraestructura | Gestionar usuarios, categorías, áreas y métricas globales |

## Objetivos del MVP

- [ ] Autenticación con roles (Usuario / Técnico)
- [ ] Creación de tickets con categoría, ubicación, descripción y foto opcional
- [ ] Tablero Kanban o tabla paginada para técnicos
- [ ] Historial de cambios de estado con línea de tiempo
- [ ] Filtros rápidos: mis tickets, alta prioridad, resueltos hoy
- [ ] Modo oscuro nativo

## Fuera de alcance (MVP)

- Notificaciones push o por correo
- SLA y escalamiento automático
- Integración con sistemas de inventario
- App móvil nativa
- Multi-tenant (múltiples organizaciones en una instancia)

## Métricas de éxito

| Métrica | Objetivo |
|---------|----------|
| Tiempo medio de primera respuesta | < 4 horas laborables |
| Tickets sin asignar > 24 h | < 5 % del total activo |
| Tasa de resolución con foto adjunta | > 60 % (mejor diagnóstico) |
| Satisfacción del reportante | Encuesta post-cierre (fase 2) |

## Contexto de despliegue

El sistema está diseñado para operar con **costo $0** en tiers gratuitos de Vercel, Supabase y Koyeb/Render, priorizando eficiencia de memoria (Bun en backend) y consultas optimizadas (campos selectivos desde el frontend).
