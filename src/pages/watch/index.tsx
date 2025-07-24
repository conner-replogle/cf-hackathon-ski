import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"
import { useEventRuns } from "../../services/api";

export function Watch(){
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const eventId = searchParams.get("event");
    
    const { eventRuns } = useEventRuns(eventId || undefined);

    useEffect(() => {
        if (!eventId) {
          navigate("/watch/event");
        }
    }, [eventId, navigate]);

    if (!eventId) {
        return null; // Will redirect via useEffect
    }
    
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-4 sm:p-6">
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-8">
                    Event Runs
                </h1>
                
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
                
                {eventRuns.data && Array.isArray(eventRuns.data) && eventRuns.data.length === 0 && (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500 text-lg">No runs found for this event.</p>
                    </div>
                )}
                
                {eventRuns.data && Array.isArray(eventRuns.data) && eventRuns.data.length > 0 && (
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {eventRuns.data.map((run) => (
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
    )
}