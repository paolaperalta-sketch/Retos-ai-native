"""
Análisis de datos de medidor de energía eléctrica
Genera un CSV resumen con métricas clave agrupadas por fecha y hora.
"""

import pandas as pd
import numpy as np

INPUT_FILE = "/mnt/user-data/uploads/query_result_2026-03-26T17_03_56_322828954Z__1_.csv"
OUTPUT_FILE = "/mnt/user-data/outputs/resumen_metricas_energia.csv"

# ── 1. Carga ──────────────────────────────────────────────────────────────────
print("Cargando datos...")
df = pd.read_csv(INPUT_FILE)
df["date"] = pd.to_datetime(df["date"])

print(f"  Filas totales   : {len(df):,}")
print(f"  Medidores únicos: {df['meter_id'].nunique()}")
print(f"  Período         : {df['date'].min().date()} → {df['date'].max().date()}")
print()

# ── 2. Métricas globales del dataset ─────────────────────────────────────────
global_metrics = {
    "total_registros": len(df),
    "medidores_unicos": df["meter_id"].nunique(),
    "contratos_unicos": df["contract_id"].nunique(),
    "fecha_inicio": df["date"].min().date(),
    "fecha_fin": df["date"].max().date(),
    "dias_cubiertos": (df["date"].max() - df["date"].min()).days + 1,
    # Energía activa
    "energia_activa_total_kwh": df["active_energy"].sum().round(2),
    "energia_activa_promedio_kwh": df["active_energy"].mean().round(4),
    "energia_activa_max_kwh": df["active_energy"].max(),
    "energia_activa_min_kwh": df["active_energy"].min(),
    "energia_activa_std": df["active_energy"].std().round(4),
    # Energía reactiva
    "reactiva_capacitiva_total": df["reactive_capacitive"].sum().round(2),
    "reactiva_inductiva_total": df["reactive_inductive_total"].sum().round(2),
    "reactiva_inductiva_penalizada_total": df["reactive_inductive_penalized"].sum(),
    # Factor de potencia
    "fp_total_promedio": df["total_power_factor"].mean().round(4),
    "fp_total_min": df["total_power_factor"].min(),
    "fp_total_max": df["total_power_factor"].max(),
    # Tensiones promedio
    "tension_fase_a_promedio_v": df["phase_a_voltage"].mean().round(2),
    "tension_fase_b_promedio_v": df["phase_b_voltage"].mean().round(2),
    "tension_fase_c_promedio_v": df["phase_c_voltage"].mean().round(2),
    # Corrientes promedio
    "corriente_fase_a_promedio_a": df["phase_a_current"].mean().round(4),
    "corriente_fase_b_promedio_a": df["phase_b_current"].mean().round(4),
    "corriente_fase_c_promedio_a": df["phase_c_current"].mean().round(4),
    # Desviaciones y alertas
    "desviacion_max_horas_promedio": df["deviation_maximum_hours"].mean().round(4),
    "alertas_desviacion_max_horas": int(df["alert_deviation_maximum_hours"].sum()),
    "alertas_desviacion_curva_avg": int(df["alert_deviation_average_curve"].sum()),
    "pct_registros_con_alerta": round(
        df["alert_deviation_maximum_hours"].sum() / len(df) * 100, 2
    ),
    # Fuente de datos
    "registros_hes": int(df["is_hes"].sum()),
    "registros_backup": int(df["is_backup"].sum()),
    "pct_hes": round(df["is_hes"].sum() / len(df) * 100, 2),
}

df_global = pd.DataFrame([global_metrics]).T.reset_index()
df_global.columns = ["metrica", "valor"]
df_global.insert(0, "seccion", "RESUMEN_GLOBAL")

# ── 3. Métricas por fecha ─────────────────────────────────────────────────────
daily = (
    df.groupby("date")
    .agg(
        registros=("id", "count"),
        energia_activa_total=("active_energy", "sum"),
        energia_activa_promedio=("active_energy", "mean"),
        energia_activa_max=("active_energy", "max"),
        fp_promedio=("total_power_factor", "mean"),
        fp_min=("total_power_factor", "min"),
        tension_a_promedio=("phase_a_voltage", "mean"),
        tension_b_promedio=("phase_b_voltage", "mean"),
        tension_c_promedio=("phase_c_voltage", "mean"),
        corriente_a_promedio=("phase_a_current", "mean"),
        alertas_desviacion=("alert_deviation_maximum_hours", "sum"),
        registros_hes=("is_hes", "sum"),
    )
    .round(4)
    .reset_index()
)
daily["pct_alertas"] = (daily["alertas_desviacion"] / daily["registros"] * 100).round(2)
daily.insert(0, "seccion", "POR_FECHA")
daily.rename(columns={"date": "fecha_hora"}, inplace=True)

