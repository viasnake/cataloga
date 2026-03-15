import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEPLOYMENT_LIFECYCLE_STATES,
  FAILURE_CATEGORIES,
  ONBOARDING_LIFECYCLE_STATES,
  RECONCILE_OUTCOMES,
  TENANT_LIFECYCLE_STATES,
  assertValidHostingControlOverride,
  createCloudflareTargetClaimKey,
  createHostingControlTenantUniquenessKeys,
  createHostnameClaimKey,
  createTenantRevisionUniquenessKey,
  validateCustomerManifest,
  validateHostingControlOverride,
  validateHostingControlTenantManifest,
  validateTenantRevisionIdentity
} from '../packages/managed-hosting/dist/index.js';

test('managed-hosting validators accept valid contracts and expose helper keys', () => {
  const customerManifest = validateCustomerManifest({
    kind: 'cataloga-tenant',
    version: 1,
    tenant: {
      slug: 'acme',
      displayName: 'Acme Corp'
    },
    registry: {
      path: './registry/'
    },
    deployment: {
      channel: 'production'
    }
  });
  const tenantManifest = validateHostingControlTenantManifest({
    tenantId: 'tnt_01HXYZABCDEFG',
    slug: 'acme',
    displayName: 'Acme Corp',
    github: {
      installationId: 12345678,
      repository: 'Acme/Infra-Registry',
      defaultRef: 'refs/heads/main',
      registryPath: './registry/',
      repositoryNodeId: 'R_kgDOExample'
    },
    engine: {
      catalogaVersion: 'v0.2.0'
    },
    deployment: {
      environment: 'production',
      cloudflareTarget: 'acme-prod',
      productionHostname: 'Acme.Example.com'
    },
    policy: {
      autoDeploy: true,
      suspended: false
    },
    statusIntent: {
      state: 'active'
    }
  });
  const override = validateHostingControlOverride({
    kind: 'cataloga-override',
    version: 1,
    tenantId: 'tnt_01HXYZABCDEFG',
    slug: 'acme',
    override: {
      kind: 'source_pin',
      reason: 'Pin a known-good source revision',
      actor: 'operator@example.com',
      ticket: 'OPS-42',
      createdAt: '2026-03-14T12:00:00Z',
      manualClear: true,
      parameters: {
        customerRepoCommitSha: 'abcdef1234567',
        controlRepoCommitSha: '1234abc5678def'
      }
    }
  });
  const revision = validateTenantRevisionIdentity({
    tenantId: 'tnt_01HXYZABCDEFG',
    customerRepoCommitSha: 'abcdef1234567',
    controlRepoCommitSha: '1234abc5678def',
    platformVersion: 'v0.2.0'
  });

  assert.equal(customerManifest.ok, true);
  assert.equal(tenantManifest.ok, true);
  assert.equal(override.ok, true);
  assert.equal(revision.ok, true);

  if (!tenantManifest.ok) {
    assert.fail('expected tenant manifest to validate');
  }

  const keys = createHostingControlTenantUniquenessKeys(tenantManifest.value);
  assert.deepEqual(keys, {
    slug: 'acme',
    repositoryNodeId: 'R_kgDOExample',
    repoBinding: '12345678:acme/infra-registry:registry',
    cloudflareTarget: 'acme-prod',
    productionHostname: 'acme.example.com'
  });
  assert.equal(
    createTenantRevisionUniquenessKey({
      tenantId: 'tnt_01HXYZABCDEFG',
      customerRepoCommitSha: 'abcdef1234567',
      controlRepoCommitSha: '1234abc5678def',
      platformVersion: 'v0.2.0'
    }),
    'tnt_01HXYZABCDEFG:abcdef1234567:1234abc5678def:v0.2.0'
  );
  assert.equal(createHostnameClaimKey('Acme.Example.com'), 'acme.example.com');
  assert.equal(createCloudflareTargetClaimKey('acme-prod'), 'acme-prod');

  assert.ok(TENANT_LIFECYCLE_STATES.includes('active'));
  assert.ok(ONBOARDING_LIFECYCLE_STATES.includes('conflict'));
  assert.ok(DEPLOYMENT_LIFECYCLE_STATES.includes('healthy'));
  assert.ok(RECONCILE_OUTCOMES.includes('enqueue_deploy'));
  assert.ok(FAILURE_CATEGORIES.includes('deploy_failure'));
});

