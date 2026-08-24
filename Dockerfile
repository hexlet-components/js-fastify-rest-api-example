# Сборки нет намеренно: tsconfig стоит на noEmit, а node 26 исполняет
# TypeScript сам, снимая типы. Поэтому образ копирует исходники как есть.
FROM node:26-slim AS deps

# Тулчейна для нативных модулей больше нет: PGlite — wasm, собирать под
# платформу нечего.

# corepack из образов node 26 убран, поэтому pnpm ставится явно — версией из
# packageManager, чтобы лок-файл читался тем же, что и локально.
ARG PNPM_VERSION=11.22.0
RUN npm install -g pnpm@$PNPM_VERSION

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM node:26-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Непривилегированный пользователь: образ node его уже содержит.
USER node

COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node drizzle ./drizzle
COPY --chown=node:node tsp-output ./tsp-output

EXPOSE 3000

# Через node_modules напрямую, а не pnpm exec: в рантайме pnpm не нужен.
#
# --plugin-timeout поднят с дефолтных 10 секунд: drizzle поднимает PGlite и
# прогоняет миграции, и на холодном старте в контейнере с урезанным CPU это
# укладывается не всегда. Без запаса контейнер просто не поднимется.
CMD ["node", "node_modules/fastify-cli/cli.js", "start", "-l", "info", "-a", "0.0.0.0", "--plugin-timeout", "60000", "src/app.ts"]
