import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegistryGraph } from '../packages/core/dist/core/src/index.js';
import { validateRegistry } from '../packages/validator/dist/validator/src/index.js';

const entity = (type, id, attributes, overrides = {}) => ({
  kind: 'entity',
  id,
  type,
  title: overrides.title ?? id,
  tags: overrides.tags ?? [],
  attributes,
  sourceFilePath: overrides.sourceFilePath ?? `registry/entities/${type}/${id}.yaml`
});

const relation = (id, type, source, target, overrides = {}) => ({
  kind: 'relation',
  id,
  type,
  source,
  target,
  sourceFilePath: overrides.sourceFilePath ?? `registry/relations/${id}.yaml`
});

const view = (id, overrides = {}) => ({
  kind: 'view',
  id,
  title: overrides.title ?? id,
  entityTypes: overrides.entityTypes ?? ['site'],
  sourceFilePath: overrides.sourceFilePath ?? `registry/views/${id}.yaml`
});

const policy = (id, rules, overrides = {}) => ({
  kind: 'policy',
  id,
  title: overrides.title ?? id,
  rules,
  sourceFilePath: overrides.sourceFilePath ?? `registry/policies/${id}.yaml`
});

const createValidGraph = () =>
  createRegistryGraph({
    entities: [
      entity('site', 'site-tokyo', { name: 'Tokyo' }),
      entity('vlan', 'vlan-100', { name: 'App VLAN', siteId: 'site-tokyo', vlanId: 100 }),
      entity('prefix', 'prefix-app', {
        cidr: '10.0.0.0/24',
        family: 'ipv4',
        siteId: 'site-tokyo',
        vlanId: 'vlan-100',
        gateway: '10.0.0.1'
      }),
      entity('host', 'host-app-01', {
        hostname: 'app-01',
        fqdn: 'app-01.example.test',
        siteId: 'site-tokyo'
      }),
      entity('allocation', 'allocation-app-01', {
        address: '10.0.0.10',
        prefixId: 'prefix-app',
        hostId: 'host-app-01'
      }),
      entity('service', 'service-web', {
        name: 'web',
        hostId: 'host-app-01',
        protocol: 'tcp',
        port: 443,
        exposure: 'internal'
      }),
      entity('dns_record', 'dns-app', {
        name: 'app',
        fqdn: 'app.example.test',
        recordType: 'A',
        value: '10.0.0.10'
      })
    ],
    relations: [
      relation(
        'service-web-resolves-to-dns-app',
        'resolves-to',
        { type: 'service', id: 'service-web' },
        { type: 'dns_record', id: 'dns-app' }
      )
    ],
    views: [view('site-overview')],
    policies: []
  });

const validateGraph = (mutator) => {
  const graph = createValidGraph();
  if (mutator) {
    mutator(graph);
  }
  return validateRegistry(graph);
};

const diagnosticCodes = (result) => result.diagnostics.map((diagnostic) => diagnostic.code);

const assertHasDiagnostic = (result, code) => {
  assert.equal(diagnosticCodes(result).includes(code), true, `Expected diagnostic code '${code}'.`);
};

test('validator accepts the local valid baseline graph', () => {
  const result = validateRegistry(createValidGraph());

  assert.equal(result.ok, true);
  assert.deepEqual(result.diagnostics, []);
});

test('validator reports duplicate entity ids', () => {
  const result = validateGraph((graph) => {
    graph.entities = [
      ...graph.entities,
      entity('site', 'site-tokyo', { name: 'Tokyo 2' }, { sourceFilePath: 'registry/entities/site/dup.yaml' })
    ];
  });

  assertHasDiagnostic(result, 'duplicate-entity-id');
});

test('validator reports missing entity references', () => {
  const result = validateGraph((graph) => {
    graph.entities = graph.entities.map((record) =>
      record.id === 'service-web'
        ? { ...record, attributes: { ...record.attributes, hostId: 'host-missing' } }
        : record
    );
  });

  assertHasDiagnostic(result, 'missing-reference');
});

test('validator reports overlapping prefixes', () => {
  const result = validateGraph((graph) => {
    graph.entities = [
      ...graph.entities,
      entity('prefix', 'prefix-overlap', {
        cidr: '10.0.0.128/25',
        family: 'ipv4',
        siteId: 'site-tokyo',
        vlanId: 'vlan-100',
        gateway: '10.0.0.129'
      })
    ];
  });

  assertHasDiagnostic(result, 'prefix-overlap');
});

test('validator reports duplicate allocation IPs', () => {
  const result = validateGraph((graph) => {
    graph.entities = [
      ...graph.entities,
      entity('allocation', 'allocation-app-02', {
        address: '10.0.0.10',
        prefixId: 'prefix-app'
      })
    ];
  });

  assertHasDiagnostic(result, 'duplicate-allocation-ip');
});

test('validator reports duplicate hostnames or FQDNs', () => {
  const result = validateGraph((graph) => {
    graph.entities = [
      ...graph.entities,
      entity('host', 'host-app-02', {
        hostname: 'app-02',
        fqdn: 'APP-01.EXAMPLE.TEST',
        siteId: 'site-tokyo'
      })
    ];
  });

  assertHasDiagnostic(result, 'duplicate-hostname');
});

test('validator reports duplicate VLAN ids within the same site', () => {
  const result = validateGraph((graph) => {
    graph.entities = [
      ...graph.entities,
      entity('vlan', 'vlan-duplicate', { name: 'Duplicate VLAN', siteId: 'site-tokyo', vlanId: 100 })
    ];
  });

  assertHasDiagnostic(result, 'duplicate-vlan-id-per-site');
});

test('validator reports gateways outside of the prefix', () => {
  const result = validateGraph((graph) => {
    graph.entities = graph.entities.map((record) =>
      record.id === 'prefix-app'
        ? {
            ...record,
            attributes: { ...record.attributes, gateway: '10.0.1.1' }
          }
        : record
    );
  });

  assertHasDiagnostic(result, 'gateway-outside-prefix');
});

test('validator reports invalid policy behavior', () => {
  const result = validateGraph((graph) => {
    graph.policies = [
      policy('service-relation-policy', [
        {
          code: 'allowed-relation',
          targetType: 'service',
          relationType: 'resolves-to',
          allowedTargetTypes: ['host']
        }
      ])
    ];
  });

  assertHasDiagnostic(result, 'invalid-policy-rule');
});
