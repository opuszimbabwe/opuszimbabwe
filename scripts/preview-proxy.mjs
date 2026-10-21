// Arena preview reverse proxy.
//
// Wrangler must stay bound to loopback (binding it to 0.0.0.0 makes
// Miniflash claim the public port for an internal socket), so this
// tiny proxy exposes the local Pages dev server on 0.0.0.0:35211
// for the Arena live preview.

import http from 'node:http';

const UPSTREAM = 'http://127.0.0.1:8788';
const PORT = 35211;

const server = http.createServer((req, res) => {
  const proxyReq = http.request(
    UPSTREAM + req.url,
    { method: req.method, headers: { ...req.headers, host: '127.0.0.1:8788' } },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );
  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end(`Preview proxy error: ${err.message}`);
  });
  req.pipe(proxyReq);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Preview proxy listening on 0.0.0.0:${PORT} -> ${UPSTREAM}`);
});
