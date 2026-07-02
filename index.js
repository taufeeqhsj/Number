export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = `https://api.telegram.org${url.pathname}${url.search}`;

    // 180 seconds timeout – ample time for long polling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);

    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', 'api.telegram.org');
    newHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    newHeaders.set('Connection', 'keep-alive');
    newHeaders.set('Accept', '*/*');

    const init = {
      method: request.method,
      headers: newHeaders,
      redirect: 'follow',
      signal: controller.signal,
    };

    // Only add body for non-GET/HEAD requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        init.body = await request.clone().text();
      } catch (e) {
        // Ignore body read errors
      }
    }

    try {
      const response = await fetch(targetUrl, init);
      clearTimeout(timeoutId);

      // Create new response with CORS headers
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');

      return newResponse;
    } catch (err) {
      clearTimeout(timeoutId);

      // Always return JSON response (never HTML error page)
      if (err.name === 'AbortError') {
        return new Response(JSON.stringify({
          ok: false,
          error_code: 504,
          description: 'Worker: Gateway Timeout (180s)'
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
