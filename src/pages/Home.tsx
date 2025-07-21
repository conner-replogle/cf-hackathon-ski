import { useState, useEffect, useMemo } from "react";
import { RunCard } from "@/components/RunCard";
import UploadDialog from "../components/UploadDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


interface Event {
  event_id: number;
  event_name: string;
}
interface Athlete {
  athlete_id: number;
  athlete_name: string;
}
interface Run {
  run_id: number;
  run_name: string;
  event_id: number;
  athlete_id: number;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        const data = await response.json();
        if (data.success) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, []);

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

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const response = await fetch("/api/runs");
        const data = await response.json();
        if (data.success) {
          setRuns(data.runs);
        }
      } catch (error) {
        console.error("Error fetching runs:", error);
      }
    };
    fetchRuns();
  }, []);

  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      if (selectedEvent && run.event_id !== selectedEvent) return false;
      if (selectedAthlete && run.athlete_id !== selectedAthlete) return false;
      if (searchText && !run.run_name.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [runs, selectedEvent, selectedAthlete, searchText]);

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search runs..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-64"
          />
          <Select value={selectedEvent ? String(selectedEvent) : "all"} onValueChange={(value) => setSelectedEvent(value === "all" ? null : Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.event_id} value={String(event.event_id)}>
                  {event.event_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedAthlete ? String(selectedAthlete) : "all"} onValueChange={(value) => setSelectedAthlete(value === "all" ? null : Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by athlete" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Athletes</SelectItem>
              {athletes.map((athlete) => (
                <SelectItem key={athlete.athlete_id} value={String(athlete.athlete_id)}>
                  {athlete.athlete_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => {
              setSelectedEvent(null);
              setSelectedAthlete(null);
              setSearchText("");
          }}>Clear Filters</Button>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>Upload Run</Button>
      </header>
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredRuns.map((run) => {
            const athlete = athletes.find((a) => a.athlete_id === run.athlete_id);
            const event = events.find((e) => e.event_id === run.event_id);
            return <RunCard key={run.run_id} run={run} athlete={athlete} event={event} />;
          })}
        </div>
      </main>
      <UploadDialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen} />
    </div>
  );
}
