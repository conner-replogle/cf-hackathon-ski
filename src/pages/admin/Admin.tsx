import { useState } from 'react';
import { EventsManager } from './components/EventsManager';
import { AthletesManager } from './components/AthletesManager';
import { Button } from '@/components/ui/button';

import { Users, Trophy, Loader2 } from 'lucide-react';
import { useEvents, useAthletes } from '@/services/api';

// Main Admin Component
export function Admin() {
  const [activeTab, setActiveTab] = useState<'events' | 'routes' | 'athletes'>('events');
  
  const { data: events,isPending: eventsLoading } = useEvents();
  const { data: athletes,isPending: athletesLoading } = useAthletes();

  const tabConfig = [
    { id: 'events' as const, label: 'Events', icon: Trophy, count: events?.length ?? 0 },
    { id: 'athletes' as const, label: 'Athletes', icon: Users, count: athletes?.length ?? 0 }
  ];

  if (eventsLoading || athletesLoading ) {
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
          <div className="grid grid-cols-2 gap-2">
            {tabConfig.map(({ id, label, icon: Icon, count }) => (
              <Button
                key={id}
                variant={activeTab === id ? 'default' : 'outline'}
                onClick={() => setActiveTab(id)}
                className="justify-start "
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium">{label}</span>
                  <span className="text-xs text-black bg-white 0 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === 'events' && <EventsManager />}
          {activeTab === 'athletes' && <AthletesManager />}
        </div>
      </div>
    </div>
  );
}


