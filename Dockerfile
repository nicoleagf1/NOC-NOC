# Usa la versión oficial de Node.js 20 en Alpine (ligera)
FROM node:20-alpine AS base

# 1. Instalar dependencias solo cuando es necesario
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar dependencias
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# 2. Reconstruir el código fuente solo cuando sea necesario
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Deshabilitar telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED 1

# Compilar proyecto Next.js
RUN npm run build

# 3. Imagen de producción, copiar solo lo necesario
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos públicos estáticos
COPY --from=builder /app/public ./public

# Crear y asignar permisos a la carpeta .next
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Aprovechar el output 'standalone' de Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# Al usar output: 'standalone', se crea un server.js mínimo
CMD ["node", "server.js"]
