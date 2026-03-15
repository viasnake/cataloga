import {
  HOSTING_CONTROL_OVERRIDE_KINDS,
  TENANT_LIFECYCLE_STATES,
  type HostingControlOverrideKind,
  type TenantLifecycleState
} from './constants.js';
import {
  CLOUDFLARE_TARGET_PATTERN,
  COMMIT_SHA_PATTERN,
  DATE_TIME_PATTERN,
  DEFAULT_REF_PATTERN,
  HOSTNAME_PATTERN,
  REGISTRY_PATH_PATTERN,
  REPOSITORY_PATTERN,
  SLUG_PATTERN,
  TENANT_ID_PATTERN
} from './patterns.js';
import type {
  CustomerManifest,
  HostingControlOverride,
  HostingControlTenantManifest,
  TenantRevisionIdentity,
  ValidationIssue,
  ValidationResult
} from './contracts.js';

type RecordLike = Record<string, unknown>;

const isRecordLike = (value: unknown): value is RecordLike =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOwn = <TKey extends string>(
  value: RecordLike,
  key: TKey
): value is RecordLike & Record<TKey, unknown> => Object.prototype.hasOwnProperty.call(value, key);

const pushIssue = (issues: ValidationIssue[], path: string, message: string): void => {
  issues.push({ path, message });
};

const asTrimmedString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const isFiniteInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && Number.isFinite(value);

const isDateTimeString = (value: string): boolean =>
  DATE_TIME_PATTERN.test(value) && !Number.isNaN(Date.parse(value));

const isTenantLifecycleState = (value: string): value is TenantLifecycleState =>
  TENANT_LIFECYCLE_STATES.includes(value as TenantLifecycleState);

const isOverrideKind = (value: string): value is HostingControlOverrideKind =>
  HOSTING_CONTROL_OVERRIDE_KINDS.includes(value as HostingControlOverrideKind);

const readObject = (
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): RecordLike | undefined => {
  if (!isRecordLike(value)) {
    pushIssue(issues, path, 'Expected an object.');
    return undefined;
  }

  return value;
};

const readString = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  options: {
    maxLength?: number;
    minLength?: number;
    pattern?: RegExp;
    patternMessage?: string;
  } = {}
): string | undefined => {
  const text = asTrimmedString(value);
  if (text === undefined) {
    pushIssue(issues, path, 'Expected a non-empty string.');
    return undefined;
  }
  if (options.minLength !== undefined && text.length < options.minLength) {
    pushIssue(issues, path, `Expected at least ${options.minLength} characters.`);
  }
  if (options.maxLength !== undefined && text.length > options.maxLength) {
    pushIssue(issues, path, `Expected at most ${options.maxLength} characters.`);
  }
  if (options.pattern !== undefined && !options.pattern.test(text)) {
    pushIssue(issues, path, options.patternMessage ?? 'Value does not match the required pattern.');
  }
  return text;
};

const readBoolean = (
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): boolean | undefined => {
  if (typeof value !== 'boolean') {
    pushIssue(issues, path, 'Expected a boolean.');
    return undefined;
  }
  return value;
};

const readDateTime = (
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): string | undefined => {
  const text = readString(value, path, issues);
  if (text !== undefined && !isDateTimeString(text)) {
    pushIssue(issues, path, 'Expected an ISO 8601 UTC date-time string.');
  }
  return text;
};

const readCommitSha = (
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): string | undefined =>
  readString(value, path, issues, {
    pattern: COMMIT_SHA_PATTERN,
    patternMessage: 'Expected a lowercase hex commit SHA between 7 and 64 characters.'
  });

const readNoUnknownKeys = (
  value: RecordLike,
  path: string,
  issues: ValidationIssue[],
  allowedKeys: readonly string[]
): void => {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      pushIssue(issues, `${path}.${key}`, 'Unexpected property.');
    }
  }
};

const finishValidation = <T>(issues: ValidationIssue[], value: T): ValidationResult<T> =>
  issues.length === 0 ? { ok: true, value } : { ok: false, issues };