# ── 4. Métricas por hora del día ──────────────────────────────────────────────
hourly = (
    df.groupby("hour")
    .agg(
        registros=("id", "count"),
        energia_activa_promedio=("active_energy", "mean"),
        energia_activa_total=("active_energy", "sum"),
        fp_promedio=("total_power_factor", "mean"),
        tension_a_promedio=("phase_a_voltage", "mean"),
        corriente_a_promedio=("phase_a_current", "mean"),
        alertas_desviacion=("alert_deviation_maximum_hours", "sum"),
    )
    .round(4)
    .reset_index()
)
hourly["pct_alertas"] = (hourly["alertas_desviacion"] / hourly["registros"] * 100).round(2)
hourly.insert(0, "seccion", "POR_HORA")
hourly.rename(columns={"hour": "fecha_hora"}, inplace=True)

# ── 5. Top 10 fechas con mayor consumo ────────────────────────────────────────
top_consumo = (
    daily.nlargest(10, "energia_activa_total")[
        ["seccion", "fecha_hora", "registros", "energia_activa_total", "fp_promedio", "alertas_desviacion"]
    ]
    .copy()
)
top_consumo["seccion"] = "TOP10_MAYOR_CONSUMO"

# ── 6. Top 10 fechas con más alertas ─────────────────────────────────────────
top_alertas = (
    daily.nlargest(10, "alertas_desviacion")[
        ["seccion", "fecha_hora", "registros", "energia_activa_total", "alertas_desviacion", "pct_alertas"]
    ]
    .copy()
)
top_alertas["seccion"] = "TOP10_MAS_ALERTAS"

# ── 7. Exportar todo en un solo CSV con secciones ────────────────────────────
print("Generando CSV resumen...")

# Sección global: pivot estilo key-value
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("### SECCIÓN: RESUMEN_GLOBAL\n")
df_global.to_csv(OUTPUT_FILE, mode="a", index=False)

with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
    f.write("\n### SECCIÓN: MÉTRICAS_POR_FECHA\n")
daily.to_csv(OUTPUT_FILE, mode="a", index=False)

with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
    f.write("\n### SECCIÓN: MÉTRICAS_POR_HORA\n")
hourly.to_csv(OUTPUT_FILE, mode="a", index=False)

with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
    f.write("\n### SECCIÓN: TOP10_MAYOR_CONSUMO\n")
top_consumo.to_csv(OUTPUT_FILE, mode="a", index=False)

with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
    f.write("\n### SECCIÓN: TOP10_MAS_ALERTAS\n")
top_alertas.to_csv(OUTPUT_FILE, mode="a", index=False)

print(f"\n✅ CSV resumen generado: {OUTPUT_FILE}")

# ── 8. Imprime resumen rápido en consola ─────────────────────────────────────
print("\n" + "="*55)
print("RESUMEN EJECUTIVO")
print("="*55)
print(f"  Período          : {global_metrics['fecha_inicio']} → {global_metrics['fecha_fin']}")
print(f"  Días cubiertos   : {global_metrics['dias_cubiertos']}")
print(f"  Total registros  : {global_metrics['total_registros']:,}")
print(f"  Energía total    : {global_metrics['energia_activa_total_kwh']:,.2f} kWh")
print(f"  Energía promedio : {global_metrics['energia_activa_promedio_kwh']} kWh/registro")
print(f"  FP promedio      : {global_metrics['fp_total_promedio']}")
print(f"  Alertas desv.    : {global_metrics['alertas_desviacion_max_horas']:,} ({global_metrics['pct_registros_con_alerta']}%)")
print(f"  Registros HES    : {global_metrics['registros_hes']:,} ({global_metrics['pct_hes']}%)")
hora_pico = hourly.loc[hourly["energia_activa_promedio"].idxmax(), "fecha_hora"]
print(f"  Hora pico consumo: {hora_pico}:00 h")
print("="*55)
