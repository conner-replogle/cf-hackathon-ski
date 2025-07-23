
interface Event{
  name: string;
  id: number;
  date: Date;

}

interface Trail{
  name: string;
  id: number;
  event_id: number;
}

interface Athlete{
  name: string;
  id: number;
}

interface Turn{
  trail_id: number;
  name: string;
  id: number;
}

export const mockEvents:Event[] = [
  { name: "Event 1", id: 1, date: new Date() },
  { name: "Event 2", id: 2, date: new Date() },
  { name: "Event 3", id: 3, date: new Date() },
];

export const mockTrails:Trail[] = [
  { name: "Trail 1", id: 1, event_id: 1 },
  { name: "Trail 2", id: 2, event_id: 1 },
  { name: "Trail 3", id: 3, event_id: 2 },
  { name: "Trail 4", id: 4, event_id: 2 },
];

export const mockTurns: Turn[] = [
  { trail_id: 1, name: "Turn 1", id: 1 },
  { trail_id: 1, name: "Turn 2", id: 2 },
  { trail_id: 1, name: "Turn 3", id: 3 },
  { trail_id: 1, name: "Turn 4", id: 4 },
];

export const mockAthletes: Athlete[] = [{ name: "Lebron james", id: 1 }];
export type { Event, Trail, Athlete, Turn };