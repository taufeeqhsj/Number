export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = `https://api.telegram.org${url.pathname}${url.search}`;

    // Timeout control - 25 seconds (long polling is 20s, so 25s safe)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const newHeaders = new Headers(request.headers);
    // Host header hataya - Telegram doesn't require it

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
      // Response ko waisa hi forward karo
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      // Agar abort hua toh timeout ka error message
      if (err.name === 'AbortError') {
        return new Response('Worker: Request timeout (25s)', { status: 504 });
      }
      // Koi aur error ho toh 502
      return new Response(`Worker Proxy Error: ${err.message}`, { status: 502 });
    }
  }
};
