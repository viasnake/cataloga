# Cloudflare deployment example (Workers + Assets)

This directory now targets a 2-repository deployment model.

- Engine repo: Ledra runtime, Worker, packaging script, and documentation.
- Data repo: source-of-truth `registry/` plus GitHub Actions workflows.

The Cloudflare runtime serves only packaged assets and read-only API responses.

## Runtime routes

- `/` -> static viewer from `public/`
- `/bundle.json` -> exported registry bundle
- `/metadata.json` -> deployment audit metadata
- `/api/views` -> Worker returns `bundle.graph.views`
- `/api/metadata` -> Worker returns deployment metadata
- `/health` -> basic read-only health check

## Local packaging smoke test

Use this flow when validating the Cloudflare package locally inside the engine repo.

### 1) Build Ledra

```bash
npm install
npm run build
```

### 2) Prepare sample registry data

```bash
mkdir -p ./.local/registry-data
cp -R examples/minimal-registry/. ./.local/registry-data/
```

### 3) Export the bundle and package Cloudflare assets

```bash
mkdir -p .artifacts/cloudflare
npm exec --workspace @ledra/cli ledra -- export --registry ./.local/registry-data --out .artifacts/cloudflare/bundle.json
node scripts/package-cloudflare.mjs \
  --bundle .artifacts/cloudflare/bundle.json \
  --out deploy/cloudflare/public \
  --data-repo "local/example-data" \
  --data-ref "refs/heads/main" \
  --data-commit "$(git rev-parse HEAD)" \
  --registry-path "registry" \
  --engine-repo "viasnake/ledra" \
  --engine-ref "local-dev" \
  --engine-commit "$(git rev-parse HEAD)"
```

### 4) Deploy manually for a smoke test

```bash
cp deploy/cloudflare/wrangler.toml.example deploy/cloudflare/wrangler.toml
cd deploy/cloudflare
npx wrangler deploy --env preview
```

## Recommended production model

Production should be driven from a separate data repository.

1. A data repo PR runs validation, tests, packaging, and preview deploy.
2. A merge to `main` runs production deploy.
3. Rollback rebuilds from a specific data commit and Ledra release tag.

Template workflows live under `deploy/cloudflare/data-repo-workflows/`.

See `deploy/cloudflare/metadata-schema.md` for the public deployment metadata contract.

## Required configuration

- `assets.binding = "ASSETS"` is required because `worker.mjs` reads packaged assets directly.
- `metadata.json` must be packaged next to `bundle.json`.
- Production should use a custom domain via `env.production.routes`.
- Preview URL comments require a `CLOUDFLARE_ACCOUNT_SUBDOMAIN` variable in the data repository.

## Preview and production policy

- Preview: one Worker per PR on `workers.dev`
- Production: custom domain only
- Runtime: no GitHub live read
- Rollback: rebuild and redeploy from GitHub first, Cloudflare rollback second
