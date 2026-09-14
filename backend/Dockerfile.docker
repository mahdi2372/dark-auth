FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

RUN mkdir -p uploads

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node src/index.js"]
