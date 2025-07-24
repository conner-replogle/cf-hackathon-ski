import { z } from "zod";
import {
  EventSchema,
  AthleteSchema,
  RouteSchema,
  TurnSchema,
  RunSchema,
  ClipSchema,
  EventWithRelationsSchema,
  RouteWithTurnsSchema,
  RunWithDetailsSchema,
  CreateEventRequestSchema,
  CreateAthleteRequestSchema,
  CreateRouteRequestSchema,
  CreateRunRequestSchema,
  CreateClipRequestSchema,
  CreateEventAthletesRequestSchema,
  ClipR2ResultSchema,
} from "./schema";

// Database Entity Types
export type Event = z.infer<typeof EventSchema>;
export type Athlete = z.infer<typeof AthleteSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type Turn = z.infer<typeof TurnSchema>;
export type Run = z.infer<typeof RunSchema>;
export type Clip = z.infer<typeof ClipSchema>;

// Extended Types with Relations
export type EventWithRelations = z.infer<typeof EventWithRelationsSchema>;
export type RouteWithTurns = z.infer<typeof RouteWithTurnsSchema>;
export type RunWithDetails = z.infer<typeof RunWithDetailsSchema>;

// API Request Types
export type CreateEventRequest = z.infer<typeof CreateEventRequestSchema>;
export type CreateAthleteRequest = z.infer<typeof CreateAthleteRequestSchema>;
export type CreateRouteRequest = z.infer<typeof CreateRouteRequestSchema>;
export type CreateRunRequest = z.infer<typeof CreateRunRequestSchema>;
export type CreateClipRequest = z.infer<typeof CreateClipRequestSchema>;
export type CreateEventAthletesRequest = z.infer<
  typeof CreateEventAthletesRequestSchema
>;

export type ClipR2Result = z.infer<typeof ClipR2ResultSchema>;

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  error: string;
  success: false;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Collection Response Types
export type EventsResponse = Event[];
export type AthletesResponse = Athlete[];
export type RoutesResponse = Route[];
export type TurnsResponse = Turn[];
export type RunsResponse = Run[];
export type ClipsResponse = Clip[];

// Single Entity Response Types
export type EventResponse = Event;
export type AthleteResponse = Athlete;
export type RouteResponse = Route;
export type TurnResponse = Turn;
export type RunResponse = Run;
export type ClipResponse = Clip;

// Extended Response Types
export type EventWithRelationsResponse = EventWithRelations;
export type RouteWithTurnsResponse = RouteWithTurns;
export type RunsWithDetailsResponse = RunWithDetails[];

// Utility Types
export type EntityId = number;
export type DatabaseResult<T> = {
  results: T[];
  success: boolean;
  meta: {
    served_by: string;
    duration: number;
    changes: number;
    last_row_id: number;
    changed_db: boolean;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
};
