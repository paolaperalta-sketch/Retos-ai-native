# -------------------------
# 1) BUILD: Construcción del proyecto React
# -------------------------
  FROM node:20-alpine AS build

  ENV PATH="/opt/venv/bin:$PATH"
  
  # Establecer directorio de trabajo
  WORKDIR /app
  
  ARG NPMRC
  RUN echo -e $NPMRC > .npmrc && \
      cat .npmrc
  # Copiar archivos de dependencias
  COPY package*.json ./
  COPY yarn.lock* ./
  
  # Instalar dependencias
  RUN yarn install --frozen-lockfile || npm ci
  
  # Copiar el resto del proyecto
  COPY . .
  
  # Construir la aplicación usando craco directamente (sin dotenv-cli)
  # Las variables ya están disponibles como ENV
  RUN yarn craco build || npx craco build
    
  # -------------------------
  # 2) RUN: Servir con Nginx
  # -------------------------
  FROM nginx:stable-alpine
  
  # Instalar wget para healthcheck
  RUN apk add --no-cache wget
  
  # Eliminar configuraciones por defecto
  RUN rm -rf /etc/nginx/conf.d/*
  
  # Eliminar SOLO el script que genera el warning sobre default.conf
  # Este script compara archivos y genera warnings innecesarios
  RUN rm -f /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
  
  # Copiar tu configuración personalizada con nombre diferente
  # para evitar comparaciones con la versión empaquetada
  COPY nginx.conf /etc/nginx/conf.d/app.conf
  
  # Validar configuración de nginx
  RUN nginx -t
  
  # Copiar los archivos build de React
  COPY --from=build /app/build /usr/share/nginx/html
  
  # Verificar que index.html existe
  RUN test -f /usr/share/nginx/html/index.html || (echo "ERROR: index.html no encontrado" && exit 1)
  
  # Exponer puerto (nginx escucha en 80 por defecto)
  EXPOSE 80
  
  # Healthcheck
  HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health-check || exit 1
  
  # Iniciar Nginx
  CMD ["nginx", "-g", "daemon off;"]