# 📨 Flujo n8n — Respuesta Referidores

## ¿Qué hace este flujo?
Automatiza el envío de correos a referidores cuando su candidato avanza (o no) en el proceso de selección de Bia.

## Pasos del flujo
1. **Webhook** — Recibe el evento desde el sistema de reclutamiento con el stage del candidato
2. **If Culture Fit** — ¿Llegó a Culture Fit? → Envía email de avance importante
3. **If RPS, HS1, HS2** — ¿Está en etapas intermedias? → Envía email de avance general
4. **If Hire** — ¿Fue contratado?
   - ✅ **Sí** → Email de felicitación + info del bono de referidos
   - ❌ **No** → Email de agradecimiento informando que no continuó

## Emails que envía
| Etapa | Mensaje |
|-------|---------|
| Culture Fit | "Tu referido está a un paso de unirse a Bia 🚀" |
| RPS / HS1 / HS2 | "Tu referido ha avanzado a la siguiente etapa 🎉" |
| Hire | "¡Tu referido fue contratado! + info bono 🤑" |
| No Hire | "Gracias por tu referido 🙌" |

## Herramientas usadas
- n8n
- Webhook
- Gmail

## Cómo importar
1. Abre n8n
2. Ve a **Workflows** → **Import from file**
3. Selecciona `Respuesta_Referidores.json`
4. Configura tus credenciales de Gmail
