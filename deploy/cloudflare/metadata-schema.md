# Cloudflare deployment metadata schema

Ledra keeps the exported registry bundle unchanged and writes deployment metadata to a sibling
`metadata.json` file.

## Purpose

- Identify which data repository commit is deployed.
- Identify which Ledra engine release produced the artifact.
- Keep rollback and audit data outside the registry bundle contract.

## File location

```text
public/
  index.html
  assets/
  bundle.json
  metadata.json
```

## Schema

```json
{
  "product": "Ledra",
  "deploymentVersion": "abcdef123456-fedcba654321-20260314T120000Z",
  "generatedAt": "2026-03-14T12:00:00.000Z",
  "engine": {
    "repo": "viasnake/ledra",
    "ref": "v0.1.0",
    "commitSha": "fedcba654321fedcba654321fedcba654321fedc"
  },
  "data": {
    "repo": "example/home-ledra-data",
    "ref": "refs/heads/main",
    "commitSha": "abcdef123456abcdef123456abcdef123456abcd",
    "registryPath": "registry"
  },
  "bundle": {
    "path": "/bundle.json",
    "schemaVersion": 1
  }
}
```

## Field notes

- `deploymentVersion`: deployment identifier for preview, production, and rollback runs.
- `generatedAt`: UTC timestamp for artifact packaging, not for data authoring.
- `engine.ref`: release tag pinned by the data repository workflow.
- `data.ref`: Git ref used for the data checkout. Preview usually uses a PR head ref. Production uses
  `refs/heads/main`.
- `bundle.schemaVersion`: copied from the exported `bundle.json` so viewers and APIs can verify
  compatibility without mutating the bundle contract.
