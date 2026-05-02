import {
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import { goalsRouter } from "@/server/api/routers/goals";
import { investmentsRouter } from "@/server/api/routers/investments";

export const appRouter = createTRPCRouter({
  goals: goalsRouter,
  investments: investmentsRouter,
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
