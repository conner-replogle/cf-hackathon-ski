// Database Entity Types
export interface Event {
  id: number;
  event_name: string;
  event_location: string;
}

export interface Athlete {
  id: number;
  event_id: number;
  athlete_name: string;
}

export interface Route {
  id: number;
  event_id: number;
  route_name: string;
}

export interface Turn {
  id: number;
  route_id: number;
  turn_order: number;
  turn_name: string;
  latitude: number;
  longitude: number;
}

export interface Run {
  id: number;
  route_id: number;
  athlete_id: number;
  run_order: number;
}

export interface Clip {
  turn_id: number;
  run_id: number;
  clip_r2: string | null;
}

// Extended Types with Relations
export interface EventWithRelations extends Event {
  athletes: Athlete[];
  routes: Route[];
}

export interface RouteWithTurns extends Route {
  turns: Turn[];
}

export interface RunWithDetails extends Run {
  athlete_name: string;
  route_name: string;
  event_name: string;
}

// API Request Types
export interface CreateEventRequest {
  event_name: string;
  event_location: string;
}

export interface CreateAthleteRequest {
  athlete_name: string;
}

export interface CreateRouteRequest {
  route_name: string;
  turns: CreateTurnRequest[];
}

export interface CreateTurnRequest {
  turn_name: string;
  latitude: number;
  longitude: number;
}

export interface CreateRunRequest {
  route_id: number;
  athlete_id: number;
  run_order: number;
}

export interface CreateClipRequest {
  turn_id: number;
  run_id: number;
  clip_r2?: string;
}

export interface CreateEventAthletesRequest {
  athletes: string[];
}

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

// Type Guards
export function isEvent(obj: any): obj is Event {
  return obj && typeof obj.id === 'number' && typeof obj.event_name === 'string' && typeof obj.event_location === 'string';
}

export function isAthlete(obj: any): obj is Athlete {
  return obj && typeof obj.id === 'number' && typeof obj.event_id === 'number' && typeof obj.athlete_name === 'string';
}

export function isRoute(obj: any): obj is Route {
  return obj && typeof obj.id === 'number' && typeof obj.event_id === 'number' && typeof obj.route_name === 'string';
}

export function isTurn(obj: any): obj is Turn {
  return obj && typeof obj.id === 'number' && typeof obj.route_id === 'number' && typeof obj.turn_order === 'number' && typeof obj.turn_name === 'string' && typeof obj.latitude === 'number' && typeof obj.longitude === 'number';
}

export function isRun(obj: any): obj is Run {
  return obj && typeof obj.id === 'number' && typeof obj.route_id === 'number' && typeof obj.athlete_id === 'number' && typeof obj.run_order === 'number';
}

export function isClip(obj: any): obj is Clip {
  return obj && typeof obj.turn_id === 'number' && typeof obj.run_id === 'number';
}