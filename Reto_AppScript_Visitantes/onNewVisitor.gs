// 🔒 Guarda tu webhook en Apps Script > Configuración del proyecto > Propiedades del script
// Clave: SLACK_WEBHOOK_URL
const SLACK_WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty("SLACK_WEBHOOK_URL");

function onNewVisitor(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;
  
  if (range.getRow() < 3) return;
  
  const row = range.getRow();
  const documento = sheet.getRange(row, 3).getValue(); // Col C
  const nombre    = sheet.getRange(row, 4).getValue(); // Col D
  const fecha     = sheet.getRange(row, 5).getValue(); // Col E
  const placa     = sheet.getRange(row, 6).getValue(); // Col F (opcional)

  // Solo enviar si los campos obligatorios están completos (placa es opcional)
  if (!documento || !nombre || !fecha) return;

  // Evitar duplicados
  const props = PropertiesService.getScriptProperties();
  const key = `enviado_fila_${row}`;
  if (props.getProperty(key)) return;
  props.setProperty(key, "true");

  const placaTexto = placa ? `🚗 *Placa:* ${placa}\n` : "";

  const mensaje = {
    text: `<!channel> 🔔 *Nuevo visitante registrado en BIA*\n` +
          `👤 *Nombre:* ${nombre}\n` +
          `🪪 *Documento:* ${documento}\n` +
          `📅 *Fecha entrada:* ${fecha}\n` +
          placaTexto
  };

  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(mensaje)
  });
}
