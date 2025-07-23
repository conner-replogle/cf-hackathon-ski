import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { VideoPlayerContainer } from "@/components/VideoPlayerContainer";
import { Card, CardContent } from "@/components/ui/card";

interface Athlete {
  athlete_id: number;
  athlete_name: string;
}

interface Run {
  run_id: number;
  run_name: string;
  athlete: Athlete;
  event_id: number;
}

interface Turn {
  turn_id: number;
  turn_name: string;
  event_id: number;
  athlete_id: number;
  run_id: number;
  r2_video_link: string;
}



export default function Video() {
  const { runId } = useParams<{ runId: string }>();

  const [run, setRun] = useState<Run | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRunAndTurns = async () => {
      if (!runId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch run details
        const runResponse = await fetch(`/api/runs/${runId}`);
        const runData:{success: boolean, run: Run, error: string} = await runResponse.json();

        if (runData.success) {
          
          setRun(runData.run);
        } else {
          throw new Error(runData.error || 'Failed to fetch run details');
        }

        // Fetch turns for the selected run
        const turnsResponse = await fetch(`/api/runs/${runId}/turns`);
        const turnsData:{success: boolean, turns: Turn[], error: string} = await turnsResponse.json();

        if (turnsData.success) {
          setTurns(turnsData.turns);
        } else {
          throw new Error(turnsData.error || 'Failed to fetch turns');
        }

        setError(null);
      } catch (err: any) {
        console.error("Error fetching run data:", err);
        setError(err.message || "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchRunAndTurns();
  }, [runId]);




    if (!runId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>Please select a run to watch.</p>
      </div>
    );
  }

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
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="w-full max-w-none p-0">
        {run && (
          <header className="bg-card p-6 shadow-md mb-8">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">{run.run_name}</h1>
              <p className="mt-2 text-lg text-muted-foreground">{run.athlete.athlete_name}</p>
            </div>
          </header>
        )}

        <main className="px-6 pb-8">
          {turns.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">No turns found for this run.</p>
              </CardContent>
            </Card>
          ) : (
              <VideoPlayerContainer turns={turns} />
          )}
        </main>
      </div>
    </div>
  );
}