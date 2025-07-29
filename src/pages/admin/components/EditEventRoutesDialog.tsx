import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, X } from "lucide-react";
import { useCreateRoute, useRoutes } from "@/services/api";
import type { Event, Turn } from "worker/types";

interface EditEventRoutesDialogProps {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEventRoutesDialog({
  event,
  open,
  onOpenChange,
}: EditEventRoutesDialogProps) {
  const { data: eventRoutes, refetch: refetchEventRoutes } = useRoutes(
    event.id
  );
  const { mutateAsync: createEventRoute, isPending: isCreatingRoute } =
    useCreateRoute();

  const [newRouteName, setNewRouteName] = useState("");
  const [newRouteTurns, setNewRouteTurns] = useState<
    Omit<Turn, "id" | "routeId">[]
  >([]);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setNewRouteName("");
      setNewRouteTurns([]);
    }
  }, [open]);

  const handleAddTurnToNewRoute = () => {
    const nextIndex = newRouteTurns.length;
    const nextLetter = indexToLetter(newRouteTurns.length);
    setNewRouteTurns([
      ...newRouteTurns,
      { turnName: nextLetter, turnOrder: nextIndex + 1 },
    ]);

    function indexToLetter(n: number): string {
      let result = '';
      while (n >= 0) {
        result = String.fromCharCode((n % 26) + 65) + result;
        n = Math.floor(n / 26) - 1;
      }
      return result;
    }
  };
  

  const handleRemoveTurnFromNewRoute = (index: number) => {
    const updatedTurns = newRouteTurns.filter((_, i) => i !== index);
    setNewRouteTurns(
      updatedTurns.map((turn, idx) => ({ ...turn, turnOrder: idx + 1 }))
    );
  };

  const handleNewRouteTurnChange = (
    index: number,
    field: keyof Omit<Turn, "id" | "routeId">,
    value: string | number
  ) => {
    const updatedTurns = [...newRouteTurns];
    // @ts-ignore
    updatedTurns[index][field] = value;
    setNewRouteTurns(updatedTurns);
  };

  const handleCreateRoute = async () => {
    if (!newRouteName.trim() || newRouteTurns.some((t) => !t.turnName.trim()))
      return;
    await createEventRoute({
      eventId: event.id,
      name: newRouteName,
      turns: newRouteTurns.map((turn, index) => ({
        ...turn,
        turnOrder: index + 1,
      })),
    });
    setNewRouteName("");
    setNewRouteTurns([]);
    refetchEventRoutes();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Route for {event.eventName}</DialogTitle>
          <DialogDescription>
            Add new routes and their associated turns for this event.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          {/* Existing Routes */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Existing Routes</h3>
            {eventRoutes && eventRoutes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {eventRoutes.map((route) => {
                  const routeTurns = route.turns || [];

                  return (
                    <div
                      key={route.id}
                      className="rounded-2xl border bg-white p-4 shadow-sm"
                    >
                      <h4 className="text-md font-medium">{route.routeName}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {routeTurns.length}{" "}
                        {routeTurns.length === 1 ? "Turn" : "Turns"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {routeTurns.slice(0, 5).map((t: Turn) => (
                          <span
                            key={t.id}
                            className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md truncate max-w-[100px]"
                            title={t.turnName}
                          >
                            {t.turnName}
                          </span>
                        ))}
                        {routeTurns.length > 5 && (
                          <span className="text-xs text-muted-foreground">
                            +{routeTurns.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">
                No routes defined for this event yet.
              </p>
            )}
          </div>

          {/* Add New Route */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-3">New Route Details</h3>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-route-name" className="text-right">
                  Route Name
                </Label>
                <Input
                  id="new-route-name"
                  value={newRouteName}
                  onChange={(e) => setNewRouteName(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., Slalom Course"
                />
              </div>
              <Label className="mb-2 block">Turns</Label>
              <div className="space-y-2">
                {newRouteTurns.map((turn, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={turn.turnName}
                      onChange={(e) =>
                        handleNewRouteTurnChange(
                          index,
                          "turnName",
                          e.target.value
                        )
                      }
                      placeholder={`Turn ${index + 1} Name`}
                      className="flex-grow"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTurnFromNewRoute(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTurnToNewRoute}
                className="mt-2"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Turn
              </Button>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateRoute}
                disabled={
                  isCreatingRoute ||
                  !newRouteName.trim() ||
                  newRouteTurns.length === 0 ||
                  newRouteTurns.some((t) => !t.turnName.trim())
                }
              >
                {isCreatingRoute ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
