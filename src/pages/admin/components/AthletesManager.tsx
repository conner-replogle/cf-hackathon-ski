import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAthletes, useEvents } from '@/services/api';
import type { Athlete } from 'worker/types';
import { PlusCircle } from 'lucide-react';

export function AthletesManager() {
  const { athletes } = useAthletes();
  const { events } = useEvents();

  const eventMap = new Map(events.data?.map(e => [e.id.toString(), e.event_name]));

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Athletes</h2>
        <CreateAthleteDialog />
      </div>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {athletes.data?.map((athlete: Athlete) => (
          <Card key={athlete.id}>
            <CardHeader>
              <CardTitle className="truncate">{athlete.athlete_name}</CardTitle>
              <CardDescription>Event: {eventMap.get(athlete.event_id.toString()) || 'N/A'}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">ID: {athlete.id}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {athletes.data?.length === 0 && <p className="text-gray-500">No athletes found. Create one to get started.</p>}
    </section>
  );
}

function CreateAthleteDialog() {
  const [open, setOpen] = useState(false);
  const [athleteName, setAthleteName] = useState('');
  const [eventId, setEventId] = useState<string | undefined>(undefined);
  const { createAthlete } = useAthletes();
  const { events } = useEvents();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteName.trim() || !eventId) return;
    await createAthlete.mutateAsync({ athlete_name: athleteName, event_id: parseInt(eventId, 10) });
    setAthleteName('');
    setEventId(undefined);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!events.data || events.data.length === 0}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Athlete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Athlete</DialogTitle>
          <DialogDescription>
            Add a new athlete and assign them to an event.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={athleteName}
                onChange={(e) => setAthleteName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Mikaela Shiffrin"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event" className="text-right">
                Event
              </Label>
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.data?.map(event => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.event_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createAthlete.isPending || !eventId}>
              {createAthlete.isPending ? 'Saving...' : 'Save Athlete'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
