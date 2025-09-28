# Backend NestJS Dockerfile
FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apk add --no-cache openssl netcat-openbsd

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Tornar o script executável
RUN chmod +x start.sh

# Expor porta
EXPOSE 3001

# Comando para iniciar o backend
CMD ["./start.sh"]
