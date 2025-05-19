FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json tsconfig.json ./

RUN npm install

COPY . .
COPY prisma ./prisma

RUN npx prisma generate
RUN npm run build && test -f dist/main.js || (ls -la dist && exit 1)

FROM node:20-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

CMD ["npm", "run", "start"]
