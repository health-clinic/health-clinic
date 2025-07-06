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
    apt-get install -y --no-install-recommends openssl curl && \
    npm install -g ngrok && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

CMD [ "sh", "-c", "\
  ngrok config add-authtoken 2jhspFRBKhCgPYLRRpin072m0vQ_5X7Xayo22DszybPB4DFHh && \
  ngrok http 3001 > /dev/null & \
  sleep 5 && \
  curl --silent http://127.0.0.1:4040/api/tunnels | tee /dev/stderr && \
  npm run start" ]