test('managed-hosting validators report key contract failures', () => {
  const customerManifest = validateCustomerManifest({
    kind: 'cataloga-tenant',
    version: 1,
    tenant: {
      slug: 'Acme'
    },
    registry: {
      path: '/registry'
    }
  });
  const tenantManifest = validateHostingControlTenantManifest({
    tenantId: 'tenant-1',
    slug: 'acme',
    displayName: 'Acme Corp',
    github: {
      installationId: 0,
      repository: 'missing-slash',
      defaultRef: 'main',
      registryPath: '../registry',
      repositoryNodeId: ''
    },
    engine: {
      catalogaVersion: 'v0.2.0'
    },
    deployment: {
      environment: 'staging',
      cloudflareTarget: 'AcmeProd',
      productionHostname: 'bad hostname'
    },
    policy: {
      autoDeploy: true,
      suspended: false
    },
    statusIntent: {
      state: 'paused'
    }
  });
  const override = validateHostingControlOverride({
    kind: 'cataloga-override',
    version: 1,
    tenantId: 'tnt_01HXYZABCDEFG',
    slug: 'acme',
    override: {
      kind: 'source_pin',
      reason: 'Pin source',
      actor: 'operator@example.com',
      ticket: 'OPS-43',
      createdAt: 'invalid-date',
      parameters: {
        customerRepoCommitSha: 'NOTHEX'
      }
    }
  });
  const revision = validateTenantRevisionIdentity({
    tenantId: 'tnt_01HXYZABCDEFG',
    customerRepoCommitSha: 'xyz',
    controlRepoCommitSha: '123456',
    platformVersion: ''
  });

  assert.equal(customerManifest.ok, false);
  assert.equal(tenantManifest.ok, false);
  assert.equal(override.ok, false);
  assert.equal(revision.ok, false);

  if (customerManifest.ok || tenantManifest.ok || override.ok || revision.ok) {
    assert.fail('expected all invalid payloads to fail validation');
  }

  assert.match(
    customerManifest.issues.map((issue) => `${issue.path}:${issue.message}`).join('\n'),
    /manifest\.tenant\.slug/u
  );
  assert.match(
    customerManifest.issues.map((issue) => `${issue.path}:${issue.message}`).join('\n'),
    /manifest\.registry\.path/u
  );
  assert.match(
    tenantManifest.issues.map((issue) => `${issue.path}:${issue.message}`).join('\n'),
    /manifest\.statusIntent\.state/u
  );
  assert.match(
    override.issues.map((issue) => `${issue.path}:${issue.message}`).join('\n'),
    /manifest\.override\.parameters\.customerRepoCommitSha/u
  );
  assert.match(
    override.issues.map((issue) => `${issue.path}:${issue.message}`).join('\n'),
    /manifest\.override:Expected either expiresAt or manualClear/u
  );
  assert.match(
    revision.issues.map((issue) => `${issue.path}:${issue.message}`).join('\n'),
    /tenantRevision\.customerRepoCommitSha/u
  );
});

test('managed-hosting helpers throw on invalid uniqueness inputs', () => {
  assert.throws(() => createHostnameClaimKey('bad hostname'), /hostname/u);
  assert.throws(() => createCloudflareTargetClaimKey('AcmeProd'), /cloudflareTarget/u);
  assert.throws(
    () =>
      assertValidHostingControlOverride({
        kind: 'cataloga-override',
        version: 1,
        tenantId: 'tnt_01HXYZABCDEFG',
        slug: 'acme',
        override: {
          kind: 'resume',
          reason: 'Resume service',
          actor: 'operator@example.com',
          ticket: 'OPS-45',
          createdAt: '2026-03-14T12:00:00Z',
          manualClear: true,
          parameters: {
            unexpected: true
          }
        }
      }),
    /manifest\.override\.parameters\.unexpected/u
  );
  assert.throws(
    () =>
      assertValidHostingControlOverride({
        kind: 'cataloga-override',
        version: 1,
        tenantId: 'tnt_01HXYZABCDEFG',
        slug: 'acme',
        override: {
          kind: 'force_rollback',
          reason: 'Rollback',
          actor: 'operator@example.com',
          ticket: 'OPS-44',
          createdAt: '2026-03-14T12:00:00Z',
          expiresAt: '2026-03-15T12:00:00Z',
          parameters: {
            targetDeploymentId: 'dep_1',
            targetTenantRevisionId: 'trv_1'
          }
        }
      }),
    /exactly one of targetDeploymentId or targetTenantRevisionId/u
  );
});
