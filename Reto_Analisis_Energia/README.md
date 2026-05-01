# ⚡ Reto — Análisis y Pronóstico de Consumo Eléctrico

## ¿Qué hace este proyecto?
Análisis de datos de medidores de energía eléctrica con dos scripts Python:
generación de métricas clave y pronóstico de consumo futuro por medidor.

## Archivos

### `analyze_energy.py`
Analiza los datos crudos de medidores y genera un CSV resumen con:
- **Resumen global**: total de registros, energía activa, factor de potencia, tensiones, alertas
- **Métricas por fecha**: consumo diario, alertas, registros HES
- **Métricas por hora**: hora pico de consumo
- **Top 10 fechas** con mayor consumo y más alertas

### `pronosticar_consumo.py`
Pronostica el consumo eléctrico (kWh) de los próximos 3 meses por medidor usando:
- **Holt's Linear Exponential Smoothing** (cuando hay ≥ 4 meses de historia)
- **Regresión Lineal** (cuando hay 2–3 meses de historia)
- **Media Constante** (fallback con < 2 meses)

Incluye intervalos de predicción al 80% de confianza.

### `resumen_metricas_energia.csv`
Output generado por `analyze_energy.py` con todas las métricas calculadas.

## Herramientas usadas
- Python 3
- pandas
- numpy

## Cómo ejecutar
```bash
pip install pandas numpy
python analyze_energy.py
python pronosticar_consumo.py
```
