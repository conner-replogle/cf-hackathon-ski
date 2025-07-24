import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Event, Athlete, Route, Turn } from 'worker/types';
import { Users, MapPin, Trophy, Loader2 } from 'lucide-react';
import { useEvents, useAthletes, useRoutes, useTurns } from '@/services/api';

// Main Admin Component
export function Admin() {
  const [activeTab, setActiveTab] = useState<'events' | 'routes' | 'athletes'>('events');
  
  const { events: { data: eventsData, isLoading: eventsLoading } } = useEvents();
  const { athletes: { data: athletesData, isLoading: athletesLoading } } = useAthletes();
  const { routes: { data: routesData, isLoading: routesLoading } } = useRoutes();
  const { turns: { data: turnsData, isLoading: turnsLoading } } = useTurns();
    
  const isLoading = eventsLoading || athletesLoading || routesLoading || turnsLoading;

  const tabConfig = [
    { id: 'events' as const, label: 'Events', icon: Trophy, count: eventsData?.length ?? 0 },
    { id: 'routes' as const, label: 'Routes', icon: MapPin, count: routesData?.length ?? 0 },
    { id: 'athletes' as const, label: 'Athletes', icon: Users, count: athletesData?.length ?? 0 }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg font-medium">Loading Admin Data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            A read-only overview of your ski tracking system data.
          </p>
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {tabConfig.map(({ id, label, icon: Icon, count }) => (
              <Button
                key={id}
                variant={activeTab === id ? 'default' : 'outline'}
                className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 h-auto py-3 sm:py-2 px-2 sm:px-4"
                onClick={() => setActiveTab(id)}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium">{label}</span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === 'events' && <EventsList events={eventsData || []} />}
          {activeTab === 'routes' && <RoutesList routes={routesData || []} turns={turnsData || []} />}
          {activeTab === 'athletes' && <AthletesList athletes={athletesData || []} />}
        </div>
      </div>
    </div>
  );
}

// Simplified Read-Only List Components

function EventsList({ events }: { events: Event[] }) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Events</h2>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
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
      {events.length === 0 && <p className="text-gray-500">No events found.</p>}
    </section>
  );
}

function RoutesList({ routes, turns }: { routes: Route[], turns: Turn[] }) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Routes</h2>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {routes.map((route) => {
          const routeTurns = turns.filter(t => t.route_id === route.id);
          return (
            <Card key={route.id}>
              <CardHeader>
                <CardTitle className="truncate">{route.route_name}</CardTitle>
                <CardDescription>Event ID: {route.event_id}</CardDescription>
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
      {routes.length === 0 && <p className="text-gray-500">No routes found.</p>}
    </section>
  );
}

function AthletesList({ athletes }: { athletes: Athlete[] }) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Athletes</h2>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {athletes.map((athlete) => (
          <Card key={athlete.id}>
            <CardHeader>
              <CardTitle className="truncate">{athlete.athlete_name}</CardTitle>
              <CardDescription>Event ID: {athlete.event_id}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">ID: {athlete.id}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {athletes.length === 0 && <p className="text-gray-500">No athletes found.</p>}
    </section>
  );
}
