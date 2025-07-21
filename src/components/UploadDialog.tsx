import { useState, useEffect } from "react";
import { FilePond } from "react-filepond";
import "filepond/dist/filepond.min.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Athlete {
  athlete_id: number;
  athlete_name: string;
}

interface Event {
  event_id: number;
  event_name: string;
}

interface Run {
  run_id: number;
  run_name: string;
  event_id: number;
  athlete_id: number;
}

interface Turn {
  turn_id: number;
  turn_name: string;
  event_id: number;
  athlete_id: number;
  run_id: number;
}

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

export default function UploadDialog({ open, onOpenChange, onUploadSuccess }: UploadDialogProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<number | null>(null);
  const [newAthleteName, setNewAthleteName] = useState("");
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRun, setSelectedRun] = useState<number | null>(null);
  const [newRunName, setNewRunName] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [selectedTurn, setSelectedTurn] = useState<number | null>(null);
  const [newTurnName, setNewTurnName] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => {
    if (!open) return;
    // Fetch events
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => data.success && setEvents(data.events));
    // Fetch athletes
    fetch("/api/athletes")
      .then((res) => res.json())
      .then((data) => data.success && setAthletes(data.athletes));
  }, [open]);

  useEffect(() => {
    if (selectedEvent) {
      fetch(`/api/events/${selectedEvent}/runs`)
        .then((res) => res.json())
        .then((data) => data.success && setRuns(data.runs));
    } else {
      setRuns([]);
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedRun) {
      fetch(`/api/runs/${selectedRun}/turns`)
        .then((res) => res.json())
        .then((data) => data.success && setTurns(data.turns));
    }
  }, [selectedRun]);

  const handleCreateAthlete = async () => {
    if (newAthleteName.trim() !== "") {
      const response = await fetch("/api/athletes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athlete_name: newAthleteName }),
      });
      const data = await response.json();
      if (data.success) {
        setAthletes(data.athletes);
        const created = data.athletes.find((a: Athlete) => a.athlete_name === newAthleteName);
        if (created) setSelectedAthlete(created.athlete_id);
        setNewAthleteName("");
      } else {
        setUploadStatus("Failed to create athlete.");
      }
    }
  };

  const handleCreateRun = async () => {
    if (newRunName.trim() !== "" && selectedAthlete && selectedEvent) {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run_name: newRunName, event_id: selectedEvent, athlete_id: selectedAthlete }),
      });
      const data = await response.json();
      if (data.success) {
        setRuns(data.runs);
        const created = data.runs.find((r: Run) => r.run_name === newRunName);
        if (created) setSelectedRun(created.run_id);
        setNewRunName("");
      } else {
        setUploadStatus("Failed to create run.");
      }
    }
  };

  const handleCreateTurn = async () => {
    if (newTurnName.trim() !== "" && selectedRun && selectedAthlete && selectedEvent) {
      const response = await fetch("/api/turns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turn_name: newTurnName, event_id: selectedEvent, athlete_id: selectedAthlete, run_id: selectedRun }),
      });
      const data = await response.json();
      if (data.success) {
        setTurns(data.turns);
        const created = data.turns.find((t: Turn) => t.turn_name === newTurnName);
        if (created) setSelectedTurn(created.turn_id);
        setNewTurnName("");
      } else {
        setUploadStatus("Failed to create turn.");
      }
    }
  };

  const handleUploadVideos = async () => {
    if (files.length === 0 || !selectedTurn) {
      setUploadStatus("Please select a turn and add files.");
      return;
    }
    for (const fileItem of files) {
      const file = fileItem.file;
      const formData = new FormData();
      formData.append("video", file);
      const response = await fetch(`/api/turns/${selectedTurn}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setUploadStatus(`Video "${file.name}" uploaded successfully!`);
      } else {
        setUploadStatus(`Upload of "${file.name}" failed: ${data.message}`);
      }
    }
    setUploadStatus("All videos processed.");
    setFiles([]);
    if (onUploadSuccess) onUploadSuccess();
    setTimeout(() => {
      setUploadStatus("");
      onOpenChange(false);
    }, 1500);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Video</DialogTitle>
          <DialogDescription>
            Select an athlete, run, and turn, then upload your video files.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Event Selection */}
          <div>
            <label className="block font-semibold mb-1">Event</label>
            <Select value={selectedEvent ? String(selectedEvent) : ""} onValueChange={val => setSelectedEvent(Number(val))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(e => (
                  <SelectItem key={e.event_id} value={String(e.event_id)}>{e.event_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Athlete Selection/Creation */}
          <div>
            <label className="block font-semibold mb-1">Athlete</label>
            <Select value={selectedAthlete ? String(selectedAthlete) : ""} onValueChange={val => setSelectedAthlete(Number(val))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose athlete" />
              </SelectTrigger>
              <SelectContent>
                {athletes.map(a => (
                  <SelectItem key={a.athlete_id} value={String(a.athlete_id)}>{a.athlete_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex mt-2 gap-2">
              <Input value={newAthleteName} onChange={e => setNewAthleteName(e.target.value)} placeholder="New athlete name" />
              <Button onClick={handleCreateAthlete} disabled={!newAthleteName.trim()}>Add</Button>
            </div>
          </div>
          {/* Run Selection/Creation */}
          <div>
            <label className="block font-semibold mb-1">Run</label>
            <Select value={selectedRun ? String(selectedRun) : ""} onValueChange={val => setSelectedRun(Number(val))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose run" />
              </SelectTrigger>
              <SelectContent>
                {runs.map(r => (
                  <SelectItem key={r.run_id} value={String(r.run_id)}>{r.run_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex mt-2 gap-2">
              <Input value={newRunName} onChange={e => setNewRunName(e.target.value)} placeholder="New run name" />
              <Button onClick={handleCreateRun} disabled={!newRunName.trim() || !selectedAthlete || !selectedEvent}>Add</Button>
            </div>
          </div>
          {/* Turn Selection/Creation */}
          <div>
            <label className="block font-semibold mb-1">Turn</label>
            <Select value={selectedTurn ? String(selectedTurn) : ""} onValueChange={val => setSelectedTurn(Number(val))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose turn" />
              </SelectTrigger>
              <SelectContent>
                {turns.map(t => (
                  <SelectItem key={t.turn_id} value={String(t.turn_id)}>{t.turn_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex mt-2 gap-2">
              <Input value={newTurnName} onChange={e => setNewTurnName(e.target.value)} placeholder="New turn name" />
              <Button onClick={handleCreateTurn} disabled={!newTurnName.trim() || !selectedRun || !selectedAthlete || !selectedEvent}>Add</Button>
            </div>
          </div>
          {/* File Upload */}
          <div>
            <label className="block font-semibold mb-1">Videos</label>
            <FilePond
              files={files}
              onupdatefiles={setFiles}
              allowMultiple={true}
              maxFiles={10}
              name="videos"
              server={{
                process: (_fieldName, file, _metadata, load, _error, _progress, _abort) => {
                  load(file.name);
                }
              }}
              labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
            />
          </div>
        </div>
        <DialogFooter>
          <div className="w-full text-center">
            <Button onClick={handleUploadVideos} disabled={!selectedTurn || files.length === 0}>Upload Videos</Button>
            {uploadStatus && <p className="text-sm text-gray-600 mt-2">{uploadStatus}</p>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
