FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY web-apps/admin/package*.json ./web-apps/admin/
COPY web-apps/client/package*.json ./web-apps/client/
COPY web-apps/docsNlogs/package*.json ./web-apps/docsNlogs/

RUN npm install

# Copy source files
COPY . .

# Build production bundles
RUN npm run build:server
RUN npm run build:admin
RUN npm run build:client
RUN npm run build:docs

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "dist-server/index.js"]
