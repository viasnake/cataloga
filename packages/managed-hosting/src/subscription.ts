export const SUBSCRIPTION_STATUSES = [
  'trial',
  'active',
  'past_due',
  'suspended',
  'canceled'
] as const;
export const SUBSCRIPTION_PLANS = ['starter', 'growth', 'enterprise'] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export type EntitlementSet = {
  customDomains: boolean;
  previewEnvironments: boolean;
  maxConcurrentDeploys: number;
};

export type SubscriptionState = {
  accountId: string;
  tenantId: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
};

export const createEntitlementsForPlan = (plan: SubscriptionPlan): EntitlementSet => {
  switch (plan) {
    case 'starter':
      return {
        customDomains: true,
        previewEnvironments: false,
        maxConcurrentDeploys: 1
      };
    case 'growth':
      return {
        customDomains: true,
        previewEnvironments: true,
        maxConcurrentDeploys: 2
      };
    case 'enterprise':
      return {
        customDomains: true,
        previewEnvironments: true,
        maxConcurrentDeploys: 5
      };
  }
};

export const canAutoDeploySubscription = (state: SubscriptionState): boolean =>
  state.status === 'trial' || state.status === 'active';

export const canServeSubscription = (state: SubscriptionState): boolean =>
  state.status === 'trial' || state.status === 'active';

export const shouldSuspendTenantForBilling = (state: SubscriptionState): boolean =>
  state.status === 'past_due' || state.status === 'suspended';
