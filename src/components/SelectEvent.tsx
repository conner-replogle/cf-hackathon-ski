import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SelectEventProps {
  redirectUrl: string;
}

export function SelectEvent({ redirectUrl }: SelectEventProps) {
  const { events } = useEvents();
  const { data, isLoading } = events;
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selectedEventId) {
      navigate(`${redirectUrl}?event=${selectedEventId}`);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Select an Event</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          onValueChange={setSelectedEventId}
          disabled={isLoading || !data}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose an event..." />
          </SelectTrigger>
          <SelectContent>
            {isLoading && <SelectItem value="loading" disabled>Loading events...</SelectItem>}
            {data?.map((event) => (
              <SelectItem key={event.id} value={event.id.toString()}>
                {event.event_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleContinue}
          disabled={!selectedEventId}
          className="w-full"
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
