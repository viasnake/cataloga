# 2-repo Cloudflare deployment

This guide describes the recommended production setup for Ledra on Cloudflare.

## Repositories

### Engine repository

The Ledra engine repository contains:

- Ledra packages and apps
- the Cloudflare Worker and Wrangler template
- the Cloudflare packaging script
- workflow templates for a separate data repository

### Data repository

The data repository is the single source of truth and contains:

- `registry/`
- GitHub Actions workflows for preview, production, and rollback

The data repository must not copy Ledra runtime code.

## Deployment contract

The data repository workflows pin a Ledra release tag and then:

1. check out the data repository
2. check out the Ledra engine repository at a release tag
3. run `validate`
4. run `export`
5. package viewer assets, `bundle.json`, and `metadata.json`
6. deploy the packaged artifact to Cloudflare Workers + Assets

Cloudflare reads only packaged assets. It does not fetch registry data from GitHub at runtime.

## Artifact layout

```text
public/
  index.html
  assets/
  bundle.json
  metadata.json
```

- `bundle.json`: exported registry bundle
- `metadata.json`: deployment audit data for preview, production, and rollback

## GitHub Actions model

Store workflows in the data repository.

- `preview.yml`: PR validation, packaging, preview deploy, preview teardown on PR close
- `production.yml`: deploy on `main`
- `rollback.yml`: redeploy a specific data commit and engine release tag

Reference templates:

- `deploy/cloudflare/data-repo-workflows/preview.yml.example`
- `deploy/cloudflare/data-repo-workflows/production.yml.example`
- `deploy/cloudflare/data-repo-workflows/rollback.yml.example`
- `deploy/cloudflare/metadata-schema.md`

## Required secrets and variables

Configure these in the data repository.

### Secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### Variables

- `CLOUDFLARE_PRODUCTION_HOSTNAME`
- `CLOUDFLARE_ACCOUNT_SUBDOMAIN`
- `LEDRA_ENGINE_REPO`
- `LEDRA_ENGINE_REF`
- `LEDRA_REGISTRY_PATH`

## Environment model

### Preview

- one Worker per PR
- `workers.dev` only
- destroyed when the PR closes
- must not share production routes or production-only secrets

### Production

- deployed only from `main`
- served from a custom domain
- protected with a GitHub Environment if approvals are required

## Packaging command

The Ledra engine repository provides a packaging script:

```bash
node scripts/package-cloudflare.mjs \
  --bundle .artifacts/cloudflare/bundle.json \
  --out deploy/cloudflare/public \
  --data-repo "example/home-ledra-data" \
  --data-ref "refs/heads/main" \
  --data-commit "<data_sha>" \
  --registry-path "registry" \
  --engine-repo "viasnake/ledra" \
  --engine-ref "v0.1.0" \
  --engine-commit "<engine_sha>"
```

## Rollback policy

Primary rollback is a GitHub-driven rebuild and redeploy.

1. choose a known-good data commit
2. choose the Ledra release tag to pair with it
3. run `rollback.yml`, which validates data before repackaging
4. verify `/health`, `/bundle.json`, `/api/views`, and `/api/metadata`

Cloudflare native rollback is only a secondary tool. The audited path is to rebuild and redeploy from
GitHub.

## Manual bootstrap allowed once

The following initial setup is intentionally manual:

- create the Cloudflare account
- create the API token
- connect the custom domain and DNS
- create GitHub environments and secrets

After bootstrap, routine preview, production, and rollback actions should run from GitHub.

## Secret-handling note

The workflow templates split build/package jobs from deploy jobs. Cloudflare secrets are only required by the
deploy jobs so validation, test, and packaging steps can run without deployment credentials.
