export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/u;
export const TENANT_ID_PATTERN = /^tnt_[A-Za-z0-9]{8,}$/u;
export const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;
export const DEFAULT_REF_PATTERN = /^refs\/.+$/u;
export const REGISTRY_PATH_PATTERN = /^(?!\/)(?!.*\.\.)(?!.*\/\/).+$/u;
export const CLOUDFLARE_TARGET_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u;
export const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)(?!-)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/u;
export const COMMIT_SHA_PATTERN = /^[a-f0-9]{7,64}$/u;
export const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/u;

export const normalizeManagedHostingRegistryPath = (value: string): string => {
  const withoutDotPrefix = value.replace(/^\.\//u, '');
  return withoutDotPrefix.endsWith('/') ? withoutDotPrefix.slice(0, -1) : withoutDotPrefix;
};
