import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEventRuns } from "../../services/api";
import type { Run, Athlete, Route } from "worker/types";

type EventRun = Run & { athlete_name: string; route_name: string };

export function Watch() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const eventId = searchParams.get("event");

    const { eventRuns } = useEventRuns(eventId || undefined);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAthlete, setSelectedAthlete] = useState("");
    const [selectedRoute, setSelectedRoute] = useState("");

    useEffect(() => {
        if (!eventId) {
            navigate("/watch/event");
        }
    }, [eventId, navigate]);

    const athletesInRuns = useMemo(() => {
        if (!eventRuns.data) return [];
        const athleteMap = new Map<number, Athlete>();
        eventRuns.data.forEach(run => {
            athleteMap.set(run.athlete_id, { id: run.athlete_id, athlete_name: run.athlete_name, event_id: parseInt(eventId!) });
        });
        return Array.from(athleteMap.values());
    }, [eventRuns.data, eventId]);

    const routesInRuns = useMemo(() => {
        if (!eventRuns.data) return [];
        const routeMap = new Map<number, Route>();
        eventRuns.data.forEach(run => {
            routeMap.set(run.route_id, { id: run.route_id, route_name: run.route_name, event_id: parseInt(eventId!) });
        });
        return Array.from(routeMap.values());
    }, [eventRuns.data, eventId]);

    const filteredRuns = useMemo(() => {
        if (!eventRuns.data) return [];
        return eventRuns.data.filter((run: EventRun) => {
            const athleteMatch = selectedAthlete ? run.athlete_id === parseInt(selectedAthlete, 10) : true;
            const routeMatch = selectedRoute ? run.route_id === parseInt(selectedRoute, 10) : true;

            const searchMatch = searchTerm
                ? (run.athlete_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    run.route_name?.toLowerCase().includes(searchTerm.toLowerCase()))
                : true;

            return athleteMatch && routeMatch && searchMatch;
        });
    }, [eventRuns.data, selectedAthlete, selectedRoute, searchTerm]);

    if (!eventId) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-4 sm:p-6">
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-8">
                    Event Runs
                </h1>

                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Search runs..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={selectedAthlete}
                        onChange={(e) => setSelectedAthlete(e.target.value)}
                    >
                        <option value="">All Athletes</option>
                        {athletesInRuns.map((athlete: Athlete) => (
                            <option key={athlete.id} value={athlete.id}>{athlete.athlete_name}</option>
                        ))}
                    </select>
                    <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={selectedRoute}
                        onChange={(e) => setSelectedRoute(e.target.value)}
                    >
                        <option value="">All Routes</option>
                        {routesInRuns.map((route: Route) => (
                            <option key={route.id} value={route.id}>{route.route_name}</option>
                        ))}
                    </select>
                </div>

                {eventRuns.isLoading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {eventRuns.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">Error loading runs: {eventRuns.error.message}</p>
                    </div>
                )}

                {filteredRuns.length === 0 && !eventRuns.isLoading && (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500 text-lg">No runs found matching your criteria.</p>
                    </div>
                )}

                {filteredRuns.length > 0 && (
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {filteredRuns.map((run: EventRun) => (
                            <div key={run.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {run.route_name}
                                    </h3>
                                    <span className="text-sm text-gray-500">
                                        #{run.id}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Athlete:</span>
                                        <span>{run.athlete_name || 'Unknown'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Trail:</span>
                                        <span>{run.route_name || 'Unknown'}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <a href={`/watch/${run.id}`} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
                                        Watch Run
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}