export const validateCustomerManifest = (value: unknown): ValidationResult<CustomerManifest> => {
  const issues: ValidationIssue[] = [];
  const manifest = readObject(value, 'manifest', issues);
  if (manifest === undefined) {
    return { ok: false, issues };
  }
  readNoUnknownKeys(manifest, 'manifest', issues, [
    'kind',
    'version',
    'tenant',
    'registry',
    'deployment'
  ]);

  if (manifest.kind !== 'cataloga-tenant') {
    pushIssue(issues, 'manifest.kind', 'Expected cataloga-tenant.');
  }
  if (manifest.version !== 1) {
    pushIssue(issues, 'manifest.version', 'Expected version 1.');
  }

  const tenant = readObject(manifest.tenant, 'manifest.tenant', issues);
  const registry = readObject(manifest.registry, 'manifest.registry', issues);
  const deployment =
    manifest.deployment === undefined
      ? undefined
      : readObject(manifest.deployment, 'manifest.deployment', issues);

  let slug = '';
  let displayName: string | undefined;
  if (tenant !== undefined) {
    readNoUnknownKeys(tenant, 'manifest.tenant', issues, ['slug', 'displayName']);
    slug =
      readString(tenant.slug, 'manifest.tenant.slug', issues, {
        pattern: SLUG_PATTERN,
        patternMessage: 'Expected a lowercase slug using letters, numbers, and hyphens.'
      }) ?? '';
    displayName =
      tenant.displayName === undefined
        ? undefined
        : readString(tenant.displayName, 'manifest.tenant.displayName', issues, { maxLength: 120 });
  }

  let path = '';
  if (registry !== undefined) {
    readNoUnknownKeys(registry, 'manifest.registry', issues, ['path']);
    path =
      readString(registry.path, 'manifest.registry.path', issues, {
        maxLength: 200,
        pattern: REGISTRY_PATH_PATTERN,
        patternMessage: 'Expected a relative path without parent traversal or duplicate separators.'
      }) ?? '';
  }

  let channel: 'production' | undefined;
  if (deployment !== undefined) {
    readNoUnknownKeys(deployment, 'manifest.deployment', issues, ['channel']);
    if (deployment.channel !== undefined) {
      const deploymentChannel = readString(
        deployment.channel,
        'manifest.deployment.channel',
        issues
      );
      if (deploymentChannel !== undefined && deploymentChannel !== 'production') {
        pushIssue(issues, 'manifest.deployment.channel', 'Expected production.');
      } else if (deploymentChannel === 'production') {
        channel = deploymentChannel;
      }
    }
  }

  return finishValidation(issues, {
    kind: 'cataloga-tenant',
    version: 1,
    tenant: {
      slug,
      ...(displayName === undefined ? {} : { displayName })
    },
    registry: {
      path
    },
    ...(channel === undefined ? {} : { deployment: { channel } })
  });
};

