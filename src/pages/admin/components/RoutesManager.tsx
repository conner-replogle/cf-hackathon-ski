import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoutes, useEvents, useCreateEventRoute, useTurns } from '@/services/api';
import type { Route } from 'worker/types';
import { PlusCircle, X } from 'lucide-react';

export function RoutesManager() {
  const { routes } = useRoutes();
  const { turns } = useTurns();
  const { events } = useEvents();

  const eventMap = new Map(events.data?.map(e => [e.id, e.event_name]));

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Routes</h2>
        <CreateRouteDialog />
      </div>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {routes.data?.map((route: Route) => {
          const routeTurns = turns.data?.filter(t => t.route_id === route.id) || [];
          return (
            <Card key={route.id}>
              <CardHeader>
                <CardTitle className="truncate">{route.route_name}</CardTitle>
                <CardDescription>Event: {eventMap.get(route.event_id) || 'N/A'}</CardDescription>
              </CardHeader>
              <CardContent>
                 <p className="text-sm font-medium text-gray-700">Turns: {routeTurns.length}</p>
                 <ul className="text-xs text-gray-500 list-disc pl-4 mt-1">
                   {routeTurns.slice(0, 3).map(t => <li key={t.id} className="truncate">{t.turn_name}</li>)}
                   {routeTurns.length > 3 && <li>...and {routeTurns.length - 3} more</li>}
                 </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {routes.data?.length === 0 && <p className="text-gray-500">No routes found. Create one to get started.</p>}
    </section>
  );
}

function CreateRouteDialog() {
  const [open, setOpen] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [eventId, setEventId] = useState<string | undefined>(undefined);
  const [turns, setTurns] = useState([{ turn_name: '', latitude: 0, longitude: 0 }]);
  const { events } = useEvents();
  const { createEventRoute } = useCreateEventRoute(eventId || '');

  const handleTurnChange = (index: number, field: 'turn_name' | 'latitude' | 'longitude', value: string) => {
    const newTurns = [...turns];
    const turn = { ...newTurns[index] };

    if (field === 'latitude' || field === 'longitude') {
      turn[field] = parseFloat(value);
    } else {
      turn[field] = value;
    }
    newTurns[index] = turn;
    setTurns(newTurns);
  };

  const addTurn = () => {
    setTurns([...turns, { turn_name: '', latitude: 0, longitude: 0 }]);
  };

  const removeTurn = (index: number) => {
    const newTurns = turns.filter((_, i) => i !== index);
    setTurns(newTurns);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName.trim() || !eventId || turns.some(t => !t.turn_name.trim())) return;
    await createEventRoute.mutateAsync({ route_name: routeName, turns });
    setRouteName('');
    setEventId(undefined);
    setTurns([{ turn_name: '', latitude: 0, longitude: 0 }]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!events.data || events.data.length === 0}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Route
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Route</DialogTitle>
          <DialogDescription>
            Add a new route with its turns and assign it to an event.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Route Name
              </Label>
              <Input
                id="name"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Downhill Course"
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
            <div>
              <Label>Turns</Label>
              <div className="space-y-2 mt-2">
                {turns.map((turn, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={turn.turn_name}
                      onChange={(e) => handleTurnChange(index, 'turn_name', e.target.value)}
                      placeholder={`Turn ${index + 1} Name`}
                      className="flex-grow"
                    />
                    <Input
                      type="number"
                      value={turn.latitude}
                      onChange={(e) => handleTurnChange(index, 'latitude', e.target.value)}
                      placeholder="Lat"
                      className="w-24"
                    />
                    <Input
                      type="number"
                      value={turn.longitude}
                      onChange={(e) => handleTurnChange(index, 'longitude', e.target.value)}
                      placeholder="Lon"
                      className="w-24"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTurn(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addTurn} className="mt-2">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Turn
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createEventRoute.isPending || !eventId}>
              {createEventRoute.isPending ? 'Saving...' : 'Save Route'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
