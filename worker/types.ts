import { z } from "zod";
import { events, routes, turns, athletes, createRouteWithTurnsSchema, runs, clips } from "./schema";

export type Event = typeof events.$inferSelect;
export type Route = typeof routes.$inferSelect;
export type Turn = typeof turns.$inferSelect;
export type Athlete = typeof athletes.$inferSelect;
export type Run = typeof runs.$inferSelect;
export type Clip = typeof clips.$inferSelect;
export type CreateRouteWithTurns = z.infer<typeof createRouteWithTurnsSchema>;
