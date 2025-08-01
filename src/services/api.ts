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
    queryKey: ["useEvents"],
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
      queryClient.invalidateQueries({ queryKey: ["useEvents"] });
    },
  });
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: ["useEvent", id],
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
    queryKey: ["useRuns", route_id, athlete_id],
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
      queryClient.invalidateQueries({ queryKey: ["useRuns"] });
    },
  });
}

export function useRun(id?: number) {
  return useQuery({
    queryKey: ["useRun", id],
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
    queryKey: ["useEventRuns", eventId],
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
    queryKey: ["useRunClips", runId],
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

export function useClipStream(clipStreamId?: string) {
  return useQuery({
    queryKey: ["useClipStream", clipStreamId],
    queryFn: async () => {
      if (!clipStreamId) return null;
      const res = await client.api.clips[':clipStreamId'].stream.$get({
        param: { clipStreamId: clipStreamId },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { result: { playback: string } };
      return data.result.playback;
    },
    enabled: !!clipStreamId,
  });
}

// #endregion

// #region Athletes
export function useAthletes() {
  return useQuery({
    queryKey: ["useAthletes"],
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
      queryClient.invalidateQueries({ queryKey: ["useAthletes"] });
    },
  });
}

export function useAthlete(id?: number) {
  return useQuery({
    queryKey: ["useAthlete", id],
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
    queryKey: ["useRoutes", eventId],
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
    queryKey: ["useRoute", id],
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
    queryKey: ["useTurns", routeId],
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
    queryKey: ["useTurn", id],
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
    queryKey: ["useGeocoding", query],
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
