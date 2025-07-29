import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAthletes, useCreateAthlete } from '@/services/api';
import type { Athlete } from 'worker/types';
import { PlusCircle, User } from 'lucide-react';

export function AthletesManager() {
  const { data:athletes } = useAthletes();

  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Athletes</h2>
      <div className="mt-2 mb-8">
      <CreateAthleteDialog />
      </div>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {athletes?.map((athlete: Athlete) => (
          <Card
            key={athlete.id}
            className="group hover:shadow-md transition-shadow border border-muted"
          >
            <CardHeader className="flex flex-col items-start space-y-2">
              <User className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold truncate w-full">
                {athlete.athleteName}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      {athletes && athletes.length === 0 && <p className="text-gray-500">No athletes found. Create one to get started.</p>}
    </section>
  );
}

function CreateAthleteDialog() {
  const [open, setOpen] = useState(false);
  const [athleteName, setAthleteName] = useState('');
  const { mutateAsync: createAthlete ,isPending} = useCreateAthlete();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteName.trim()) return;
    await createAthlete({ athleteName });
    setAthleteName('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Athlete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Athlete</DialogTitle>
          <DialogDescription>
            Add a new athlete and assign them to an event.
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
                value={athleteName}
                onChange={(e) => setAthleteName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Mikaela Shiffrin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
