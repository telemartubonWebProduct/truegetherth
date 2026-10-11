#!/usr/bin/env node
// The local production server from a distance: every answer is held back a little, as over a real
// network. What a page asks for after its first paint must not be back before that paint shows,
// or measurements count it (scripts/perf/pagespeed-counts.mjs, docs/renovation/R10-FIRST-PAINT.md).
//
//   node scripts/perf/delay-proxy.mjs [delay in ms, default 40] [port, default 3299] [server's port, default 3210]
import http from "node:http";

const [delay = "40", port = "3299", target = "3210"] = process.argv.slice(2);

http
  .createServer((request, response) => {
    setTimeout(() => {
      const forward = http.request({ host: "localhost", port: Number(target), path: request.url, method: request.method, headers: { ...request.headers, host: `localhost:${target}` } }, (answer) => {
        response.writeHead(answer.statusCode ?? 502, answer.headers);
        answer.pipe(response);
      });
      forward.on("error", () => {
        response.statusCode = 502;
        response.end();
      });
      request.pipe(forward);
    }, Number(delay));
  })
  .listen(Number(port), () => console.log(`http://localhost:${port} → http://localhost:${target}, ${delay} ms later`));
