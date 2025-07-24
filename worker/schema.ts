
import { z } from "zod";

// Database Entity Types
export const EventSchema = z.object({
  id: z.number(),
  event_name: z.string(),
  event_location: z.string(),
});

export const AthleteSchema = z.object({
  id: z.number(),
  event_id: z.number(),
  athlete_name: z.string(),
});

export const RouteSchema = z.object({
  id: z.number(),
  event_id: z.number(),
  route_name: z.string(),
});

export const TurnSchema = z.object({
  id: z.number(),
  route_id: z.number(),
  turn_order: z.number(),
  turn_name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export const RunSchema = z.object({
  id: z.number(),
  route_id: z.number(),
  athlete_id: z.number(),
  run_order: z.number(),
});

export const ClipSchema = z.object({
  turn_id: z.number(),
  run_id: z.number(),
  clip_r2: z.string().nullable().optional(),
});

// Extended Types with Relations
export const EventWithRelationsSchema = EventSchema.extend({
  athletes: z.array(AthleteSchema),
  routes: z.array(RouteSchema),
});

export const RouteWithTurnsSchema = RouteSchema.extend({
  turns: z.array(TurnSchema),
});

export const RunWithDetailsSchema = RunSchema.extend({
  athlete_name: z.string(),
  route_name: z.string(),
});

// API Request Types
export const CreateEventRequestSchema = z.object({
  event_name: z.string(),
  event_location: z.string(),
});

export const CreateAthleteRequestSchema = z.object({
  athlete_name: z.string(),
});

export const CreateRouteRequestSchema = z.object({
  route_name: z.string(),
  turns: z.array(
    z.object({
      turn_name: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    }),
  ),
});

export const CreateRunRequestSchema = z.object({
  route_id: z.number(),
  athlete_id: z.number(),
  run_order: z.number(),
});

export const CreateClipRequestSchema = z.object({
  turn_id: z.number(),
  run_id: z.number(),
  clip_r2: z.string().optional(),
});

export const CreateEventAthletesRequestSchema = z.object({
  athletes: z.array(z.string()),
});

export const ClipR2ResultSchema = z.object({
  clip_r2: z.string(),
});