export const validateHostingControlTenantManifest = (
  value: unknown
): ValidationResult<HostingControlTenantManifest> => {
  const issues: ValidationIssue[] = [];
  const manifest = readObject(value, 'manifest', issues);
  if (manifest === undefined) {
    return { ok: false, issues };
  }
  readNoUnknownKeys(manifest, 'manifest', issues, [
    'tenantId',
    'slug',
    'displayName',
    'github',
    'engine',
    'deployment',
    'policy',
    'statusIntent'
  ]);

  const tenantId =
    readString(manifest.tenantId, 'manifest.tenantId', issues, {
      pattern: TENANT_ID_PATTERN,
      patternMessage: 'Expected a tenant id like tnt_01HXYZABCDEFG.'
    }) ?? '';
  const slug =
    readString(manifest.slug, 'manifest.slug', issues, {
      pattern: SLUG_PATTERN,
      patternMessage: 'Expected a lowercase slug using letters, numbers, and hyphens.'
    }) ?? '';
  const displayName =
    readString(manifest.displayName, 'manifest.displayName', issues, { maxLength: 120 }) ?? '';

  const github = readObject(manifest.github, 'manifest.github', issues);
  const engine = readObject(manifest.engine, 'manifest.engine', issues);
  const deployment = readObject(manifest.deployment, 'manifest.deployment', issues);
  const policy = readObject(manifest.policy, 'manifest.policy', issues);
  const statusIntent = readObject(manifest.statusIntent, 'manifest.statusIntent', issues);

  let installationId = 0;
  let repository = '';
  let defaultRef = '';
  let registryPath = '';
  let repositoryNodeId = '';
  if (github !== undefined) {
    readNoUnknownKeys(github, 'manifest.github', issues, [
      'installationId',
      'repository',
      'defaultRef',
      'registryPath',
      'repositoryNodeId'
    ]);
    if (!isFiniteInteger(github.installationId) || github.installationId < 1) {
      pushIssue(
        issues,
        'manifest.github.installationId',
        'Expected an integer greater than or equal to 1.'
      );
    } else {
      installationId = github.installationId;
    }
    repository =
      readString(github.repository, 'manifest.github.repository', issues, {
        pattern: REPOSITORY_PATTERN,
        patternMessage: 'Expected owner/repository format.'
      }) ?? '';
    defaultRef =
      readString(github.defaultRef, 'manifest.github.defaultRef', issues, {
        pattern: DEFAULT_REF_PATTERN,
        patternMessage: 'Expected a fully qualified git ref.'
      }) ?? '';
    registryPath =
      readString(github.registryPath, 'manifest.github.registryPath', issues, {
        maxLength: 200,
        pattern: REGISTRY_PATH_PATTERN,
        patternMessage: 'Expected a relative path without parent traversal or duplicate separators.'
      }) ?? '';
    repositoryNodeId =
      readString(github.repositoryNodeId, 'manifest.github.repositoryNodeId', issues) ?? '';
  }

  let catalogaVersion = '';
  if (engine !== undefined) {
    readNoUnknownKeys(engine, 'manifest.engine', issues, ['catalogaVersion']);
    catalogaVersion = readString(engine.catalogaVersion, 'manifest.engine.catalogaVersion', issues) ?? '';
  }

  let environment = 'production' as const;
  let cloudflareTarget = '';
  let productionHostname = '';
  if (deployment !== undefined) {
    readNoUnknownKeys(deployment, 'manifest.deployment', issues, [
      'environment',
      'cloudflareTarget',
      'productionHostname'
    ]);
    const deploymentEnvironment = readString(
      deployment.environment,
      'manifest.deployment.environment',
      issues
    );
    if (deploymentEnvironment !== undefined && deploymentEnvironment !== 'production') {
      pushIssue(issues, 'manifest.deployment.environment', 'Expected production.');
    } else if (deploymentEnvironment === 'production') {
      environment = deploymentEnvironment;
    }
    cloudflareTarget =
      readString(deployment.cloudflareTarget, 'manifest.deployment.cloudflareTarget', issues, {
        pattern: CLOUDFLARE_TARGET_PATTERN,
        patternMessage:
          'Expected a Cloudflare target using lowercase letters, numbers, and hyphens.'
      }) ?? '';
    productionHostname =
      readString(deployment.productionHostname, 'manifest.deployment.productionHostname', issues, {
        maxLength: 253,
        pattern: HOSTNAME_PATTERN,
        patternMessage: 'Expected a valid hostname.'
      }) ?? '';
  }

  let autoDeploy = false;
  let suspended = false;
  if (policy !== undefined) {
    readNoUnknownKeys(policy, 'manifest.policy', issues, ['autoDeploy', 'suspended']);
    autoDeploy = readBoolean(policy.autoDeploy, 'manifest.policy.autoDeploy', issues) ?? false;
    suspended = readBoolean(policy.suspended, 'manifest.policy.suspended', issues) ?? false;
  }

  let state: TenantLifecycleState = 'pending';
  if (statusIntent !== undefined) {
    readNoUnknownKeys(statusIntent, 'manifest.statusIntent', issues, ['state']);
    const statusState = readString(statusIntent.state, 'manifest.statusIntent.state', issues);
    if (statusState !== undefined && !isTenantLifecycleState(statusState)) {
      pushIssue(issues, 'manifest.statusIntent.state', 'Expected a valid tenant lifecycle state.');
    } else if (statusState !== undefined) {
      state = statusState;
    }
  }

  return finishValidation(issues, {
    tenantId,
    slug,
    displayName,
    github: {
      installationId,
      repository,
      defaultRef,
      registryPath,
      repositoryNodeId
    },
    engine: {
      catalogaVersion
    },
    deployment: {
      environment,
      cloudflareTarget,
      productionHostname
    },
    policy: {
      autoDeploy,
      suspended
    },
    statusIntent: {
      state
    }
  });
};

const validateOverrideScope = (override: RecordLike, issues: ValidationIssue[]): void => {
  const hasExpiresAt = hasOwn(override, 'expiresAt');
  const hasManualClear = hasOwn(override, 'manualClear');
  if (!hasExpiresAt && !hasManualClear) {
    pushIssue(
      issues,
      'manifest.override',
      'Expected either expiresAt or manualClear to define override clearing behavior.'
    );
  }

  if (hasExpiresAt) {
    readDateTime(override.expiresAt, 'manifest.override.expiresAt', issues);
  }
  if (hasManualClear) {
    readBoolean(override.manualClear, 'manifest.override.manualClear', issues);
  }
};

