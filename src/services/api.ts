import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { hc } from "hono/client";
import type { AppType } from "../../worker/index";
import type { Athlete, CreateRouteWithTurns, Event, Run } from "worker/types";

const client = hc<AppType>("/");
export const queryClient = new QueryClient();
// #region Events
export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await client.api.events.$get();
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: Omit<Event, "id">) => {
      const res = await client.api.events.$post({ json: event });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: async () => {
      const res = await client.api.events[":id"].$get({
        param: { id: id.toString() },
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    enabled: !!id,
  });
}
// #endregion

// #region Runs
export function useRuns(route_id: number, athlete_id: number) {
  return useQuery({
    queryKey: ["runs", route_id, athlete_id],
    queryFn: async () => {
      const res = await client.api.runs.$get({
        query: {
          route_id: route_id.toString(),
          athlete_id: athlete_id.toString(),
        },
      });
      return await res.json();
    },
  });
}

export function useCreateRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (run: Omit<Run, "id">) => {
      const res = await client.api.runs.$post({ json: run });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["runs"] });
    },
  });
}

export function useRun(id?: number) {
  return useQuery({
    queryKey: ["runs", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await client.api.runs[":id"].$get({
        param: { id: id.toString() },
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    enabled: !!id,
  });
}

export function useEventRuns(eventId?: number) {
  return useQuery({
    queryKey: ["runs", "event", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const res = await client.api.events[":eventId"].runs.$get({
        param: { eventId: eventId.toString() },
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    enabled: !!eventId,
  });
}

export function useRunClips(runId?: number) {
  return useQuery({
    queryKey: ["clips", runId],
    queryFn: async () => {
      if (!runId) return [];
      const res = await client.api.runs[":runId"].clips.$get({
        param: { runId: runId.toString() },
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    enabled: !!runId,
  });
}

// #endregion

// #region Athletes
export function useAthletes() {
  return useQuery({
    queryKey: ["athletes"],
    queryFn: async () => {
      const res = await client.api.athletes.$get();
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
  });
}

export function useCreateAthlete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (athlete: Omit<Athlete, "id">) => {
      const res = await client.api.athletes.$post({ json: athlete });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
    },
  });
}

export function useAthlete(id?: number) {
  return useQuery({
    queryKey: ["athletes", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await client.api.athletes[":id"].$get({
        param: { id: id.toString() },
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    enabled: !!id,
  });
}
// #endregion

// #region Routes
export function useRoutes(eventId?: number) {
  return useQuery({
    queryKey: ["routes", eventId],
    queryFn: async () => {
      const res = await client.api.routes.$get({
        query: { event_id: eventId?.toString() },
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
  });
}

export function useRoute(id?: number) {
  return useQuery({
    queryKey: ["routes", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await client.api.routes[":routeId"].$get({
        param: { routeId: id.toString() },
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    enabled: !!id,
  });
}

export const useCreateRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (route: CreateRouteWithTurns) => {
      const res = await client.api.routes.$post({ json: route });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
};
// #endregion

// #region Turns
export function useTurns(routeId?: number) {
  return useQuery({
    queryKey: ["turns", routeId],
    queryFn: async () => {
      if (!routeId) return [];
      const res = await client.api.turns.$get({
        query: { route_id: routeId.toString() },
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    enabled: !!routeId,
  });
}

export function useTurn(id?: number) {
  return useQuery({
    queryKey: ["turns", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await client.api.turns[":id"].$get({
        param: { id: id.toString() },
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    enabled: !!id,
  });
}

// Add this interface at the top with your other types
export interface GeocodingResult {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;
  name: string;
  types: string[];
  rating?: number;
  business_status?: string;
}

export function useGeocoding(query: string) {
  return useQuery({
    queryKey: ["geocoding", query],
    queryFn: async () => {
      if (!query || query.length < 3) return [];

      const res = await client.api.geo.$get({
        query: { q: query },
      });

      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as GeocodingResult[];
    },
    enabled: !!query && query.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes - geocoding results don't change often
  });
}
