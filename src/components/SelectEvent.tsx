import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEvents } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Combobox from "./ui/combo-box";

interface SelectEventProps {
  redirectUrl: string;
}

export function SelectEvent({ redirectUrl }: SelectEventProps) {
  const [searchParams] = useSearchParams();
  const { data:events } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<number>();
  const navigate = useNavigate();

  useEffect(() => {
    const eventId = searchParams.get("event");
    if (eventId) {
      setSelectedEventId(parseInt(eventId));
    }
  }, [searchParams]);

  const handleContinue = () => {
    if (selectedEventId) {
      navigate(`${redirectUrl}?event=${selectedEventId}`);
    }
  };

  const eventsData = useMemo(
    () =>
      events
        ? events.map((event) => ({
            label: event.eventName,
            value: event.id,
          }))
        : [],
    [events],
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Select an Event</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Combobox
          isInForm={false}
          itemLabel="event"
          data={eventsData}
          value={selectedEventId as number}
          onSelect={(val) => setSelectedEventId(val as number)}
        />
        <Button
          onClick={handleContinue}
          disabled={!selectedEventId}
          className="w-full"
          size="lg"
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
