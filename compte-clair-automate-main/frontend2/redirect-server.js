// Simple redirect server for password reset links
// Run this with: node redirect-server.js
// This will redirect reset password links from :3000 to :8080

const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/reset-password') {
    const token = parsedUrl.query.token;
    const redirectUrl = `http://localhost:8080/reset-password?token=${token}`;
    
    res.writeHead(302, {
      'Location': redirectUrl
    });
    res.end();
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Redirect server running on http://localhost:${PORT}`);
  console.log('This will redirect reset password links to the frontend on port 8080');
});