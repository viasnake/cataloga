import type { ReadOnlyRepository } from '@cataloga/core';
import type { CatalogaBundle, RegistryGraph, RegistryDiagnostics } from '@cataloga/types';

export const packageName = '@cataloga/bundle';

type BundleSource = ReadOnlyRepository | { graph: RegistryGraph; diagnostics: RegistryDiagnostics };

const isRepository = (value: BundleSource): value is ReadOnlyRepository =>
  typeof value === 'object' && value !== null && 'listEntities' in value;

export const buildBundle = (source: BundleSource): CatalogaBundle => {
  const graph = isRepository(source) ? source.graph() : source.graph;
  const diagnostics = isRepository(source) ? source.diagnostics() : source.diagnostics;

  return {
    kind: 'static-bundle',
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    graph,
    diagnostics
  };
};
