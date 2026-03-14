import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAutoDeploySubscription,
  canServeSubscription,
  createEntitlementsForPlan,
  shouldSuspendTenantForBilling
} from '../packages/managed-hosting/dist/index.js';

test('managed-hosting subscription helpers derive entitlements and gating', () => {
  assert.deepEqual(createEntitlementsForPlan('starter'), {
    customDomains: true,
    previewEnvironments: false,
    maxConcurrentDeploys: 1
  });
  assert.equal(
    canAutoDeploySubscription({
      accountId: 'acc_1',
      tenantId: 'tnt_1',
      status: 'active',
      plan: 'growth'
    }),
    true
  );
  assert.equal(
    canServeSubscription({
      accountId: 'acc_1',
      tenantId: 'tnt_1',
      status: 'canceled',
      plan: 'growth'
    }),
    false
  );
  assert.equal(
    canServeSubscription({
      accountId: 'acc_1',
      tenantId: 'tnt_1',
      status: 'past_due',
      plan: 'starter'
    }),
    false
  );
  assert.equal(
    shouldSuspendTenantForBilling({
      accountId: 'acc_1',
      tenantId: 'tnt_1',
      status: 'past_due',
      plan: 'starter'
    }),
    true
  );
});
