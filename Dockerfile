FROM node:22

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json del root y backend
COPY package*.json ./
COPY backend/package*.json ./backend/

# Instalar dependencias
RUN cd backend && npm ci --omit=dev

# Copiar código fuente del backend
COPY backend/ ./backend/

# Compilar TypeScript
RUN cd backend && npm run build

# Exponer puerto
EXPOSE 8080

# Variables de entorno serán inyectadas por Railway
ENV NODE_ENV=production

# Comando de inicio
CMD ["node", "backend/dist/server.js"]

