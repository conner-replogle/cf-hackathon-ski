import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { hc, type InferRequestType, type InferResponseType } from "hono/client";
import type { AppType } from "worker/hono-rpc";

const client = hc<AppType>('/api')
const queryClient = new QueryClient()

function useRuns(){
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

    return {
        runs,
        createRun
    }
}

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

export {queryClient, useRuns, useEvents}