export const validateHostingControlOverride = (
  value: unknown
): ValidationResult<HostingControlOverride> => {
  const issues: ValidationIssue[] = [];
  const manifest = readObject(value, 'manifest', issues);
  if (manifest === undefined) {
    return { ok: false, issues };
  }
  readNoUnknownKeys(manifest, 'manifest', issues, [
    'kind',
    'version',
    'tenantId',
    'slug',
    'override'
  ]);

  if (manifest.kind !== 'cataloga-override') {
    pushIssue(issues, 'manifest.kind', 'Expected cataloga-override.');
  }
  if (manifest.version !== 1) {
    pushIssue(issues, 'manifest.version', 'Expected version 1.');
  }

  const tenantId =
    readString(manifest.tenantId, 'manifest.tenantId', issues, {
      pattern: TENANT_ID_PATTERN,
      patternMessage: 'Expected a tenant id like tnt_01HXYZABCDEFG.'
    }) ?? '';
  const slug =
    readString(manifest.slug, 'manifest.slug', issues, {
      pattern: SLUG_PATTERN,
      patternMessage: 'Expected a lowercase slug using letters, numbers, and hyphens.'
    }) ?? '';
  const overrideRecord = readObject(manifest.override, 'manifest.override', issues);

  let kind: HostingControlOverrideKind = 'deploy_freeze';
  let reason = '';
  let actor = '';
  let ticket = '';
  let createdAt = '';
  let expiresAt: string | undefined;
  let manualClear: boolean | undefined;
  let parameters: RecordLike | undefined;
  if (overrideRecord !== undefined) {
    readNoUnknownKeys(overrideRecord, 'manifest.override', issues, [
      'kind',
      'reason',
      'actor',
      'ticket',
      'createdAt',
      'expiresAt',
      'manualClear',
      'parameters'
    ]);
    const overrideKind = readString(overrideRecord.kind, 'manifest.override.kind', issues);
    if (overrideKind !== undefined && !isOverrideKind(overrideKind)) {
      pushIssue(issues, 'manifest.override.kind', 'Expected a supported override kind.');
    } else if (overrideKind !== undefined) {
      kind = overrideKind;
    }
    reason =
      readString(overrideRecord.reason, 'manifest.override.reason', issues, { maxLength: 500 }) ??
      '';
    actor =
      readString(overrideRecord.actor, 'manifest.override.actor', issues, { maxLength: 200 }) ?? '';
    ticket =
      readString(overrideRecord.ticket, 'manifest.override.ticket', issues, { maxLength: 200 }) ??
      '';
    createdAt = readDateTime(overrideRecord.createdAt, 'manifest.override.createdAt', issues) ?? '';
    validateOverrideScope(overrideRecord, issues);
    if (hasOwn(overrideRecord, 'expiresAt')) {
      expiresAt =
        typeof overrideRecord.expiresAt === 'string' ? overrideRecord.expiresAt.trim() : undefined;
    }
    if (hasOwn(overrideRecord, 'manualClear') && typeof overrideRecord.manualClear === 'boolean') {
      manualClear = overrideRecord.manualClear;
    }
    if (overrideRecord.parameters !== undefined) {
      parameters = readObject(overrideRecord.parameters, 'manifest.override.parameters', issues);
    }
  }

  if (kind === 'source_pin') {
    if (parameters === undefined) {
      pushIssue(issues, 'manifest.override.parameters', 'Expected source_pin parameters.');
    } else {
      readNoUnknownKeys(parameters, 'manifest.override.parameters', issues, [
        'customerRepoCommitSha',
        'controlRepoCommitSha'
      ]);
      readCommitSha(
        parameters.customerRepoCommitSha,
        'manifest.override.parameters.customerRepoCommitSha',
        issues
      );
      if (parameters.controlRepoCommitSha !== undefined) {
        readCommitSha(
          parameters.controlRepoCommitSha,
          'manifest.override.parameters.controlRepoCommitSha',
          issues
        );
      }
    }
  }

  if (kind === 'deploy_freeze' || kind === 'resume') {
    if (parameters !== undefined) {
      readNoUnknownKeys(parameters, 'manifest.override.parameters', issues, []);
    }
  }

  if (kind === 'force_rollback') {
    if (parameters === undefined) {
      pushIssue(issues, 'manifest.override.parameters', 'Expected force_rollback parameters.');
    } else {
      readNoUnknownKeys(parameters, 'manifest.override.parameters', issues, [
        'targetDeploymentId',
        'targetTenantRevisionId'
      ]);
      const hasTargetDeploymentId = asTrimmedString(parameters.targetDeploymentId) !== undefined;
      const hasTargetTenantRevisionId =
        asTrimmedString(parameters.targetTenantRevisionId) !== undefined;
      if (hasTargetDeploymentId === hasTargetTenantRevisionId) {
        pushIssue(
          issues,
          'manifest.override.parameters',
          'Expected exactly one of targetDeploymentId or targetTenantRevisionId.'
        );
      }
    }
  }

  if (kind === 'suspend') {
    if (parameters === undefined) {
      pushIssue(issues, 'manifest.override.parameters', 'Expected suspend parameters.');
    } else {
      readNoUnknownKeys(parameters, 'manifest.override.parameters', issues, [
        'suspensionReasonCode'
      ]);
      readString(
        parameters.suspensionReasonCode,
        'manifest.override.parameters.suspensionReasonCode',
        issues,
        { maxLength: 120 }
      );
    }
  }

  if (kind === 'domain_disable') {
    if (parameters === undefined) {
      pushIssue(issues, 'manifest.override.parameters', 'Expected domain_disable parameters.');
    } else {
      readNoUnknownKeys(parameters, 'manifest.override.parameters', issues, ['hostname']);
      readString(parameters.hostname, 'manifest.override.parameters.hostname', issues, {
        maxLength: 253,
        pattern: HOSTNAME_PATTERN,
        patternMessage: 'Expected a valid hostname.'
      });
    }
  }

  return finishValidation(issues, {
    kind: 'cataloga-override',
    version: 1,
    tenantId,
    slug,
    override: {
      kind,
      reason,
      actor,
      ticket,
      createdAt,
      ...(expiresAt === undefined ? {} : { expiresAt }),
      ...(manualClear === undefined ? {} : { manualClear }),
      ...(parameters === undefined ? {} : { parameters })
    } as HostingControlOverride['override']
  });
};

