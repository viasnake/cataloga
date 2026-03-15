import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyDriftSignals,
  createOperatorTenantSnapshot,
  summarizeActiveOverrides
} from '../packages/managed-hosting/dist/index.js';

const makeOverride = (kind) => ({
  kind: 'cataloga-override',
  version: 1,
  tenantId: 'tnt_01HXYZABCDEFG',
  slug: 'acme',
  override: {
    kind,
    reason: 'test',
    actor: 'operator@example.com',
    ticket: 'OPS-1',
    createdAt: '2026-03-14T12:00:00Z',
    manualClear: true
  }
});

test('managed-hosting operator helpers summarize drift and overrides', () => {
  const overrides = [makeOverride('deploy_freeze'), makeOverride('suspend')];
  const driftSignals = classifyDriftSignals({
    desiredTenantRevisionId: 'trv_2',
    effectiveTenantRevisionId: 'trv_1',
    runtimeDeploymentId: 'dep_runtime',
    ledgerDeploymentId: 'dep_ledger',
    accessHealthy: false
  });
  const snapshot = createOperatorTenantSnapshot({
    tenantId: 'tnt_01HXYZABCDEFG',
    slug: 'acme',
    desiredTenantRevisionId: 'trv_2',
    currentTenantRevisionId: 'trv_1',
    lastSuccessfulDeploymentId: 'dep_ledger',
    overrides,
    driftSignals
  });

  assert.deepEqual(summarizeActiveOverrides(overrides), ['deploy_freeze', 'suspend']);
  assert.equal(driftSignals.length, 3);
  assert.equal(snapshot.blocked, true);
});
