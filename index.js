export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = `https://api.telegram.org${url.pathname}${url.search}`;
    
    // Headers copy karo aur Host header fix karo
    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', 'api.telegram.org');
    
    const init = {
      method: request.method,
      headers: newHeaders,
      redirect: 'follow'
    };
    
    // Bina data freeze kiye direct stream forward karo
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
    }
    
    return fetch(targetUrl, init);
  }
};
  
