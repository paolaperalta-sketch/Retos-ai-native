#!/usr/bin/env python3
"""
Pronóstico de consumo eléctrico (kwh) por medidor.

Método:   Holt's Linear Exponential Smoothing (doble alisamiento)
          implementado con numpy puro — sin dependencias externas.
          Fallback a regresión lineal cuando hay < 4 meses de historia.

Input:    consumo_limpio.csv
Output:   pronostico_consumo.csv
"""

import warnings
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

INPUT_PATH  = "/Users/katerine/Downloads/consumo_limpio.csv"
OUTPUT_PATH = "/Users/katerine/Downloads/pronostico_consumo.csv"

N_FORECAST   = 3     # meses hacia el futuro
CONFIDENCE   = 0.80  # nivel de confianza del intervalo de predicción

# z-score para intervalos de predicción (normal aproximada)
Z = {0.80: 1.282, 0.90: 1.645, 0.95: 1.960}.get(CONFIDENCE, 1.282)


# ─────────────────────────────────────────────────────────────
# MODELOS DE PRONÓSTICO
# ─────────────────────────────────────────────────────────────

def holt_fit(y: np.ndarray, alpha: float, beta: float):
    """
    Ajusta Holt's Linear Trend a la serie y.
    Retorna (fitted_1step, L_final, T_final).
    """
    L = float(y[0])
    T = float(y[1] - y[0]) if len(y) > 1 else 0.0
    fitted = []
    for t in range(1, len(y)):
        F = L + T                                    # pronóstico 1-paso
        fitted.append(F)
        L_new = alpha * y[t] + (1 - alpha) * (L + T)
        T_new = beta  * (L_new - L) + (1 - beta) * T
        L, T = L_new, T_new
    return np.array(fitted), L, T


def holt_optimize(y: np.ndarray):
    """
    Busca (alpha, beta) que minimizan RMSE en muestra
    mediante búsqueda de cuadrícula (grid search).
    """
    best_rmse = np.inf
    best_a, best_b = 0.3, 0.1
    for a in np.arange(0.10, 1.00, 0.10):
        for b in np.arange(0.00, 0.55, 0.10):
            if len(y) < 2:
                break
            fitted, *_ = holt_fit(y, round(a, 1), round(b, 1))
            residuals = y[1:] - fitted
            rmse = np.sqrt(np.mean(residuals ** 2))
            if rmse < best_rmse:
                best_rmse = rmse
                best_a, best_b = round(a, 1), round(b, 1)
    return best_a, best_b, best_rmse


def forecast_holt(y: np.ndarray, n_ahead: int):
    """
    Pronóstico con Holt + intervalo de predicción.
    Intervalo: margin(h) = z * RMSE * sqrt(h)
    """
    alpha, beta, rmse = holt_optimize(y)
    _, L, T = holt_fit(y, alpha, beta)

    h = np.arange(1, n_ahead + 1, dtype=float)
    preds  = L + h * T
    margin = Z * rmse * np.sqrt(h)

    return (
        np.maximum(0, preds),
        np.maximum(0, preds - margin),
        preds + margin,
        rmse,
        f"Holt(α={alpha},β={beta})",
    )


def forecast_linreg(y: np.ndarray, n_ahead: int):
    """
    Pronóstico con regresión lineal + intervalo de predicción.
    PI = t_critical * s * sqrt(1 + 1/n + (x_new - x̄)² / Sxx)
    """
    n = len(y)
    x = np.arange(n, dtype=float)

    # Coeficientes por fórmula cerrada
    x_mean = x.mean()
    Sxx    = ((x - x_mean) ** 2).sum()
    slope  = (((x - x_mean) * (y - y.mean())).sum() / Sxx) if Sxx > 0 else 0.0
    intercept = y.mean() - slope * x_mean

    residuals = y - (slope * x + intercept)
    s = np.sqrt((residuals ** 2).sum() / max(n - 2, 1))  # error estándar

    # Tabla de t-críticos para PI al 80 % (una cola 10 %)
    t_table = {1: 3.08, 2: 1.89, 3: 1.64, 4: 1.53, 5: 1.48,
               6: 1.44, 7: 1.41, 8: 1.40, 9: 1.38, 10: 1.37}
    df = max(n - 2, 1)
    t_crit = t_table.get(df, 1.28)   # fallback: z normal para df grandes

    x_new  = np.arange(n, n + n_ahead, dtype=float)
    preds  = slope * x_new + intercept
    margin = t_crit * s * np.sqrt(1 + 1/n + (x_new - x_mean)**2 / max(Sxx, 1e-9))

    rmse = np.sqrt(np.mean(residuals ** 2))
    return (
        np.maximum(0, preds),
        np.maximum(0, preds - margin),
        preds + margin,
        rmse,
        "RegresionLineal",
    )


def forecast_constant(y: np.ndarray, n_ahead: int):
    """Fallback: media histórica ± 15 % cuando hay < 2 meses."""
    val = float(y.mean())
    return (
        np.full(n_ahead, val),
        np.full(n_ahead, val * 0.85),
        np.full(n_ahead, val * 1.15),
        float(y.std()) if len(y) > 1 else 0.0,
        "MediaConstante",
    )


def forecast_series(y: np.ndarray, n_ahead: int):
    """Elige el mejor modelo según número de puntos disponibles."""
    if len(y) >= 4:
        return forecast_holt(y, n_ahead)
    elif len(y) >= 2:
        return forecast_linreg(y, n_ahead)
    else:
        return forecast_constant(y, n_ahead)


