// Entry point for hosting platforms that run `node index.js` in repo root
// This simply forwards to the server implementation in ./server/server.js

try {
  require('./server/server.js');
} catch (e) {
  console.error('Failed to start server from ./server/server.js', e);
  process.exit(1);
}
