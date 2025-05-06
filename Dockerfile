FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

ENV NODE_ENV=development
RUN npm install

COPY . .

EXPOSE 3001

CMD ["sh", "-c", "npm run prisma:generate && npm run dev"]