import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

interface Run {
  run_id: number;
  run_name: string;
  event_id: number;
  athlete_id: number;
}

interface Athlete {
  athlete_id: number;
  athlete_name: string;
}

interface Event {
  event_id: number;
  event_name: string;
}

interface RunCardProps {
  run: Run;
  athlete?: Athlete;
  event?: Event;
}

export function RunCard({ run, athlete, event }: RunCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{run.run_name}</CardTitle>
        <CardDescription>{athlete ? athlete.athlete_name : "Unknown Athlete"}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* <img src="https://via.placeholder.com/150" alt={run.run_name} className="rounded-md"/> */}
        <Link to={`/watch/${run.run_id}`}>
        <Button >
          Watch
        </Button>
        </Link>
      </CardContent>
      <CardFooter>
        <p>{event ? event.event_name : "Unknown Event"}</p>
      </CardFooter>
    </Card>
  );
}
