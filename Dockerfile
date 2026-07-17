FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
ARG CACHEBUST=2
ENV NODE_ENV=development
RUN echo "cachebust $CACHEBUST" && npm ci --include=dev && npx vite --version

COPY . .
RUN npm run build

RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
