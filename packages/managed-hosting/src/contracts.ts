import type { HostingControlOverrideKind, TenantLifecycleState } from './constants.js';

export type CustomerManifest = {
  kind: 'ledra-tenant';
  version: 1;
  tenant: {
    slug: string;
    displayName?: string;
  };
  registry: {
    path: string;
  };
  deployment?: {
    channel?: 'production';
  };
};

export type HostingControlTenantManifest = {
  tenantId: string;
  slug: string;
  displayName: string;
  github: {
    installationId: number;
    repository: string;
    defaultRef: string;
    registryPath: string;
    repositoryNodeId: string;
  };
  engine: {
    ledraVersion: string;
  };
  deployment: {
    environment: 'production';
    cloudflareTarget: string;
    productionHostname: string;
  };
  policy: {
    autoDeploy: boolean;
    suspended: boolean;
  };
  statusIntent: {
    state: TenantLifecycleState;
  };
};

type TimedOrManualClear =
  | {
      expiresAt: string;
      manualClear?: boolean;
    }
  | {
      expiresAt?: string;
      manualClear: boolean;
    };

type OverrideEnvelopeBase = {
  reason: string;
  actor: string;
  ticket: string;
  createdAt: string;
};

export type DeployFreezeOverride = OverrideEnvelopeBase &
  TimedOrManualClear & {
    kind: 'deploy_freeze';
    parameters?: Record<string, never>;
  };

export type SourcePinOverride = OverrideEnvelopeBase &
  TimedOrManualClear & {
    kind: 'source_pin';
    parameters: {
      customerRepoCommitSha: string;
      controlRepoCommitSha?: string;
    };
  };

export type ForceRollbackOverride = OverrideEnvelopeBase &
  TimedOrManualClear & {
    kind: 'force_rollback';
    parameters:
      | {
          targetDeploymentId: string;
          targetTenantRevisionId?: never;
        }
      | {
          targetDeploymentId?: never;
          targetTenantRevisionId: string;
        };
  };

export type SuspendOverride = OverrideEnvelopeBase &
  TimedOrManualClear & {
    kind: 'suspend';
    parameters: {
      suspensionReasonCode: string;
    };
  };

export type ResumeOverride = OverrideEnvelopeBase &
  TimedOrManualClear & {
    kind: 'resume';
    parameters?: Record<string, never>;
  };

export type DomainDisableOverride = OverrideEnvelopeBase &
  TimedOrManualClear & {
    kind: 'domain_disable';
    parameters: {
      hostname: string;
    };
  };

export type HostingControlOverride = {
  kind: 'ledra-override';
  version: 1;
  tenantId: string;
  slug: string;
  override:
    | DeployFreezeOverride
    | SourcePinOverride
    | ForceRollbackOverride
    | SuspendOverride
    | ResumeOverride
    | DomainDisableOverride;
};

export type TenantRevisionIdentity = {
  tenantId: string;
  customerRepoCommitSha: string;
  controlRepoCommitSha: string;
  platformVersion: string;
};

export type RepoBindingIdentity = {
  installationId: number;
  repository: string;
  registryPath: string;
};

export type HostingControlTenantUniquenessKeys = {
  slug: string;
  repositoryNodeId: string;
  repoBinding: string;
  cloudflareTarget: string;
  productionHostname: string;
};

export type ValidationIssue = {
  path: string;
  message: string;
};

export type ValidationResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      issues: readonly ValidationIssue[];
    };

export type HostingControlOverrideEnvelope = HostingControlOverride['override'] & {
  kind: HostingControlOverrideKind;
};
