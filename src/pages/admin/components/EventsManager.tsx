import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateEvent, useEvents, useGeocoding, type GeocodingResult } from '@/services/api';
import type { Event } from 'worker/types';
import { Edit, MapPin, PlusCircle, Search, X } from 'lucide-react';
import { EditEventRoutesDialog } from './EditEventRoutesDialog';

export function EventsManager() {
  const { data:events } = useEvents();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleEditClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Events</h2>
      <div className="mt-2 mb-8">
        <CreateEventDialog />
      </div>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {events?.map((event: Event) => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle className="truncate">{event.eventName}</CardTitle>
              <CardDescription className="flex items-center">
                <MapPin className="w-4 h-4" />
                {event.eventLocation}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" size="sm" onClick={() => handleEditClick(event)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Routes & Turns
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {events?.length === 0 && <p className="text-gray-500">No events found. Create one to get started.</p>}
      {selectedEvent && (
        <EditEventRoutesDialog
          event={selectedEvent}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
        />
      )}
    </section>
  );
}

function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const { mutateAsync: createEvent, isPending } = useCreateEvent();
  const { data: locations, isLoading: isSearching } = useGeocoding(locationQuery);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show dropdown when there are results and input is focused
  useEffect(() => {
    if (locations && locations.length > 0 && locationQuery.length >= 3) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [locations, locationQuery]);

  const handleLocationSelect = (location: GeocodingResult) => {
    setSelectedLocation(location);
    setLocationQuery(location.display_name);
    setShowDropdown(false);
  };

  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocationQuery(value);
    if (value !== selectedLocation?.display_name) {
      setSelectedLocation(null);
    }
  };

  const clearLocation = () => {
    setLocationQuery('');
    setSelectedLocation(null);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !selectedLocation) return;
    
    await createEvent({ 
      eventName, 
      eventLocation: selectedLocation.display_name,
      eventDate: new Date().toISOString(),
      eventCoordinates: `${selectedLocation.lat},${selectedLocation.lon}`
    });
    
    setEventName('');
    setLocationQuery('');
    setSelectedLocation(null);
    setOpen(false);
  };

  const resetForm = () => {
    setEventName('');
    setLocationQuery('');
    setSelectedLocation(null);
    setShowDropdown(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
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
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <div className="col-span-3 relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    ref={inputRef}
                    id="location"
                    value={locationQuery}
                    onChange={handleLocationInputChange}
                    onFocus={() => {
                      if (locations && locations.length > 0 && locationQuery.length >= 3) {
                        setShowDropdown(true);
                      }
                    }}
                    className="pl-10 pr-10"
                    placeholder="Search for a location..."
                    required
                  />
                  {locationQuery && (
                    <button
                      type="button"
                      onClick={clearLocation}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {showDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {isSearching && (
                      <div className="px-4 py-2 text-sm text-gray-500">Searching...</div>
                    )}
                    {locations?.map((location) => (
                      <button
                        key={location.place_id}
                        type="button"
                        onClick={() => handleLocationSelect(location)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{location.name}</div>
                        <div className="text-gray-500 text-xs truncate">{location.display_name}</div>
                      </button>
                    ))}
                    {locations && locations.length === 0 && locationQuery.length >= 3 && !isSearching && (
                      <div className="px-4 py-2 text-sm text-gray-500">No locations found</div>
                    )}
                  </div>
                )}
                
                {selectedLocation && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                    <div className="flex items-center text-green-800">
                      <MapPin className="h-4 w-4 mr-1" />
                      Selected: {selectedLocation.name}
                    </div>
                    <div className="text-green-600 text-xs mt-1">
                      {selectedLocation.display_name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isPending || !selectedLocation}
            >
              {isPending ? 'Creating...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}