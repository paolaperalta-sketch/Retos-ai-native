-- Update baseline & target for loaded KRs from source Excel
DO $$
DECLARE r record;
BEGIN
  -- Use a CTE-style bulk update via a temp table
END $$;

-- Direct updates (192 statements)
UPDATE key_results SET baseline=0.2, target=0.5 WHERE name='CENTRALIZAR EL 100% DE LAS FUENTES Y PESOS DE DATOS RELEVANTES DEL CLIENTE (CONSUMO, PAGOS, INCIDENCIAS, CSAT, NPS, INTERACCIONES, FACTURACIÓN, COMPETITIVIDAD, ETC) EN UNA ÚNICA FUENTE CONECTADA AL MODELO DE CUSTOMER HEALTH SCORE' AND upper(coalesce(assigned_full_name,'')) LIKE '%DAMARIS%' AND upper(coalesce(assigned_full_name,'')) LIKE '%BERMUDEZ%';