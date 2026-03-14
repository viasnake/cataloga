# Reproducible deployment (Cloudflare / Docker)

This document ties the runnable examples under `deploy/` to the Git-native registry workflow.

## Shared principle

Use a registry data repository as source-of-truth input, then regenerate artifacts and redeploy:

```bash
npm exec --workspace @ledra/cli ledra -- validate --registry <registry_repo_path>
npm exec --workspace @ledra/cli ledra -- build --registry <registry_repo_path> --out dist/bundle.json
```

## Docker

- Files:
  - `deploy/docker/Dockerfile`
  - `deploy/docker/compose.yaml`
  - `deploy/docker/server.mjs`
- Uses mounted registry repo (`LEDRA_REGISTRY_PATH`) in read-only mode.

```bash
docker compose -f deploy/docker/compose.yaml up --build -d
```

## Cloudflare Workers + Assets

- Files:
  - `deploy/cloudflare/wrangler.toml.example`
  - `deploy/cloudflare/worker.mjs`
- Uses a packaged artifact directory containing viewer assets, `bundle.json`, and `metadata.json`.
- Recommended production flow is a 2-repository model: the Ledra engine repo provides runtime code and
  templates, while a separate data repo runs GitHub Actions and deploys to Cloudflare.

```bash
npm exec --workspace @ledra/cli ledra -- export --registry <registry_repo_path> --out .artifacts/cloudflare/bundle.json
node scripts/package-cloudflare.mjs --bundle .artifacts/cloudflare/bundle.json --out deploy/cloudflare/public
cd deploy/cloudflare && npx wrangler deploy
```

See `docs/2-repo-cloudflare-deployment.md` for the full GitHub-driven preview, production, and rollback
workflow.
