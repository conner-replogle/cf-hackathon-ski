import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Events Table
export const events = sqliteTable("Events", {
  id: integer("id").primaryKey(),
  eventName: text("event_name").notNull().unique(),
  eventLocation: text("event_location"),
  eventDate: text("event_date"),
  eventCoordinates: text("event_coordinates"),
});

// Athletes Table
export const athletes = sqliteTable("Athletes", {
  id: integer("id").primaryKey(),
  athleteName: text("athlete_name").notNull(),
});

// Routes Table
export const routes = sqliteTable("Routes", {
  id: integer("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  routeName: text("route_name").notNull(),
});

// Turns Table
export const turns = sqliteTable("Turns", {
  id: integer("id").primaryKey(),
  routeId: integer("route_id")
    .notNull()
    .references(() => routes.id, { onDelete: "cascade" }),
  turnOrder: integer("turn_order").notNull(),
  turnName: text("turn_name").notNull(),
});

// Runs Table
export const runs = sqliteTable("Runs", {
  id: integer("id").primaryKey(),
  routeId: integer("route_id")
    .notNull()
    .references(() => routes.id, { onDelete: "cascade" }),
  athleteId: integer("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  runOrder: integer("run_order").notNull(),
});

// Clips Table
export const clips = sqliteTable(
  "Clips",
  {
    turnId: integer("turn_id")
      .notNull()
      .references(() => turns.id, { onDelete: "cascade" }),
    runId: integer("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    clipR2: text("clip_r2"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.turnId, table.runId] }),
  })
);

export const routesRelations = relations(routes, ({ one, many }) => ({
  event: one(events, {
    fields: [routes.eventId],
    references: [events.id],
  }),
  turns: many(turns),
  runs: many(runs),
}));

export const turnsRelations = relations(turns, ({ one, many }) => ({
  route: one(routes, {
    fields: [turns.routeId],
    references: [routes.id],
  }),
  clips: many(clips),
}));

export const runsRelations = relations(runs, ({ one, many }) => ({
  route: one(routes, {
    fields: [runs.routeId],
    references: [routes.id],
  }),
  athlete: one(athletes, {
    fields: [runs.athleteId],
    references: [athletes.id],
  }),
  clips: many(clips),
}));

export const clipsRelations = relations(clips, ({ one }) => ({
  turn: one(turns, {
    fields: [clips.turnId],
    references: [turns.id],
  }),
  run: one(runs, {
    fields: [clips.runId],
    references: [runs.id],
  }),
}));

export const insertEventsSchema = createInsertSchema(events);
export const insertAthletesSchema = createInsertSchema(athletes);
export const insertRunsSchema = createInsertSchema(runs);
export const insertClipsSchema = createInsertSchema(clips);

export const createRouteWithTurnsSchema = z.object({
  name: z.string().min(1, { message: "Route name cannot be empty." }),
  eventId: z.number(),
  turns: z
    .array(
      z.object({
        turnOrder: z.number().int().positive(),
        turnName: z.string().min(1),
      })
    )
    .min(1, { message: "A route must have at least one turn." }),
});
