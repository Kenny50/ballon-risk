FROM node:20-slim

WORKDIR /app

COPY ./package*.json ./
RUN npm ci
COPY . .

CMD ["sh", "-c", "npm run dev"]