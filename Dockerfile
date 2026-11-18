FROM node:26-slim AS deps
ARG PNPM_VERSION=12.6.0
RUN npm install -g pnpm@$PNPM_VERSION
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM node:26-slim AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
WORKDIR /app
USER node
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node migrations ./migrations
COPY --chown=node:node generated ./generated
COPY --chown=node:node tsp-output ./tsp-output
EXPOSE 3000
CMD ["node", "src/start.ts"]
