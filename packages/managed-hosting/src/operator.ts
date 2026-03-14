import type { HostingControlOverride } from './contracts.js';

export const DRIFT_CATEGORIES = [
  'control_vs_db',
  'db_vs_runtime',
  'runtime_vs_ledger',
  'access_vs_binding'
] as const;
export const AUDIT_EVENT_KINDS = [
  'tenant_onboarded',
  'deployment_started',
  'deployment_succeeded',
  'deployment_failed',
  'rollback_requested',
  'rollback_succeeded',
  'override_applied',
  'override_cleared',
  'tenant_suspended'
] as const;

export type DriftCategory = (typeof DRIFT_CATEGORIES)[number];
export type AuditEventKind = (typeof AUDIT_EVENT_KINDS)[number];

export type DriftSignal = {
  category: DriftCategory;
  detected: boolean;
  summary: string;
};

export type OperatorAuditEvent = {
  kind: AuditEventKind;
  tenantId: string;
  actor: string;
  createdAt: string;
  summary: string;
};

export type OperatorTenantSnapshot = {
  tenantId: string;
  slug: string;
  desiredTenantRevisionId: string;
  currentTenantRevisionId?: string;
  lastSuccessfulDeploymentId?: string;
  activeOverrideKinds: readonly string[];
  driftSignals: readonly DriftSignal[];
  blocked: boolean;
};

export const summarizeActiveOverrides = (
  overrides: readonly HostingControlOverride[]
): readonly string[] => [...new Set(overrides.map((entry) => entry.override.kind))];

export const classifyDriftSignals = (input: {
  desiredTenantRevisionId: string;
  effectiveTenantRevisionId?: string;
  runtimeDeploymentId?: string;
  ledgerDeploymentId?: string;
  accessHealthy: boolean;
}): readonly DriftSignal[] => {
  const signals: DriftSignal[] = [
    {
      category: 'control_vs_db',
      detected:
        input.effectiveTenantRevisionId !== undefined &&
        input.desiredTenantRevisionId !== input.effectiveTenantRevisionId,
      summary: 'Desired control state differs from effective database state.'
    },
    {
      category: 'db_vs_runtime',
      detected:
        input.effectiveTenantRevisionId !== undefined && input.runtimeDeploymentId === undefined,
      summary: 'Database state indicates a deployment but runtime deployment state is missing.'
    },
    {
      category: 'runtime_vs_ledger',
      detected:
        input.runtimeDeploymentId !== undefined &&
        input.ledgerDeploymentId !== undefined &&
        input.runtimeDeploymentId !== input.ledgerDeploymentId,
      summary: 'Runtime deployment differs from the recorded deployment ledger.'
    },
    {
      category: 'access_vs_binding',
      detected: !input.accessHealthy,
      summary: 'Repository binding exists but GitHub App access is unhealthy.'
    }
  ];

  return signals.filter((signal) => signal.detected);
};

export const createOperatorTenantSnapshot = (input: {
  tenantId: string;
  slug: string;
  desiredTenantRevisionId: string;
  currentTenantRevisionId?: string;
  lastSuccessfulDeploymentId?: string;
  overrides: readonly HostingControlOverride[];
  driftSignals: readonly DriftSignal[];
}): OperatorTenantSnapshot => ({
  tenantId: input.tenantId,
  slug: input.slug,
  desiredTenantRevisionId: input.desiredTenantRevisionId,
  ...(input.currentTenantRevisionId === undefined
    ? {}
    : { currentTenantRevisionId: input.currentTenantRevisionId }),
  ...(input.lastSuccessfulDeploymentId === undefined
    ? {}
    : { lastSuccessfulDeploymentId: input.lastSuccessfulDeploymentId }),
  activeOverrideKinds: summarizeActiveOverrides(input.overrides),
  driftSignals: input.driftSignals,
  blocked: input.overrides.length > 0 || input.driftSignals.length > 0
});
