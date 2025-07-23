import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { Plus, Edit, Trash2, Users, MapPin, Trophy } from 'lucide-react';
import { mockAthletes, mockEvents, mockTrails, mockTurns } from './mock';
import type {Event, Trail, Athlete, Turn } from '@/pages/admin/mock';

export function Admin() {
  const [activeTab, setActiveTab] = useState<'events' | 'trails' | 'athletes'>('events');
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [trails, setTrails] = useState<Trail[]>(mockTrails);
  const [athletes, setAthletes] = useState<Athlete[]>(mockAthletes);
  const [turns, setTurns] = useState<Turn[]>(mockTurns);
  const [loading, setLoading] = useState(false);

  // Load initial data

  

  const tabConfig = [
    { id: 'events' as const, label: 'Events', icon: Trophy, count: events.length },
    { id: 'trails' as const, label: 'Trails', icon: MapPin, count: trails.length },
    { id: 'athletes' as const, label: 'Athletes', icon: Users, count: athletes.length }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage events, trails, athletes, and turns for your ski tracking system
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 sm:mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
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
                  <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'events' && (
            <EventsManager 
              events={events} 
              setEvents={setEvents} 
              loading={loading} 
            />
          )}
          {activeTab === 'trails' && (
            <TrailsManager 
              trails={trails} 
              setTrails={setTrails} 
              turns={turns}
              setTurns={setTurns}
              events={events} 
            />
          )}
          {activeTab === 'athletes' && (
            <AthletesManager 
              athletes={athletes} 
              setAthletes={setAthletes} 
              loading={loading} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Events Manager Component
function EventsManager({ events, setEvents, loading }: {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  loading: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({ name: ''});

 
  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    setFormData({ name: event.name});
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingEvent(null);
    setFormData({ name: '' });
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Events</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
              <DialogDescription>
                {editingEvent ? 'Update event details' : 'Add a new event to the system'}
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4">
              <div>
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingEvent ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{event.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {new Date(event.date).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(event)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {/* <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(event.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button> */}
                </div>
              </div>
            </CardHeader>
            {/* <CardContent>
              <p className="text-sm text-gray-600">
                <MapPin className="h-4 w-4 inline mr-1" />
                {event.location}
              </p>
            </CardContent> */}
          </Card>
        ))}
      </div>

      {events.length === 0 && !loading && (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first event</p>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>
      )}
    </div>
  );
}

// Trails Manager Component with integrated Turn Management
function TrailsManager({ trails, setTrails, turns, setTurns, events }: {
  trails: Trail[];
  setTrails: React.Dispatch<React.SetStateAction<Trail[]>>;
  turns: Turn[];
  setTurns: React.Dispatch<React.SetStateAction<Turn[]>>;
  events: Event[];
}) {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [isTrailDialogOpen, setIsTrailDialogOpen] = useState(false);
  const [isTurnDialogOpen, setIsTurnDialogOpen] = useState(false);
  const [editingTrail, setEditingTrail] = useState<Trail | null>(null);
  const [editingTurn, setEditingTurn] = useState<Turn | null>(null);
  const [selectedTrailId, setSelectedTrailId] = useState<number | null>(null);
  const [trailFormData, setTrailFormData] = useState({ name: '' });
  const [turnFormData, setTurnFormData] = useState({ name: '' });

  const filteredTrails = selectedEventId ? trails.filter(trail => trail.event_id === selectedEventId) : [];
  const selectedEvent = events.find(event => event.id === selectedEventId);

  const openTrailCreateDialog = () => {
    setEditingTrail(null);
    setTrailFormData({ name: '' });
    setIsTrailDialogOpen(true);
  };

  const openTrailEditDialog = (trail: Trail) => {
    setEditingTrail(trail);
    setTrailFormData({ name: trail.name });
    setIsTrailDialogOpen(true);
  };

  const openTurnCreateDialog = (trailId: number) => {
    setSelectedTrailId(trailId);
    setEditingTurn(null);
    setTurnFormData({ name: '' });
    setIsTurnDialogOpen(true);
  };

  const openTurnEditDialog = (turn: Turn) => {
    setEditingTurn(turn);
    setSelectedTrailId(turn.trail_id);
    setTurnFormData({ name: turn.name });
    setIsTurnDialogOpen(true);
  };

  const handleTrailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !trailFormData.name.trim()) return;

    if (editingTrail) {
      setTrails(prev => prev.map(trail => 
        trail.id === editingTrail.id 
          ? { ...trail, name: trailFormData.name }
          : trail
      ));
    } else {
      const newTrail: Trail = {
        id: Math.max(...trails.map(t => t.id), 0) + 1,
        name: trailFormData.name,
        event_id: selectedEventId
      };
      setTrails(prev => [...prev, newTrail]);
    }
    setIsTrailDialogOpen(false);
  };

  const handleTurnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrailId || !turnFormData.name.trim()) return;

    if (editingTurn) {
      setTurns(prev => prev.map(turn => 
        turn.id === editingTurn.id 
          ? { ...turn, name: turnFormData.name }
          : turn
      ));
    } else {
      const newTurn: Turn = {
        id: Math.max(...turns.map(t => t.id), 0) + 1,
        name: turnFormData.name,
        trail_id: selectedTrailId
      };
      setTurns(prev => [...prev, newTurn]);
    }
    setIsTurnDialogOpen(false);
  };

  const deleteTrail = (trailId: number) => {
    setTrails(prev => prev.filter(trail => trail.id !== trailId));
    setTurns(prev => prev.filter(turn => turn.trail_id !== trailId));
  };

  const deleteTurn = (turnId: number) => {
    setTurns(prev => prev.filter(turn => turn.id !== turnId));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Trails & Turns</h2>
      </div>

      {/* Event Selection */}
      <div className="mb-6">
        <Label htmlFor="event-select" className="text-sm font-medium text-gray-700 mb-2 block">
          Select Event to Manage Trails
        </Label>
        <select
          id="event-select"
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={selectedEventId || ''}
          onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Choose an event...</option>
          {events.map(event => (
            <option key={event.id} value={event.id}>{event.name}</option>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <>
          {/* Trails Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Trails for {selectedEvent?.name}
              </h3>
              <Dialog open={isTrailDialogOpen} onOpenChange={setIsTrailDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openTrailCreateDialog} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Trail
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle>{editingTrail ? 'Edit Trail' : 'Create Trail'}</DialogTitle>
                    <DialogDescription>
                      {editingTrail ? 'Update trail details' : `Add a new trail to ${selectedEvent?.name}`}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleTrailSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="trail-name">Trail Name</Label>
                      <Input
                        id="trail-name"
                        value={trailFormData.name}
                        onChange={(e) => setTrailFormData({ name: e.target.value })}
                        placeholder="Enter trail name"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        {editingTrail ? 'Update' : 'Create'} Trail
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsTrailDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrails.map((trail) => {
                const trailTurnsCount = turns.filter(turn => turn.trail_id === trail.id).length;
                return (
                  <Card key={trail.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{trail.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {trailTurnsCount} turn{trailTurnsCount !== 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openTrailEditDialog(trail)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTrail(trail.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mb-2"
                        onClick={() => openTurnCreateDialog(trail.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Turn
                      </Button>
                      
                      {/* Turns for this trail */}
                      <div className="space-y-1">
                        {turns.filter(turn => turn.trail_id === trail.id).map(turn => (
                          <div key={turn.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                            <span>{turn.name}</span>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => openTurnEditDialog(turn)}
                              >
                                <Edit className="h-2 w-2" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => deleteTurn(turn.id)}
                              >
                                <Trash2 className="h-2 w-2" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredTrails.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No trails yet</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first trail for {selectedEvent?.name}</p>
                <Button onClick={openTrailCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Trail
                </Button>
              </div>
            )}
          </div>

          {/* Turn Dialog */}
          <Dialog open={isTurnDialogOpen} onOpenChange={setIsTurnDialogOpen}>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>{editingTurn ? 'Edit Turn' : 'Create Turn'}</DialogTitle>
                <DialogDescription>
                  {editingTurn ? 'Update turn details' : 'Add a new turn to the selected trail'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleTurnSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="turn-name">Turn Name</Label>
                  <Input
                    id="turn-name"
                    value={turnFormData.name}
                    onChange={(e) => setTurnFormData({ name: e.target.value })}
                    placeholder="Enter turn name"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingTurn ? 'Update' : 'Create'} Turn
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsTurnDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}

      {!selectedEventId && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select an event to manage trails</h3>
          <p className="text-gray-600">Choose an event from the dropdown above to view and manage its trails and turns</p>
        </div>
      )}
    </div>
  );
}

// Athletes Manager Component
function AthletesManager({ athletes, setAthletes, loading }: {
  athletes: Athlete[];
  setAthletes: React.Dispatch<React.SetStateAction<Athlete[]>>;
  loading: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  const openEditDialog = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    setFormData({ name: athlete.name });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingAthlete(null);
    setFormData({ name: '' });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingAthlete) {
      setAthletes(prev => prev.map(athlete => 
        athlete.id === editingAthlete.id 
          ? { ...athlete, name: formData.name }
          : athlete
      ));
    } else {
      const newAthlete: Athlete = {
        id: Math.max(...athletes.map(a => a.id), 0) + 1,
        name: formData.name
      };
      setAthletes(prev => [...prev, newAthlete]);
    }
    setIsDialogOpen(false);
  };

  const deleteAthlete = (athleteId: number) => {
    setAthletes(prev => prev.filter(athlete => athlete.id !== athleteId));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Athletes</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Athlete
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>{editingAthlete ? 'Edit Athlete' : 'Create Athlete'}</DialogTitle>
              <DialogDescription>
                {editingAthlete ? 'Update athlete details' : 'Add a new athlete to the system'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="athlete-name">Athlete Name</Label>
                <Input
                  id="athlete-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="Enter athlete name"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingAthlete ? 'Update' : 'Create'} Athlete
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {athletes.map((athlete) => (
          <Card key={athlete.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{athlete.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(athlete)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteAthlete(athlete.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {athletes.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No athletes yet</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first athlete</p>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Athlete
          </Button>
        </div>
      )}
    </div>
  );
}