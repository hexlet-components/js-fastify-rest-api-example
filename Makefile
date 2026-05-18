test:
	npm test

dev:
	npm run dev

check-types:
	./node_modules/.bin/tsc

routes:
	npx fastify print-routes routes/api/users.js

migration-generate:
	npx drizzle-kit generate

lint:
	./node_modules/.bin/biome check .
	./node_modules/.bin/tsc

lint-fix:
	./node_modules/.bin/biome check . --write

generate-openapi:
	npx tsp compile .

generate-openapi-ts-types:
# 	# npx openapi-box ./tsp-output/@typespec/openapi3/openapi.v1.json
	# npx openapi-typescript ./tsp-output/@typespec/openapi3/openapi.v1.json -o types/openapi.ts
	npx openapi-ts

generate-types: generate-openapi generate-openapi-ts-types

mock:
	npx prism mock ./tsp-output/@typespec/openapi3/openapi.v1.json

tsp-build:

.PHONY: test routes
