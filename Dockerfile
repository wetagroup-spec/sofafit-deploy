FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 3000

# DB tables are created automatically by the server at startup (see api/bootstrap-db.ts)
CMD ["npm", "start"]
