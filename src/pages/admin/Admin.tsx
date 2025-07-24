import { useState } from 'react';
import { EventsManager } from './components/EventsManager';
import { AthletesManager } from './components/AthletesManager';
import { RoutesManager } from './components/RoutesManager';
import { Button } from '@/components/ui/button';

import { Users, MapPin, Trophy, Loader2 } from 'lucide-react';
import { useEvents, useAthletes, useRoutes } from '@/services/api';

// Main Admin Component
export function Admin() {
  const [activeTab, setActiveTab] = useState<'events' | 'routes' | 'athletes'>('events');
  
  const { events: { data: eventsData, isLoading: eventsLoading } } = useEvents();
  const { athletes: { data: athletesData, isLoading: athletesLoading } } = useAthletes();
  const { routes: { data: routesData, isLoading: routesLoading } } = useRoutes();
  const isLoading = eventsLoading || athletesLoading || routesLoading;

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
            Manage your events, routes, and athletes.
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
          {activeTab === 'events' && <EventsManager />}
          {activeTab === 'routes' && <RoutesManager />}
          {activeTab === 'athletes' && <AthletesManager />}
        </div>
      </div>
    </div>
  );
}


