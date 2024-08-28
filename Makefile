test:
	npm test

dev:
	npm run dev

check-types:
	npx tsc

routes:
	npx fastify print-routes routes/users.js

migration-generate:
	npx drizzle-kit generate

lint:
	npx eslint .

lint-fix:
	npx eslint --fix .

types-to-openapi:
	npx tsp compile .

types-to-typebox:
	npx openapi-box ./tsp-output/@typespec/openapi3/openapi.v1.json

types: types-to-openapi types-to-typebox

tsp-build:

.PHONY: test routes
