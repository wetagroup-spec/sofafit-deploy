import { createRouter, publicQuery } from "./middleware";
import { ordersRouter } from "./routers/orders";
import { examplesRouter } from "./routers/examples";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  orders: ordersRouter,
  examples: examplesRouter,
});

export type AppRouter = typeof appRouter;
