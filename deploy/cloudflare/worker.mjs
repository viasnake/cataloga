const readAssetJson = async (env, requestUrl, assetPath) => {
  const assetResponse = await env.ASSETS.fetch(new URL(assetPath, requestUrl));
  if (!assetResponse.ok) {
    return {
      ok: false,
      response: Response.json({ error: `${assetPath} not found in assets output` }, { status: 500 })
    };
  }

  return {
    ok: true,
    payload: await assetResponse.json()
  };
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (url.pathname === '/health' || url.pathname.startsWith('/api/')) {
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
      }
    }

    if (url.pathname === '/health') {
      return Response.json({ ok: true, readOnly: true, runtime: 'cloudflare-workers' });
    }

    if (url.pathname === '/api/views') {
      const bundle = await readAssetJson(env, url, '/bundle.json');
      if (!bundle.ok) {
        return bundle.response;
      }

      return Response.json(bundle.payload.graph?.views ?? []);
    }

    if (url.pathname === '/api/metadata') {
      const metadata = await readAssetJson(env, url, '/metadata.json');
      if (!metadata.ok) {
        return metadata.response;
      }

      return Response.json(metadata.payload);
    }

    return env.ASSETS.fetch(request);
  }
};
