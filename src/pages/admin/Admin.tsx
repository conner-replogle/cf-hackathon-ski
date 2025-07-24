import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEvents, useAthletes, useRoutes, useCreateEventAthletes, useCreateEventRoute } from '@/services/api'
import { toast } from 'sonner'

type TabType = 'events' | 'athletes' | 'routes' | 'turns'

interface CreateTurnData {
  turn_name: string
  latitude: number
  longitude: number
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<TabType>('events')
  const [eventForm, setEventForm] = useState({ event_name: '', event_location: '' })
  const [athletesForm, setAthletesForm] = useState({ athletes: '' })
  const [routeForm, setRouteForm] = useState({ route_name: '', turns: [] as CreateTurnData[] })
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [newTurn, setNewTurn] = useState<CreateTurnData>({ turn_name: '', latitude: 0, longitude: 0 })

  const { events, createEvent } = useEvents()
  const { athletes } = useAthletes()
  const { routes } = useRoutes()
  const { createEventAthletes } = useCreateEventAthletes(selectedEventId)
  const { createEventRoute } = useCreateEventRoute(selectedEventId)

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventForm.event_name || !eventForm.event_location) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      await createEvent.mutateAsync(eventForm)
      setEventForm({ event_name: '', event_location: '' })
      toast.success('Event created successfully!')
    } catch (error) {
      toast.error('Failed to create event')
    }
  }

  const handleCreateAthletes = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEventId || !athletesForm.athletes.trim()) {
      toast.error('Please select an event and enter athlete names')
      return
    }

    const athletesList = athletesForm.athletes.split('\n').filter(name => name.trim()).map(name => name.trim())
    
    try {
      await createEventAthletes.mutateAsync(athletesList)
      setAthletesForm({ athletes: '' })
      toast.success('Athletes created successfully!')
    } catch (error) {
      toast.error('Failed to create athletes')
    }
  }

  const handleAddTurn = () => {
    if (!newTurn.turn_name || newTurn.latitude === 0 || newTurn.longitude === 0) {
      toast.error('Please fill in all turn fields')
      return
    }
    
    setRouteForm(prev => ({
      ...prev,
      turns: [...prev.turns, { ...newTurn }]
    }))
    setNewTurn({ turn_name: '', latitude: 0, longitude: 0 })
  }

  const handleRemoveTurn = (index: number) => {
    setRouteForm(prev => ({
      ...prev,
      turns: prev.turns.filter((_, i) => i !== index)
    }))
  }

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEventId || !routeForm.route_name || routeForm.turns.length === 0) {
      toast.error('Please select an event, enter a route name, and add at least one turn')
      return
    }

    try {
      await createEventRoute.mutateAsync(routeForm)
      setRouteForm({ route_name: '', turns: [] })
      toast.success('Route and turns created successfully!')
    } catch (error) {
      toast.error('Failed to create route')
    }
  }

  const tabs = [
    { id: 'events' as TabType, label: 'Events' },
    { id: 'athletes' as TabType, label: 'Athletes' },
    { id: 'routes' as TabType, label: 'Routes & Turns' },
  ]

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage events, athletes, routes, and turns</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-background text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Forms */}
        <div>
          {activeTab === 'events' && (
            <Card>
              <CardHeader>
                <CardTitle>Create Event</CardTitle>
                <CardDescription>Add a new skiing event</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Event Name</label>
                    <Input
                      value={eventForm.event_name}
                      onChange={(e) => setEventForm(prev => ({ ...prev, event_name: e.target.value }))}
                      placeholder="e.g., Winter Championships 2025"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Event Location</label>
                    <Input
                      value={eventForm.event_location}
                      onChange={(e) => setEventForm(prev => ({ ...prev, event_location: e.target.value }))}
                      placeholder="e.g., Aspen, Colorado"
                    />
                  </div>
                  <Button type="submit" disabled={createEvent.isPending}>
                    {createEvent.isPending ? 'Creating...' : 'Create Event'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'athletes' && (
            <Card>
              <CardHeader>
                <CardTitle>Add Athletes</CardTitle>
                <CardDescription>Add athletes to an existing event</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAthletes} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select Event</label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Select an event...</option>
                      {events.data?.map((event) => (
                        <option key={event.id} value={event.id.toString()}>
                          {event.event_name} - {event.event_location}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Athletes (one per line)</label>
                    <textarea
                      value={athletesForm.athletes}
                      onChange={(e) => setAthletesForm(prev => ({ ...prev, athletes: e.target.value }))}
                      placeholder="John Doe&#10;Jane Smith&#10;Mike Johnson"
                      className="w-full p-2 border rounded-md h-32 resize-none"
                    />
                  </div>
                  <Button type="submit" disabled={createEventAthletes.isPending || !selectedEventId}>
                    {createEventAthletes.isPending ? 'Adding...' : 'Add Athletes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'routes' && (
            <Card>
              <CardHeader>
                <CardTitle>Create Route with Turns</CardTitle>
                <CardDescription>Add a new route and its turns to an event</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateRoute} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select Event</label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Select an event...</option>
                      {events.data?.map((event) => (
                        <option key={event.id} value={event.id.toString()}>
                          {event.event_name} - {event.event_location}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Route Name</label>
                    <Input
                      value={routeForm.route_name}
                      onChange={(e) => setRouteForm(prev => ({ ...prev, route_name: e.target.value }))}
                      placeholder="e.g., Slalom Course A"
                    />
                  </div>

                  {/* Add Turn Section */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Add Turns</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                      <Input
                        value={newTurn.turn_name}
                        onChange={(e) => setNewTurn(prev => ({ ...prev, turn_name: e.target.value }))}
                        placeholder="Turn name"
                      />
                      <Input
                        type="number"
                        step="any"
                        value={newTurn.latitude || ''}
                        onChange={(e) => setNewTurn(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                        placeholder="Latitude"
                      />
                      <Input
                        type="number"
                        step="any"
                        value={newTurn.longitude || ''}
                        onChange={(e) => setNewTurn(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                        placeholder="Longitude"
                      />
                    </div>
                    <Button type="button" onClick={handleAddTurn} variant="outline" size="sm">
                      Add Turn
                    </Button>
                  </div>

                  {/* Current Turns List */}
                  {routeForm.turns.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Current Turns ({routeForm.turns.length})</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {routeForm.turns.map((turn, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm">
                              {index + 1}. {turn.turn_name} ({turn.latitude}, {turn.longitude})
                            </span>
                            <Button
                              type="button"
                              onClick={() => handleRemoveTurn(index)}
                              variant="outline"
                              size="sm"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={createEventRoute.isPending || !selectedEventId || !routeForm.route_name || routeForm.turns.length === 0}
                  >
                    {createEventRoute.isPending ? 'Creating...' : 'Create Route & Turns'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Data Display */}
        <div>
          {activeTab === 'events' && (
            <Card>
              <CardHeader>
                <CardTitle>Existing Events</CardTitle>
                <CardDescription>All events in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {events.isLoading ? (
                  <p>Loading events...</p>
                ) : events.data && events.data.length > 0 ? (
                  <div className="space-y-2">
                    {events.data.map((event) => (
                      <div key={event.id} className="p-3 border rounded">
                        <h4 className="font-medium">{event.event_name}</h4>
                        <p className="text-sm text-muted-foreground">{event.event_location}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No events found</p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'athletes' && (
            <Card>
              <CardHeader>
                <CardTitle>Existing Athletes</CardTitle>
                <CardDescription>All athletes in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {athletes.isLoading ? (
                  <p>Loading athletes...</p>
                ) : athletes.data && athletes.data.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {athletes.data.map((athlete: any) => (
                      <div key={athlete.id} className="p-3 border rounded">
                        <h4 className="font-medium">{athlete.athlete_name}</h4>
                        <p className="text-sm text-muted-foreground">Event ID: {athlete.event_id}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No athletes found</p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'routes' && (
            <Card>
              <CardHeader>
                <CardTitle>Existing Routes</CardTitle>
                <CardDescription>All routes in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {routes.isLoading ? (
                  <p>Loading routes...</p>
                ) : routes.data && routes.data.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {routes.data.map((route: any) => (
                      <div key={route.id} className="p-3 border rounded">
                        <h4 className="font-medium">{route.route_name}</h4>
                        <p className="text-sm text-muted-foreground">Event ID: {route.event_id}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No routes found</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}