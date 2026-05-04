#!/bin/bash

echo "🐳 Probando Docker para ops-module-work-orders"
echo "============================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Construir la imagen
echo -e "${YELLOW}1. Construyendo la imagen Docker...${NC}"
docker-compose build --no-cache

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al construir la imagen${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Imagen construida correctamente${NC}"
echo ""

# 2. Iniciar el contenedor
echo -e "${YELLOW}2. Iniciando el contenedor...${NC}"
docker-compose up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al iniciar el contenedor${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contenedor iniciado${NC}"
echo ""

# 3. Esperar a que el contenedor esté listo
echo -e "${YELLOW}3. Esperando a que el contenedor esté listo...${NC}"
sleep 5

# 4. Verificar estado del contenedor
echo -e "${YELLOW}4. Estado del contenedor:${NC}"
docker-compose ps
echo ""

# 5. Ver logs
echo -e "${YELLOW}5. Últimos logs del contenedor:${NC}"
docker-compose logs --tail=20
echo ""

# 6. Probar el healthcheck
echo -e "${YELLOW}6. Probando healthcheck endpoint...${NC}"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health-check)

if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Healthcheck OK (Status: $HEALTH_STATUS)${NC}"
    curl -s http://localhost:3000/health-check | jq . || curl -s http://localhost:3000/health-check
else
    echo -e "${RED}❌ Healthcheck falló (Status: $HEALTH_STATUS)${NC}"
fi
echo ""

# 7. Probar la página principal
echo -e "${YELLOW}7. Probando página principal...${NC}"
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)

if [ "$MAIN_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Página principal accesible (Status: $MAIN_STATUS)${NC}"
else
    echo -e "${RED}❌ Página principal no accesible (Status: $MAIN_STATUS)${NC}"
fi
echo ""

# 8. Verificar archivos en el contenedor
echo -e "${YELLOW}8. Verificando archivos en el contenedor...${NC}"
docker-compose exec ops-module-work-orders ls -la /usr/share/nginx/html/ | head -10
echo ""

# Resumen
echo -e "${YELLOW}============================================"
echo "📋 Resumen:"
echo "============================================${NC}"
echo ""
echo "🌐 Aplicación disponible en: http://localhost:3000"
echo "🏥 Healthcheck disponible en: http://localhost:3000/health-check"
echo ""
echo "Para ver logs en tiempo real:"
echo "  docker-compose logs -f"
echo ""
echo "Para detener el contenedor:"
echo "  docker-compose down"
echo ""
echo "Para reiniciar:"
echo "  docker-compose restart"
echo ""

