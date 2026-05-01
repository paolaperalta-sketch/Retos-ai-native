# 🔔 Reto — Notificación de Visitantes en Slack (Apps Script)

## ¿Qué hace este script?
Cuando se registra un nuevo visitante en Google Sheets, envía automáticamente una notificación al canal de Slack con los datos del visitante.

## Flujo
1. Se agrega una nueva fila en Google Sheets (registro de visitante)
2. El trigger `onNewVisitor` se dispara automáticamente
3. Lee los datos: documento, nombre, fecha y placa (opcional)
4. Envía un mensaje a Slack via webhook con la info del visitante
5. Guarda en `PropertiesService` que esa fila ya fue enviada (evita duplicados)

## Estructura del Google Sheet
| Col | Campo |
|-----|-------|
| C | Documento |
| D | Nombre |
| E | Fecha de entrada |
| F | Placa (opcional) |

> Las filas 1 y 2 se ignoran (encabezados).

## Cómo instalar
1. Abre tu Google Sheet
2. Ve a **Extensiones → Apps Script**
3. Pega el código de `onNewVisitor.gs`
4. Crea un trigger: **Editar → Activadores → + Añadir activador**
   - Función: `onNewVisitor`
   - Evento: **Al editar** la hoja de cálculo
5. Reemplaza `SLACK_WEBHOOK_URL` con tu webhook real

## Herramientas usadas
- Google Apps Script
- Google Sheets
- Slack Incoming Webhooks
