import type {
  HostingControlTenantManifest,
  HostingControlTenantUniquenessKeys,
  RepoBindingIdentity,
  TenantRevisionIdentity
} from './contracts.js';
import {
  CLOUDFLARE_TARGET_PATTERN,
  HOSTNAME_PATTERN,
  REGISTRY_PATH_PATTERN,
  REPOSITORY_PATTERN,
  normalizeManagedHostingRegistryPath
} from './patterns.js';
import {
  assertValidHostingControlTenantManifest,
  assertValidTenantRevisionIdentity
} from './validation.js';

const readNormalizedString = (
  value: unknown,
  label: string,
  pattern: RegExp,
  transform: (input: string) => string = (input) => input
): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label}: Expected a non-empty string.`);
  }

  const normalized = transform(value.trim());
  if (!pattern.test(normalized)) {
    throw new Error(`${label}: Value does not match the required pattern.`);
  }

  return normalized;
};

export const createRepoBindingUniquenessKey = (value: RepoBindingIdentity): string => {
  if (!Number.isInteger(value.installationId) || value.installationId < 1) {
    throw new Error('repoBinding.installationId: Expected an integer greater than or equal to 1.');
  }

  const repository = readNormalizedString(
    value.repository,
    'repoBinding.repository',
    REPOSITORY_PATTERN,
    (input) => input.toLowerCase()
  );
  const registryPath = readNormalizedString(
    value.registryPath,
    'repoBinding.registryPath',
    REGISTRY_PATH_PATTERN,
    normalizeManagedHostingRegistryPath
  );

  return `${value.installationId}:${repository}:${registryPath}`;
};

export const createTenantRevisionUniquenessKey = (value: TenantRevisionIdentity): string => {
  const identity = assertValidTenantRevisionIdentity(value);
  return `${identity.tenantId}:${identity.customerRepoCommitSha}:${identity.controlRepoCommitSha}:${identity.platformVersion}`;
};

export const createHostnameClaimKey = (hostname: string): string =>
  readNormalizedString(hostname, 'hostname', HOSTNAME_PATTERN, (input) => input.toLowerCase());

export const createCloudflareTargetClaimKey = (cloudflareTarget: string): string =>
  readNormalizedString(cloudflareTarget, 'cloudflareTarget', CLOUDFLARE_TARGET_PATTERN);

export const createHostingControlTenantUniquenessKeys = (
  manifest: HostingControlTenantManifest
): HostingControlTenantUniquenessKeys => {
  const tenant = assertValidHostingControlTenantManifest(manifest);

  return {
    slug: tenant.slug,
    repositoryNodeId: tenant.github.repositoryNodeId,
    repoBinding: createRepoBindingUniquenessKey(tenant.github),
    cloudflareTarget: createCloudflareTargetClaimKey(tenant.deployment.cloudflareTarget),
    productionHostname: createHostnameClaimKey(tenant.deployment.productionHostname)
  };
};
