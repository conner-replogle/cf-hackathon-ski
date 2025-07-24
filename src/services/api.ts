import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { hc, type InferRequestType, type InferResponseType } from "hono/client";
import type { AppType } from "worker";
import type { Event, Athlete, Route, Turn, Run } from "worker/types";

export const client = hc<AppType>("/");
const queryClient = new QueryClient();

function useEvents() {
  const events = useQuery<Event[], Error>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await client.api.events.$get();
      if (!res.ok) throw new Error("Failed to fetch events");
      return await res.json();
    },
  });

  const $post = client.api.events.$post;

  const createEvent = useMutation<
    InferResponseType<typeof $post>,
    Error,
    InferRequestType<typeof $post>["json"]
  >({
    mutationFn: async (event) => {
      const res = await $post({
        json: event,
      });
      if (!res.ok) throw new Error("Failed to create event");
      return await res.json();
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => {
      console.log(error);
    },
  });

  return { events, createEvent };
}

function useRuns(routeId?: string, athleteId?: string) {
  const runs = useQuery<Run[], Error>({
    queryKey: ["runs", routeId, athleteId],
    queryFn: async () => {
      const res = await client.api.runs.$get({
        query: { route_id: routeId, athlete_id: athleteId },
      });

      return await res.json();
    },
  });

  const $post = client.api.runs.$post;

  const createRun = useMutation<
    InferResponseType<typeof $post>,
    Error,
    InferRequestType<typeof $post>["json"]
  >({
    mutationFn: async (run) => {
      const res = await $post({
        json: run,
      });
      if (!res.ok) throw new Error("Failed to create run");
      return await res.json();
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["runs"] });
    },
    onError: (error) => {
      console.log(error);
    },
  });

  return { runs, createRun };
}

function useEventRuns(eventId: string | undefined) {
  const eventRuns = useQuery<
    (Run & { athlete_name: string; route_name: string })[],
    Error
  >({
    queryKey: ["runs", "event", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const res = await client.api.runs.event[":eventId"].$get({
        param: { eventId },
      });
      if (!res.ok) throw new Error("Failed to fetch event runs");
      return await res.json();
    },
    enabled: !!eventId,
  });

  return { eventRuns };
}

function useAthletes() {
  const athletes = useQuery<Athlete[], Error>({
    queryKey: ["athletes"],
    queryFn: async () => {
      const res = await client.api.athletes.$get();
      if (!res.ok) throw new Error("Failed to fetch athletes");
      return await res.json();
    },
  });

  return { athletes };
}

function useAthlete(athleteId: string | undefined) {
  const athlete = useQuery<Athlete | null, Error>({
    queryKey: ["athletes", athleteId],
    queryFn: async () => {
      if (!athleteId) return null;
      const res = await client.api.athletes[":id"].$get({
        param: { id: athleteId },
      });
      if (!res.ok) return null;
      return await res.json();
    },
    enabled: !!athleteId,
  });

  return { athlete };
}

function useRoutes(eventId?: string) {
  const routes = useQuery({
    queryKey: ["routes", eventId],
    queryFn: async () => {
      const res = await client.api.routes.$get({
        query: {
          ...(eventId && { event_id: eventId }),
        },
      });
      return await res.json();
    },
  });

  return { routes };
}

function useRoute(routeId: string | undefined) {
  const route = useQuery({
    queryKey: ["routes", routeId],
    queryFn: async () => {
      if (!routeId) return null;
      const res = await client.api.routes[":id"].$get({
        param: { id: routeId },
      });
      if (!res.ok) return null;
      return await res.json();
    },
    enabled: !!routeId,
  });

  return { route };
}

function useTurns(routeId?: number) {
  const turns = useQuery({
    queryKey: ["turns", routeId],
    queryFn: async () => {
      const res = await client.api.turns.$get({
        query: {
          ...(routeId && { route_id: routeId }),
        },
      });
      return await res.json();
    },
  });

  return { turns };
}

function useTurn(turnId: string | undefined) {
  const turn = useQuery<Turn | null, Error>({
    queryKey: ["turns", turnId],
    queryFn: async () => {
      if (!turnId) return null;
      const res = await client.api.turns[":id"].$get({
        param: { id: turnId },
      });
      if (!res.ok) return null;
      return await res.json();
    },
    enabled: !!turnId,
  });

  return { turn };
}

function useRun(runId: string | undefined) {
  const run = useQuery<Run | null, Error>({
    queryKey: ["runs", runId],
    queryFn: async () => {
      if (!runId) return null;
      const res = await client.api.runs[":id"].$get({
        param: { id: runId },
      });
      if (!res.ok) return null;
      return await res.json();
    },
    enabled: !!runId,
  });

  return { run };
}

function useEvent(eventId: string | undefined) {
  const event = useQuery<Event | null, Error>({
    queryKey: ["events", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const res = await client.api.events[":id"].$get({
        param: { id: eventId },
      });
      if (!res.ok) return null;
      return await res.json();
    },
    enabled: !!eventId,
  });

  return { event };
}
function useRunClips(runId: string | undefined) {
  const clips = useQuery({
    queryKey: ["clips", runId],
    queryFn: async () => {
      const res = await client.api.runs[":runId"].clips.$get({
        param: { runId: runId! },
      });
      return await res.json();
    },
    enabled: !!runId,
  });
  console.log(clips.data);

  return { clips };
}
// Hook for creating event athletes (bulk creation)
function useCreateEventAthletes(eventId: string) {
  const createEventAthletes = useMutation({
    mutationFn: async (athletes: string[]) => {
      const res = await client.api.events[":id"].athletes.$post({
        param: { id: eventId },
        json: { athletes },
      });
      if (!res.ok) throw new Error("Failed to create event athletes");
      return await res.json();
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
    },
    onError: (error) => {
      console.log(error);
    },
  });

  return { createEventAthletes };
}

// Hook for creating event routes with turns
function useCreateEventRoute(eventId: string) {
  const createEventRoute = useMutation({
    mutationFn: async (routeData: {
      route_name: string;
      turns: Array<{ turn_name: string; latitude: number; longitude: number }>;
    }) => {
      const res = await client.api.events[":id"].routes.$post({
        param: { id: eventId },
        json: routeData,
      });
      if (!res.ok) throw new Error("Failed to create event route");
      return await res.json();
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["turns"] });
    },
    onError: (error) => {
      console.log(error);
    },
  });

  return { createEventRoute };
  return { createEventRoute };
}

export {
  queryClient,
  useEvents,
  useEvent,
  useRuns,
  useRun,
  useEventRuns,
  useAthletes,
  useAthlete,
  useRoutes,
  useRoute,
  useTurns,
  useTurn,
  useCreateEventAthletes,
  useCreateEventRoute,
  useRunClips,
};
