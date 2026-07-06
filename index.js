export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Target Telegram API URL
    const targetUrl = `https://api.telegram.org${url.pathname}${url.search}`;

    // Handle Preflight OPTIONS requests for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
      redirect: 'follow'
    });

    try {
      const response = await fetch(modifiedRequest);
      
      // Copy response and inject CORS headers
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      return newResponse;
    } catch (err) {
      return new Response(JSON.stringify({
        ok: false,
        error_code: 502,
        description: `Worker Proxy Error: ${err.message}`
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
