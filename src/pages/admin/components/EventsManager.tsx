import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEvents } from '@/services/api';
import type { Event } from 'worker/types';
import { PlusCircle } from 'lucide-react';

export function EventsManager() {
  const { events } = useEvents();

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Events</h2>
        <CreateEventDialog />
      </div>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {events.data?.map((event: Event) => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle className="truncate">{event.event_name}</CardTitle>
              <CardDescription>{event.event_location}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">ID: {event.id}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {events.data?.length === 0 && <p className="text-gray-500">No events found. Create one to get started.</p>}
    </section>
  );
}

function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const { createEvent } = useEvents();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) return;
    await createEvent.mutateAsync({ event_name: eventName, event_location: eventLocation });
    setEventName('');
    setEventLocation('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Add a new event to the system. Click save when you're done.
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
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., World Cup Aspen"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Aspen, CO"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createEvent.isPending}>
              {createEvent.isPending ? 'Saving...' : 'Save Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
