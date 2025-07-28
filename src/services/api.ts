import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hc } from "hono/client";
import type { AppType } from "../../worker/index";
import type { Run } from "worker/types";

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
        mutationFn: async (event: { eventName: string; eventLocation: string; eventDate: string; }) => {
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
      const res = await client.api.events[':id'].$get({ param: { id: id.toString() } });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    enabled: !!id,
  });
}
// #endregion

// #region Runs
export function useRuns(eventId?: number, athleteId?: number) {
  const { data: events } = useEvents();

  return useQuery({
    queryKey: ["runs"],
    queryFn: async () => {
      if (!events) return [];

      const allRunsPromises = events.map(event =>
        client.api.events[':eventId'].runs.$get({ param: { eventId: event.id.toString() } })
      );

      const allRunsResponses = await Promise.all(allRunsPromises);

      const runs = await Promise.all(
        allRunsResponses.map(async res => {
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        })
      );

      return runs.flat();
    },
    enabled: !!events,
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
      const res = await client.api.runs[':id'].$get({ param: { id: id.toString() } });
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
      const res = await client.api.events[':eventId'].runs.$get({ param: { eventId: eventId.toString() } });
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
      const res = await client.api.runs[':runId'].clips.$get({ param: { runId: runId.toString() } });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    enabled: !!runId,
  });
}

export function useUploadVideoClip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ runId, turnId, video }: { runId: number; turnId: number; video: File }) => {
      const formData = new FormData();
      formData.append("video", video);
      formData.append("turnId", turnId.toString());

      const res = await client.api.runs[':runId'].clips.upload.$post({
        param: { runId: runId.toString() },
        form: formData as any,
      });

      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clips", variables.runId] });
    },
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
        mutationFn: async (athlete: { athleteName: string;  }) => {
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
      const res = await client.api.athletes[':id'].$get({ param: { id: id.toString() } });
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
      const res = await client.api.routes.$get({ query: { event_id: eventId?.toString() } });
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
      const res = await client.api.routes[':routeId'].$get({ param: { routeId: id.toString() } });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    enabled: !!id,
  });
}

export const useCreateRoute = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (route: { name: string; eventId: number; turns: { turnOrder: number; turnName: string; latitude: number; longitude: number; }[] }) => {
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
        const res = await client.api.turns.$get({ query: { route_id: routeId.toString() } });
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    },
    enabled: !!routeId
  });
}

export function useTurn(id?: number) {
  return useQuery({
    queryKey: ["turns", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await client.api.turns[':id'].$get({ param: { id: id.toString() } });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    enabled: !!id,
  });
}

