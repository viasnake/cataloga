export const packageName = '@ledra/managed-hosting';

export const TENANT_LIFECYCLE_STATES = [
  'pending',
  'active',
  'degraded',
  'suspended',
  'deleted'
] as const;

export const ONBOARDING_LIFECYCLE_STATES = [
  'detected',
  'access_validating',
  'manifest_validating',
  'uniqueness_checking',
  'provisioning',
  'control_state_committing',
  'initial_reconcile_pending',
  'active',
  'action_required',
  'conflict',
  'failed'
] as const;

export const DEPLOYMENT_LIFECYCLE_STATES = [
  'pending',
  'validating',
  'building',
  'deploying',
  'healthy',
  'failed',
  'rolled_back'
] as const;

export const RECONCILE_OUTCOMES = ['no_op', 'enqueue_deploy', 'enqueue_repair', 'blocked'] as const;

export const FAILURE_CATEGORIES = [
  'github_access_failure',
  'manifest_failure',
  'uniqueness_conflict',
  'control_commit_failure',
  'build_failure',
  'deploy_failure',
  'verification_failure',
  'drift_failure',
  'internal_failure'
] as const;

export const HOSTING_CONTROL_OVERRIDE_KINDS = [
  'deploy_freeze',
  'source_pin',
  'force_rollback',
  'suspend',
  'resume',
  'domain_disable'
] as const;

export type TenantLifecycleState = (typeof TENANT_LIFECYCLE_STATES)[number];
export type OnboardingLifecycleState = (typeof ONBOARDING_LIFECYCLE_STATES)[number];
export type DeploymentLifecycleState = (typeof DEPLOYMENT_LIFECYCLE_STATES)[number];
export type ReconcileOutcome = (typeof RECONCILE_OUTCOMES)[number];
export type FailureCategory = (typeof FAILURE_CATEGORIES)[number];
export type HostingControlOverrideKind = (typeof HOSTING_CONTROL_OVERRIDE_KINDS)[number];
