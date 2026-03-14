import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../deploy/cloudflare/worker.mjs';

const createJsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8'
    }
  });

const createEnv = (assetMap) => ({
  ASSETS: {
    fetch: async (request) => {
      const path = request instanceof URL ? request.pathname : new URL(request.url).pathname;
      if (path in assetMap) {
        return createJsonResponse(assetMap[path]);
      }

      return new Response('not found', { status: 404 });
    }
  }
});

test('Cloudflare worker exposes views and metadata from packaged assets', async () => {
  const env = createEnv({
    '/bundle.json': {
      graph: {
        views: [{ kind: 'view', id: 'hosts', title: 'Hosts', entityTypes: ['host'] }]
      }
    },
    '/metadata.json': {
      product: 'Ledra',
      deploymentVersion: 'test-deploy'
    }
  });

  const viewsResponse = await worker.fetch(new Request('https://example.com/api/views'), env);
  const metadataResponse = await worker.fetch(new Request('https://example.com/api/metadata'), env);
  const healthResponse = await worker.fetch(new Request('https://example.com/health'), env);

  assert.equal(viewsResponse.status, 200);
  assert.deepEqual(await viewsResponse.json(), [
    { kind: 'view', id: 'hosts', title: 'Hosts', entityTypes: ['host'] }
  ]);
  assert.equal(metadataResponse.status, 200);
  assert.equal((await metadataResponse.json()).deploymentVersion, 'test-deploy');
  assert.equal(healthResponse.status, 200);
  assert.equal((await healthResponse.json()).readOnly, true);
});

test('Cloudflare worker returns 500 when packaged bundle is missing', async () => {
  const response = await worker.fetch(new Request('https://example.com/api/views'), createEnv({}));

  assert.equal(response.status, 500);
  assert.match((await response.json()).error, /bundle\.json/u);
});

test('Cloudflare worker rejects non-read-only methods on API routes', async () => {
  const response = await worker.fetch(
    new Request('https://example.com/api/metadata', { method: 'POST' }),
    createEnv({})
  );

  assert.equal(response.status, 405);
});
