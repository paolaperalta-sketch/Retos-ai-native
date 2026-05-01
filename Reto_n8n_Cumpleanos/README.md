# 🎂 Flujo n8n — Cumpleaños

## ¿Qué hace este flujo?
Automatiza la creación de tarjetas de cumpleaños personalizadas en Google Slides cuando se agrega una nueva fila en Google Sheets.

## Pasos del flujo
1. **Google Sheets Trigger** — Detecta cuando se agrega una nueva fila en la hoja "Cumpleaños"
2. **HTTP Request** — Duplica una slide plantilla en la presentación de Google Slides
3. **Replace Text** — Reemplaza el placeholder `{{Nombre}}` con el nombre real de la persona

## Herramientas usadas
- n8n
- Google Sheets
- Google Slides API

## Cómo importar
1. Abre n8n
2. Ve a **Workflows** → **Import from file**
3. Selecciona `Cumpleanos.json`
4. Configura tus credenciales de Google
