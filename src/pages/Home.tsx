import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Hardcoded event data based on the provided schema
const initialEvents = [
  { event_id: 1, event_name: 'Slalom World Cup' },
  { event_id: 2, event_name: 'Freestyle Nationals' },
  { event_id: 3, event_name: 'Big Air Invitational' },
];

export default function Home() {
  const [events, setEvents] = useState(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [newEventName, setNewEventName] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const handleCreateEvent = () => {
    if (newEventName.trim() !== '') {
      const newEvent = {
        event_id: events.length + 1,
        event_name: newEventName,
      };
      setEvents([...events, newEvent]);
      setSelectedEvent(newEvent.event_id);
      setNewEventName('');
      setIsCreatingEvent(false);
    }
  };

  const getSelectedEventName = () => {
    const event = events.find((e) => e.event_id === selectedEvent);
    return event ? event.event_name : '';
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-bold mb-4">Welcome to Ski Video Manager</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Select or create an event to get started.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 text-left">
        <Card>
          <CardHeader>
            <CardTitle>📁 Upload Videos</CardTitle>
            <CardDescription>Drag and drop video files or browse to upload them to your library.</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>📚 Video Library</CardTitle>
            <CardDescription>Browse and play individual videos from your collection.</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>🎵 Playlist Mode</CardTitle>
            <CardDescription>Create playlists and enjoy continuous video playback with reordering support.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {!selectedEvent ? (
        <div className="flex flex-col items-center space-y-4">
          <h3>Select an Event</h3>
          <Select
            onValueChange={(value) => setSelectedEvent(parseInt(value, 10))}
            value={selectedEvent ? String(selectedEvent) : ''}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Choose an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.event_id} value={String(event.event_id)}>
                  {event.event_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-gray-500 font-semibold my-4">or</p>

          {!isCreatingEvent ? (
            <Button onClick={() => setIsCreatingEvent(true)}>
              Create New Event
            </Button>
          ) : (
            <div className="flex flex-col items-center space-y-4 w-full">
              <Input
                type="text"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                placeholder="Enter new event name"
              />
              <Button onClick={handleCreateEvent}>
                Save Event
              </Button>
              <Button onClick={() => setIsCreatingEvent(false)} variant="outline">
                Cancel
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <h3>
            Event: {getSelectedEventName()}
          </h3>
          <div className="flex space-x-4">
            <Link to={`/${selectedEvent}/upload`}>
              <Button>
                Upload Videos
              </Button>
            </Link>
            <Link to={`/${selectedEvent}/library`}>
              <Button>
                Browse Library
              </Button>
            </Link>
          </div>
          <Button onClick={() => setSelectedEvent(null)} variant="outline">
            Back to Event Selection
          </Button>
        </div>
      )}
    </div>
  );
}
