.PHONY: init dev build lint test typecheck

init:
	npm install
	@if [ ! -f .env ]; then cp .env.example .env; echo ".env created from .env.example"; fi

dev:
	npm run dev

build:
	npm run build

lint:
	npx eslint src/

test:
	npm run test

typecheck:
	npx tsc --noEmit
