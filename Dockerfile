FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
ENV NODE_ENV=development
RUN npm ci --include=dev

COPY . .
RUN npm run build

RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