# ─────────────────────────────────────────────────────────────
# 1. CARGAR Y AGREGAR A NIVEL MENSUAL
# ─────────────────────────────────────────────────────────────
df = pd.read_csv(INPUT_PATH)
df["fecha"] = pd.to_datetime(df["fecha"])

# Solo trabajar con filas que tienen medidor conocido
df = df[df["medidor"].notna()].copy()

df["yearmonth"] = df["fecha"].dt.to_period("M")

# Para cada (medidor, mes) rellenar metadata con el valor más frecuente del grupo
monthly = (
    df.groupby(["medidor", "yearmonth"])
    .agg(
        kwh=("kwh", "sum"),
        cliente=("cliente", "first"),
        documento=("documento", "first"),
        sector=("sector", "first"),
        ciudad=("ciudad", "first"),
    )
    .reset_index()
)
monthly["fecha_mes"] = monthly["yearmonth"].dt.to_timestamp()   # 1er día del mes
monthly = monthly.sort_values(["medidor", "fecha_mes"])

TODAY        = pd.Timestamp("today").normalize()
CURRENT_PERIOD = pd.Period(TODAY, "M")


# ─────────────────────────────────────────────────────────────
# 2. PRONOSTICAR POR MEDIDOR
# ─────────────────────────────────────────────────────────────
results = []
errores = []

for medidor_id, grp in monthly.groupby("medidor"):
    grp = grp.sort_values("fecha_mes")
    # Solo usar historia hasta el mes actual (excluir lecturas futuras del CSV)
    grp = grp[grp["yearmonth"] <= CURRENT_PERIOD]
    if grp.empty:
        continue
    ts  = grp["kwh"].values.astype(float)

    # Metadata del medidor (primer/último registro disponible)
    cliente   = grp["cliente"].iloc[-1]
    documento = grp["documento"].iloc[-1]
    sector    = grp["sector"].iloc[-1]
    ciudad    = grp["ciudad"].iloc[-1]

    # Fecha inicial del pronóstico = mes siguiente al último dato
    last_period  = grp["yearmonth"].max()
    next_months  = pd.period_range(start=last_period + 1, periods=N_FORECAST, freq="M")
    forecast_dates = [p.to_timestamp() for p in next_months]

    try:
        preds, lower, upper, rmse, metodo = forecast_series(ts, N_FORECAST)
    except Exception as e:
        errores.append(f"{cliente}/{medidor_id}: {e}")
        continue

    for i, fecha in enumerate(forecast_dates):
        results.append({
            "cliente":           cliente,
            "documento":         documento,
            "medidor":           medidor_id,
            "sector":            sector,
            "ciudad":            ciudad,
            "fecha_pronostico":  fecha.strftime("%Y-%m-%d"),
            "kwh_estimado":      round(float(preds[i]),  2),
            "kwh_lower_80":      round(float(lower[i]),  2),
            "kwh_upper_80":      round(float(upper[i]),  2),
            "rmse_historico":    round(float(rmse),       2),
            "n_meses_historia":  len(ts),
            "metodo":            metodo,
        })


# ─────────────────────────────────────────────────────────────
# 3. EXPORTAR CSV DE PRONÓSTICO
# ─────────────────────────────────────────────────────────────
out = pd.DataFrame(results)
out = out.sort_values(["cliente", "medidor", "fecha_pronostico"]).reset_index(drop=True)
out.to_csv(OUTPUT_PATH, index=False, encoding="utf-8-sig")


# ─────────────────────────────────────────────────────────────
# 4. RESUMEN EN CONSOLA
# ─────────────────────────────────────────────────────────────
n_medidores  = out[["cliente", "medidor"]].drop_duplicates().shape[0]
metodos      = out.groupby("metodo")["medidor"].nunique()
rmse_medio   = out.drop_duplicates("medidor")["rmse_historico"].mean()

print()
print("=" * 65)
print("  PRONÓSTICO DE CONSUMO ELÉCTRICO")
print("=" * 65)
print(f"  Horizonte            : {N_FORECAST} meses")
print(f"  Nivel de confianza   : {int(CONFIDENCE*100)}%  (intervalo kwh_lower / kwh_upper)")
print(f"  Medidores pronóstic. : {n_medidores}")
print(f"  Filas en CSV salida  : {len(out)}")
print(f"  RMSE promedio        : {rmse_medio:.2f} kwh")
if errores:
    print(f"  Errores              : {len(errores)}")
print()
print("  Modelos aplicados:")
for metodo, cnt in metodos.items():
    print(f"    {metodo:<42} {cnt:>2} medidor(es)")

# Muestra detallada de un medidor residencial y uno industrial
for lbl, cli, med in [
    ("Residencial → Carlos Ruiz",        "Carlos Ruiz",        "MED-003"),
    ("Industrial  → Plastiquim Ltda",    "Plastiquim Ltda",    "MED-015"),
]:
    sample = out[(out["cliente"] == cli) & (out["medidor"] == med)]
    if sample.empty:
        continue
    hist = monthly[(monthly["cliente"] == cli) & (monthly["medidor"] == med)]["kwh"]
    print()
    print(f"  {lbl}")
    print(f"    Historia mensual (kwh): {' | '.join(f'{v:.0f}' for v in hist.values)}")
    print(f"    {'Fecha':<12}  {'Estimado':>10}  {'Lower 80%':>10}  {'Upper 80%':>10}")
    for _, row in sample.iterrows():
        print(f"    {row['fecha_pronostico']:<12}  "
              f"{row['kwh_estimado']:>10.1f}  "
              f"{row['kwh_lower_80']:>10.1f}  "
              f"{row['kwh_upper_80']:>10.1f}")

print()
print(f"  CSV guardado en:\n  {OUTPUT_PATH}")
print("=" * 65)
print()
