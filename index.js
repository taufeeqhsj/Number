export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = `https://api.telegram.org${url.pathname}${url.search}`;
    
    // 60 seconds timeout – ample time for handshake
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', 'api.telegram.org');
    newHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    const init = {
      method: request.method,
      headers: newHeaders,
      redirect: 'follow',
      signal: controller.signal,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
    }

    try {
      const response = await fetch(targetUrl, init);
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return new Response('Worker: Timeout (60s)', { status: 504 });
      }
      return new Response(`Worker Error: ${err.message}`, { status: 502 });
    }
  }
};
