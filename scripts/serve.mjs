import {createServer} from 'node:http';
import worker from '../dist/server/index.js';

const portArgumentIndex = process.argv.indexOf('--port');
const port = Number(portArgumentIndex >= 0 ? process.argv[portArgumentIndex + 1] : process.env.PORT || 3000);
const server = createServer(async (request, response) => {
  try {
    const url = `http://${request.headers.host || `localhost:${port}`}${request.url}`;
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const input = new Request(url, {method: request.method, headers: request.headers, body});
    const result = await worker.fetch(input);
    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(Buffer.from(await result.arrayBuffer()));
  } catch (error) {
    console.error(error);
    response.writeHead(500, {'Content-Type': 'text/plain'});
    response.end('Demo server error');
  }
});
server.listen(port, '0.0.0.0', () => console.log(`Nord Ledger local full-stack demo: http://localhost:${port}`));