export const validateTenantRevisionIdentity = (
  value: unknown
): ValidationResult<TenantRevisionIdentity> => {
  const issues: ValidationIssue[] = [];
  const identity = readObject(value, 'tenantRevision', issues);
  if (identity === undefined) {
    return { ok: false, issues };
  }
  readNoUnknownKeys(identity, 'tenantRevision', issues, [
    'tenantId',
    'customerRepoCommitSha',
    'controlRepoCommitSha',
    'platformVersion'
  ]);

  const tenantId =
    readString(identity.tenantId, 'tenantRevision.tenantId', issues, {
      pattern: TENANT_ID_PATTERN,
      patternMessage: 'Expected a tenant id like tnt_01HXYZABCDEFG.'
    }) ?? '';
  const customerRepoCommitSha =
    readCommitSha(identity.customerRepoCommitSha, 'tenantRevision.customerRepoCommitSha', issues) ??
    '';
  const controlRepoCommitSha =
    readCommitSha(identity.controlRepoCommitSha, 'tenantRevision.controlRepoCommitSha', issues) ??
    '';
  const platformVersion =
    readString(identity.platformVersion, 'tenantRevision.platformVersion', issues) ?? '';

  return finishValidation(issues, {
    tenantId,
    customerRepoCommitSha,
    controlRepoCommitSha,
    platformVersion
  });
};

const formatIssues = (issues: readonly ValidationIssue[]): string =>
  issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n');

export const assertValidCustomerManifest = (value: unknown): CustomerManifest => {
  const result = validateCustomerManifest(value);
  if (!result.ok) {
    throw new Error(formatIssues(result.issues));
  }
  return result.value;
};

export const assertValidHostingControlTenantManifest = (
  value: unknown
): HostingControlTenantManifest => {
  const result = validateHostingControlTenantManifest(value);
  if (!result.ok) {
    throw new Error(formatIssues(result.issues));
  }
  return result.value;
};

export const assertValidHostingControlOverride = (value: unknown): HostingControlOverride => {
  const result = validateHostingControlOverride(value);
  if (!result.ok) {
    throw new Error(formatIssues(result.issues));
  }
  return result.value;
};

export const assertValidTenantRevisionIdentity = (value: unknown): TenantRevisionIdentity => {
  const result = validateTenantRevisionIdentity(value);
  if (!result.ok) {
    throw new Error(formatIssues(result.issues));
  }
  return result.value;
};
