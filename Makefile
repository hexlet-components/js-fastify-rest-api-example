install:
	pnpm install --frozen-lockfile
setup: install env

env:
	@test -f .env || cp .env.example .env

dev:
	pnpm run dev
start:
	pnpm start

test:
	pnpm test
check-types:
	pnpm run check
lint:
	pnpm run lint
	pnpm run check
	pnpm run format:check
	$(MAKE) lint-openapi
lint-fix:
	pnpm run lint:fix
lint-openapi:
	pnpm exec redocly lint tsp-output/@typespec/openapi3/openapi.json

generate-types:
	pnpm run generate
generate-check:
	pnpm run generate:check
migration-check:
	pnpm run migrate
contract-test:
	pnpm run contract
compatibility-test:
	pnpm run compatibility
smoke-test:
	./scripts/smoke-test.sh

.PHONY: install setup env dev start test check-types lint lint-fix lint-openapi generate-types generate-check migration-check contract-test compatibility-test smoke-test
