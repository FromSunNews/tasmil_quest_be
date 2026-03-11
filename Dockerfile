FROM node:20-alpine AS base
# Install Python and build tools for native dependencies
RUN apk add --no-cache python3 make g++ git
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./
# Install ALL dependencies including devDependencies for development
RUN npm ci
COPY src ./src  
COPY . .

FROM base AS builder
RUN npm run build
# Debug: List contents of dist directory
RUN ls -la dist/

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=base /usr/src/app/package*.json ./
# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /usr/src/app/dist ./dist
# Debug: List contents to verify files are copied
RUN ls -la dist/
CMD ["node", "dist/main.js"]