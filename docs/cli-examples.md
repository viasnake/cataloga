# CLI examples

Build first:

```bash
mise install
npm install
npm run build
```

The repository targets Node.js 20.x. `mise.toml` provides that runtime if you use `mise` locally.

Run the CLI through the workspace bin:

```bash
npm exec --workspace @cataloga/cli cataloga -- --help
```

Assume the registry repo path is `./.local/registry-data`.

## Validate registry graph

```bash
npm exec --workspace @cataloga/cli cataloga -- validate --registry ./.local/registry-data
```

## Inspect entities

```bash
npm exec --workspace @cataloga/cli cataloga -- inspect --registry ./.local/registry-data --query "type=host"
npm exec --workspace @cataloga/cli cataloga -- inspect --registry ./.local/registry-data --query '{"type":"prefix","attributes":[{"field":"vlanId","operator":"=","value":"vlan-10"}]}'
```

## Build bundle JSON

```bash
npm exec --workspace @cataloga/cli cataloga -- build --registry ./.local/registry-data --out ./dist/bundle.json
```

## Export bundle JSON

```bash
npm exec --workspace @cataloga/cli cataloga -- export --registry ./.local/registry-data --out ./dist/bundle.json
```

## Run read-only API

```bash
npm exec --workspace @cataloga/cli cataloga -- serve --registry ./.local/registry-data --port 3000
```
