import { Application, Router, oakCors } from './deps.ts';
import { handleWebSocket } from './websocket.ts';

const app = new Application();
const router = new Router();

// deno-lint-ignore no-explicit-any
const log = (...args: any[]) => console.log(new Date(), ...args);

router.get('/api/websocket', handleWebSocket);

router.get('/', (ctx) => {
  const body = {
    code: 200,
    data: Deno.version,
    message: 'Hello world from Deno! Try `GET /echo` on this server.',
  };

  ctx.response.body = JSON.stringify(body);
  ctx.response.headers.set('Content-Type', 'application/json');
});

router.all('/echo', async (ctx) => {
  ctx.response.body = {
    method: ctx.request.method,
    args: Object.fromEntries(ctx.request.url.searchParams.entries()),
    data: (await ctx.request.body().value) ?? '',
    headers: Object.fromEntries(ctx.request.headers.entries()),
    path: ctx.request.url.pathname,
    url: ctx.request.url.toString(),
  };

  log(ctx.response.body);
});

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

const PORT = parseInt(Deno.env.get('PORT') || '8000', 10);

log('Server listening on http://localhost:' + PORT);
await app.listen({ hostname: '0.0.0.0', port: PORT });
