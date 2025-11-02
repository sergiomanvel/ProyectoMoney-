FROM node:22

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json del root y backend
COPY package*.json ./
COPY backend/package*.json ./backend/

# Copiar código fuente del backend
COPY backend/ ./backend/

# Instalar TODAS las dependencias (necesitamos TypeScript para compilar)
RUN cd backend && npm ci

# Compilar TypeScript
RUN cd backend && npm run build

# Eliminar node_modules y reinstalar solo production (para imagen final más pequeña)
RUN cd backend && rm -rf node_modules && npm ci --omit=dev

# Exponer puerto
EXPOSE 8080

# Variables de entorno serán inyectadas por Railway
ENV NODE_ENV=production

# Comando de inicio
CMD ["node", "backend/dist/server.js"]

