test:
	npm test

dev:
	npm run dev

migration-generate:
	npx drizzle-kit generate

lint:
	npx eslint .

lint-fix:
	npx eslint --fix .

types-to-openapi:
	npx tsp compile .

types-to-typebox:
	npx openapi-box ./tsp-output/@typespec/openapi3/openapi.json

tsp-build:

.PHONY: test
