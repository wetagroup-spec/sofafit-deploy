FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
ENV NODE_ENV=development

RUN npm config set fund false \
 && npm config set audit false \
 && npm cache clean --force \
 && (npm ci --include=dev --no-audit --no-fund --unsafe-perm=true \
     || (echo "npm ci failed, retrying..." && npm install --include=dev --no-audit --no-fund --unsafe-perm=true)) \
 && npx vite --version \
 && npx esbuild --version

COPY . .
RUN npm run build

RUN npm prune --omit=dev && mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
