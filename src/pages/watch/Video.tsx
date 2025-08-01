import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useRun, useRunClips } from "@/services/api";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";

export default function Video() {
  const { runId } = useParams<{ runId: string }>();

  const {
    data: run,
    isLoading: loading,
    isError: error,
  } = useRun(runId ? parseInt(runId) : undefined);
  const {
    data: clips,
    isLoading: clipsLoading,
    isError: clipsError,
  } = useRunClips(runId ? parseInt(runId) : undefined);

  if (!runId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>Please select a run to watch.</p>
      </div>
    );
  }

  if (loading || clipsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || clipsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600">Error: {error || clipsError}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="w-full max-w-none p-0">
        <header className="bg-card p-6 shadow-md mb-8 flex justify-between items-center">
          {run && (
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                Run {run.id}
              </h1>
            </div>
          )}
          <Button variant="outline" onClick={() => window.history.back()}>Back</Button>
        </header>

        <main className="px-6 pb-8">
          {clips?.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No clips found for this run.
                </p>
              </CardContent>
            </Card>
          ) : (
            <VideoPlayer clips={clips || []} />
          )}
        </main>
      </div>
    </div>
  );
}

