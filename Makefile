test:
	pnpm test

dev:
	pnpm run dev

check-types:
	pnpm exec tsc

routes:
	pnpm exec fastify print-routes routes/api/users.js

migration-generate:
	pnpm exec drizzle-kit generate

lint:
	pnpm --silent run lint
	pnpm exec tsc
	pnpm --silent run format:check

lint-fix:
	pnpm --silent run lint:fix

generate-openapi:
	pnpm exec tsp compile .

generate-openapi-ts-types:
# 	# pnpm exec openapi-box ./tsp-output/@typespec/openapi3/openapi.v1.json
	# pnpm exec openapi-typescript ./tsp-output/@typespec/openapi3/openapi.v1.json -o types/openapi.ts
	pnpm exec openapi-ts

generate-types: generate-openapi generate-openapi-ts-types

mock:
	pnpm exec prism mock ./tsp-output/@typespec/openapi3/openapi.v1.json

tsp-build:

.PHONY: test routes

install:
	pnpm install
