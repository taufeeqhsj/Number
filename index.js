export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = `https://api.telegram.org${url.pathname}${url.search}`;

    // 300 seconds timeout – long polling ke liye kaafi
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', 'api.telegram.org');
    newHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    newHeaders.set('Connection', 'keep-alive');
    newHeaders.set('Accept', '*/*');
    newHeaders.set('Keep-Alive', 'timeout=300, max=1000');

    const init = {
      method: request.method,
      headers: newHeaders,
      redirect: 'follow',
      signal: controller.signal,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        init.body = await request.clone().text();
      } catch (e) {}
    }

    try {
      const response = await fetch(targetUrl, init);
      clearTimeout(timeoutId);

      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      newResponse.headers.set('Connection', 'keep-alive');

      return newResponse;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        return new Response(JSON.stringify({
          ok: false,
          error_code: 504,
          description: 'Worker: Timeout (300s)'
        }), {
          status: 504,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        ok: false,
        error_code: 502,
        description: `Worker Error: ${err.message}`
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
