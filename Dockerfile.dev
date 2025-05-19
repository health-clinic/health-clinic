FROM node:20-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

ENV NODE_ENV=development

RUN npm install

COPY . .

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --force-reset && npm run dev"]