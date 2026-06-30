export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = `https://api.telegram.org${url.pathname}${url.search}`;
    
    // Request headers ko safely clone aur modify kiya
    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', 'api.telegram.org');
    
    const init = {
      method: request.method,
      headers: newHeaders,
      redirect: 'follow'
    };
    
    // GET aur HEAD requests ke alawa baaki sabme body pass karenge
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
    }
    
    try {
      const response = await fetch(targetUrl, init);
      return response;
    } catch (err) {
      // Agar Telegram server down ho ya timeout ho toh worker clean response dega
      return new Response(`Worker Proxy Error: ${err.message}`, { status: 502 });
    }
  }
};
