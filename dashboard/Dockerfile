FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto de la aplicación
COPY . .

# Build de la aplicación
RUN npm run build

# Puerto
EXPOSE 3001

# Comando de inicio
CMD ["npm", "start"]
