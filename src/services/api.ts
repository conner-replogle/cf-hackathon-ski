import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { hc, type InferRequestType, type InferResponseType } from "hono/client";
import type { AppType } from "worker";

const client = hc<AppType>('/')
const queryClient = new QueryClient()


function useEvents(){
    const events = useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            const res = await client.api.events.$get()
            return await res.json()
        },
    })

    const $post = client.api.events.$post

    const createEvent = useMutation<
        InferResponseType<typeof $post>,
        Error,
        InferRequestType<typeof $post>['json']
    >({
        mutationFn: async (event) => {
        const res = await $post({
            json: event,
        })
        return await res.json()
        },
        onSuccess: async () => {
        queryClient.invalidateQueries({ queryKey: ['events'] })
        },
        onError: (error) => {
        console.log(error)
        },
    })

    return { events, createEvent }

}

function useRuns() {
    const runs = useQuery({
        queryKey: ['runs'],
        queryFn: async () => {
            const res = await client.api.runs.$get()
            return await res.json()
        },
    })

    const $post = client.api.runs.$post

    const createRun = useMutation<
        InferResponseType<typeof $post>,
        Error,
        InferRequestType<typeof $post>['json']
    >({
        mutationFn: async (run) => {
            const res = await $post({
                json: run,
            })
            return await res.json()
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['runs'] })
        },
        onError: (error) => {
            console.log(error)
        },
    })

    return { runs, createRun }
}

function useEventRuns(eventId: string | undefined) {
    const eventRuns = useQuery({
        queryKey: ['runs', 'event', eventId],
        queryFn: async () => {
            if (!eventId) return []
            const res = await client.api.runs.event[':eventId'].$get({
                param: { eventId }
            })
            return await res.json()
        },
        enabled: !!eventId,
    })

    return { eventRuns }
}

function useAthletes() {
    const athletes = useQuery({
        queryKey: ['athletes'],
        queryFn: async () => {
            const res = await client.api.athletes.$get()
            return await res.json()
        },
    })

    return { athletes }
}

function useAthlete(athleteId: string | undefined) {
    const athlete = useQuery({
        queryKey: ['athletes', athleteId],
        queryFn: async () => {
            if (!athleteId) return null
            const res = await client.api.athletes[':id'].$get({
                param: { id: athleteId }
            })
            return await res.json()
        },
        enabled: !!athleteId,
    })

    return { athlete }
}

function useRoutes() {
    const routes = useQuery({
        queryKey: ['routes'],
        queryFn: async () => {
            const res = await client.api.routes.$get()
            return await res.json()
        },
    })

    return { routes }
}

function useRoute(routeId: string | undefined) {
    const route = useQuery({
        queryKey: ['routes', routeId],
        queryFn: async () => {
            if (!routeId) return null
            const res = await client.api.routes[':id'].$get({
                param: { id: routeId }
            })
            return await res.json()
        },
        enabled: !!routeId,
    })

    return { route }
}

function useTurns() {
    const turns = useQuery({
        queryKey: ['turns'],
        queryFn: async () => {
            const res = await client.api.turns.$get()
            return await res.json()
        },
    })

    return { turns }
}

function useTurn(turnId: string | undefined) {
    const turn = useQuery({
        queryKey: ['turns', turnId],
        queryFn: async () => {
            if (!turnId) return null
            const res = await client.api.turns[':id'].$get({
                param: { id: turnId }
            })
            return await res.json()
        },
        enabled: !!turnId,
    })

    return { turn }
}

function useRun(runId: string | undefined) {
    const run = useQuery({
        queryKey: ['runs', runId],
        queryFn: async () => {
            if (!runId) return null
            const res = await client.api.runs[':id'].$get({
                param: { id: runId }
            })
            return await res.json()
        },
        enabled: !!runId,
    })

    return { run }
}

function useEvent(eventId: string | undefined) {
    const event = useQuery({
        queryKey: ['events', eventId],
        queryFn: async () => {
            if (!eventId) return null
            const res = await client.api.events[':id'].$get({
                param: { id: eventId }
            })
            return await res.json()
        },
        enabled: !!eventId,
    })

    return { event }
}

// Hook for creating event athletes (bulk creation)
function useCreateEventAthletes(eventId: string) {
    const createEventAthletes = useMutation({
        mutationFn: async (athletes: string[]) => {
            const res = await client.api.events[':id'].athletes.$post({
                param: { id: eventId },
                json: { athletes },
            })
            return await res.json()
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['events', eventId] })
            queryClient.invalidateQueries({ queryKey: ['athletes'] })
        },
        onError: (error) => {
            console.log(error)
        },
    })

    return { createEventAthletes }
}

// Hook for creating event routes with turns
function useCreateEventRoute(eventId: string) {
    const createEventRoute = useMutation({
        mutationFn: async (routeData: { 
            route_name: string; 
            turns: Array<{ turn_name: string; latitude: number; longitude: number }> 
        }) => {
            const res = await client.api.events[':id'].routes.$post({
                param: { id: eventId },
                json: routeData,
            })
            return await res.json()
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['events', eventId] })
            queryClient.invalidateQueries({ queryKey: ['routes'] })
            queryClient.invalidateQueries({ queryKey: ['turns'] })
        },
        onError: (error) => {
            console.log(error)
        },
    })

    return { createEventRoute }
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
    useCreateEventRoute
}