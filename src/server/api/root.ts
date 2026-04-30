import {
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
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
