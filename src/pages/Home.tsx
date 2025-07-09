import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


// Hardcoded event data based on the provided schema
const initialEvents = [
  { event_id: 1, event_name: "Slalom World Cup" },
  { event_id: 2, event_name: "Freestyle Nationals" },
  { event_id: 3, event_name: "Big Air Invitational" },
];

export default function Home() {
  const [events, setEvents] = useState<{
    event_id: number;
    event_name: string;
  }[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [newEventName, setNewEventName] = useState("");
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        const data = await response.json();
        if (data.success) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, []);

  const handleCreateEvent = async () => {
    if (newEventName.trim() !== "") {
      try {
        const response = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event_name: newEventName }),
        });
        const data = await response.json();
        if (data.success) {
          // Re-fetch events to get the newly created event with its ID
          const updatedResponse = await fetch("/api/events");
          const updatedData = await updatedResponse.json();
          if (updatedData.success) {
            setEvents(updatedData.events);
            // Find the newly created event and select it
            const createdEvent = updatedData.events.find(
              (event: { event_name: string }) => event.event_name === newEventName,
            );
            if (createdEvent) {
              setSelectedEvent(createdEvent.event_id);
            }
          }
          setNewEventName("");
          setIsCreatingEvent(false);
        } else {
          console.error("Error creating event:", data.message);
          alert(`Error creating event: ${data.message}`);
        }
      } catch (error) {
        console.error("Error creating event:", error);
        alert("An error occurred while creating the event.");
      }
    }
  };

  const getSelectedEventName = () => {
    const event = events.find((e) => e.event_id === selectedEvent);
    return event ? event.event_name : "";
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-bold mb-4">
          Welcome to Ski Video Manager
        </h2>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Select or create an event to get started.
        </p>
      </div>

      {!selectedEvent ? (
        <div className="flex flex-col items-center space-y-4">
          <h3>Select an Event</h3>
          <Select
            onValueChange={(value) => setSelectedEvent(parseInt(value, 10))}
            value={selectedEvent ? String(selectedEvent) : ""}
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
              <Button onClick={handleCreateEvent}>Save Event</Button>
              <Button
                onClick={() => setIsCreatingEvent(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <h3>Event: {getSelectedEventName()}</h3>
          <div className="flex space-x-4">
            <Link to={`/${selectedEvent}/upload`}>
              <Button>Upload Videos</Button>
            </Link>
            <Link to={`/${selectedEvent}/watch`}>
              <Button>Watch Videos</Button>
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
