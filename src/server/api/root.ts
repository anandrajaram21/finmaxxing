import {
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import { allocationsRouter } from "@/server/api/routers/allocations";
import { goalsRouter } from "@/server/api/routers/goals";
import { investmentsRouter } from "@/server/api/routers/investments";
import { transactionsRouter } from "@/server/api/routers/transactions";

export const appRouter = createTRPCRouter({
  allocations: allocationsRouter,
  goals: goalsRouter,
  investments: investmentsRouter,
  transactions: transactionsRouter,
  health: publicProcedure.query(() => ({ ok: true })),
});

export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.health();
 */
export const createCaller = createCallerFactory(appRouter);
