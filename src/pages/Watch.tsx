import { useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Run {
  run_id: number;
  run_name: string;
  event_id: number;
  athlete_id: number;
}

interface Turn {
  turn_id: number;
  turn_name: string;
  event_id: number;
  athlete_id: number;
  run_id: number;
  r2_video_link: string;
}

interface Athlete {
  athlete_id: number;
  athlete_name: string;
}

export default function Watch() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentEventId = eventId ? parseInt(eventId, 10) : null;
  const selectedRunId = searchParams.get("runId") ? parseInt(searchParams.get("runId")!, 10) : null;

  const [runs, setRuns] = useState<Run[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch athletes for displaying names
  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const response = await fetch("/api/athletes");
        const data = await response.json();
        if (data.success) {
          setAthletes(data.athletes);
        }
      } catch (error) {
        console.error("Error fetching athletes:", error);
      }
    };
    fetchAthletes();
  }, []);

  // Fetch all runs for the event
  useEffect(() => {
    const fetchRuns = async () => {
      if (!currentEventId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${currentEventId}/runs`);
        const data = await response.json();
        if (data.success) {
          setRuns(data.runs);
        } else {
          setError("Failed to fetch runs");
        }
      } catch (error) {
        console.error("Error fetching runs:", error);
        setError("Error fetching runs");
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, [currentEventId]);

  // Fetch turns for the selected run
  useEffect(() => {
    const fetchTurns = async () => {
      if (!selectedRunId) {
        setTurns([]);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(`/api/runs/${selectedRunId}/turns`);
        const data = await response.json();
        if (data.success) {
          setTurns(data.turns);
        } else {
          setError("Failed to fetch turns");
        }
      } catch (error) {
        console.error("Error fetching turns:", error);
        setError("Error fetching turns");
      } finally {
        setLoading(false);
      }
    };

    fetchTurns();
  }, [selectedRunId]);

  const handleRunSelect = (runId: number) => {
    setSearchParams({ runId: runId.toString() });
  };

  const getAthleteName = (athleteId: number) => {
    const athlete = athletes.find(a => a.athlete_id === athleteId);
    return athlete ? athlete.athlete_name : `Athlete ${athleteId}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Watch Event {currentEventId}
        </h1>

        {!selectedRunId ? (
          // Show list of runs when no run is selected
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Select a Run to Watch</h2>
            {runs.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-gray-600">No runs found for this event.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {runs.map((run) => (
                  <Card key={run.run_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{run.run_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Athlete: {getAthleteName(run.athlete_id)}
                      </p>
                      <Button 
                        onClick={() => handleRunSelect(run.run_id)}
                        className="w-full"
                      >
                        Watch Run
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Show video player when run is selected
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                Watching: {runs.find(r => r.run_id === selectedRunId)?.run_name}
              </h2>
              <Button 
                variant="outline" 
                onClick={() => setSearchParams({})}
              >
                ← Back to Runs
              </Button>
            </div>

            {turns.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-gray-600">No turns found for this run.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <VideoPlayer turns={turns} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}