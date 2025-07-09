import { useState, useEffect, useRef } from "react";
import { FilePond } from "react-filepond";
import "filepond/dist/filepond.min.css";
import { useParams, useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { cn } from "../lib/utils";
import { Button } from "@/components/ui/button";

// Import Leaflet and its CSS
import L, { Map } from "leaflet";
import "leaflet/dist/leaflet.css";

// Import GeoJSON types for type safety
import { FeatureCollection } from "geojson";

interface Athlete {
  athlete_id: number;
  athlete_name: string;
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

// --- Data ---
export const geojsonFeature: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Turn 1",
      },
      geometry: {
        type: "Point",
        coordinates: [-106.39248, 39.62495],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Turn 2",
      },
      geometry: {
        type: "Point",
        coordinates: [-106.39139, 39.63012],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Turn 3 (Hairpin)",
      },
      geometry: {
        type: "Point",
        coordinates: [-106.39493, 39.63287],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Turn 4",
      },
      geometry: {
        type: "Point",
        coordinates: [-106.38918, 39.63663],
      },
    },
  ],
};

interface LeafletMapProps {
  turns: Turn[];
  onSelectTurn: (turnId: number) => void;
  selectedTurn: number | null;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  turns,
  onSelectTurn,
  selectedTurn,
}) => {
  const mapRef = useRef<Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Define custom icons
  const defaultIcon = L.icon({
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const selectedIcon = L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconRetinaUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
    }

    if (mapRef.current) {
      const map = mapRef.current;
      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      const markers: L.Marker[] = [];
      turns.slice(0, 4).forEach((turn, index) => {
        const feature = geojsonFeature.features[index];
        if (feature && feature.geometry.type === "Point") {
          const coordinates = (feature.geometry as any).coordinates;
          const marker = L.marker([coordinates[1], coordinates[0]], {
            icon: turn.turn_id === selectedTurn ? selectedIcon : defaultIcon,
          }).addTo(map);
          markers.push(marker);

          const popupContent = `
            <div>
              <h3>${turn.turn_name}</h3>
              <button id="select-turn-${turn.turn_id}" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm mt-2">
                Select Turn
              </button>
            </div>
          `;
          marker.bindPopup(popupContent);

          marker.on("popupopen", () => {
            document
              .getElementById(`select-turn-${turn.turn_id}`)
              ?.addEventListener("click", () => {
                onSelectTurn(turn.turn_id);
                marker.closePopup();
              });
          });
        }
      });

      if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds());
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [turns, onSelectTurn, selectedTurn]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height: "500px", width: "100%", borderRadius: "0.5rem" }}
    />
  );
};

export default function Upload() {
  const { eventId } = useParams<{ eventId: string }>();
  const currentEventId = eventId ? parseInt(eventId, 10) : null;

  console.log(currentEventId);

  const navigate = useNavigate();

  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<number | null>(null);
  const [newAthleteName, setNewAthleteName] = useState<string>("");
  console.log(athletes);

  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRun, setSelectedRun] = useState<number | null>(null);
  const [newRunName, setNewRunName] = useState<string>("");

  const [turns, setTurns] = useState<Turn[]>([]);
  const [selectedTurn, setSelectedTurn] = useState<number | null>(null);
  const [selectedTurnName, setSelectedTurnName] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);

  const filteredRuns = selectedAthlete
    ? runs.filter(
        (run) =>
          run.athlete_id === selectedAthlete && run.event_id === currentEventId,
      )
    : [];

  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const response = await fetch("/api/athletes");
        const data = await response.json();
        if (data.success) {
          setAthletes(data.athletes);
        }
      } catch (error) {
        console.error("Error fetching athletes:", error);
      }
    };
    fetchAthletes();
  }, []);

  useEffect(() => {
    // Reset run and turn selection when athlete or event changes
    setSelectedRun(null);
    setSelectedTurn(null);
    setSelectedTurnName(null);
    setNewRunName("");

    const fetchRuns = async () => {
      if (selectedAthlete && currentEventId) {
        try {
          const response = await fetch(
            `/api/events/${currentEventId}/runs?athlete_id=${selectedAthlete}`,
          );
          const data = await response.json();
          if (data.success) {
            setRuns(data.runs);
          }
        } catch (error) {
          console.error("Error fetching runs:", error);
        }
      }
    };
    fetchRuns();
  }, [selectedAthlete, currentEventId]);

  useEffect(() => {
    setSelectedTurn(null);
    setSelectedTurnName(null);
    const fetchTurns = async () => {
      if (selectedRun && turns.length === 0) {
        // Only fetch if turns are not already populated
        try {
          const response = await fetch(`/api/runs/${selectedRun}/turns`);
          const data = await response.json();
          if (data.success) {
            setTurns(data.turns);
          }
        } catch (error) {
          console.error("Error fetching turns:", error);
        }
      }
    };
    fetchTurns();
  }, [selectedRun, turns.length]);

  useEffect(() => {
    if (selectedTurn) {
      const turn = turns.find((t) => t.turn_id === selectedTurn);
      if (turn) {
        setSelectedTurnName(turn.turn_name);
      }
    } else {
      setSelectedTurnName(null);
    }
  }, [selectedTurn, turns]);

  const handleCreateAthlete = async (): Promise<number | null> => {
    if (newAthleteName.trim() !== "") {
      try {
        const response = await fetch("/api/athletes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ athlete_name: newAthleteName }),
        });
        const data = await response.json();
        if (data.success) {
          const updatedResponse = await fetch("/api/athletes");
          const updatedData = await updatedResponse.json();
          if (updatedData.success) {
            setAthletes(updatedData.athletes);
            const createdAthlete = updatedData.athletes.find(
              (athlete: { athlete_name: string }) =>
                athlete.athlete_name === newAthleteName,
            );
            if (createdAthlete) {
              setSelectedAthlete(createdAthlete.athlete_id);
              setNewAthleteName("");
              return createdAthlete.athlete_id;
            }
          }
        } else {
          console.error("Error creating athlete:", data.message);
          alert(`Error creating athlete: ${data.message}`);
        }
      } catch (error) {
        console.error("Error creating athlete:", error);
        alert("An error occurred while creating the athlete.");
      }
    }
    return null;
  };

  const handleCreateRun = async (athleteId: number): Promise<number | null> => {
    if (newRunName.trim() !== "" && athleteId && currentEventId) {
      try {
        const response = await fetch("/api/runs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            run_name: newRunName,
            event_id: currentEventId,
            athlete_id: athleteId,
          }),
        });
        const data = await response.json();
        if (data.success) {
          const updatedResponse = await fetch(
            `/api/events/${currentEventId}/runs?athlete_id=${athleteId}`,
          );
          const updatedData = await updatedResponse.json();
          if (updatedData.success) {
            setRuns(updatedData.runs);
            const createdRun = updatedData.runs.find(
              (run: { run_name: string }) => run.run_name === newRunName,
            );
            if (createdRun) {
              setSelectedRun(createdRun.run_id);
              setNewRunName("");
              return createdRun.run_id;
            }
          }
        } else {
          console.error("Error creating run:", data.message);
          alert(`Error creating run: ${data.message}`);
        }
      } catch (error) {
        console.error("Error creating run:", error);
        alert("An error occurred while creating the run.");
      }
    }
    return null;
  };

  const handleUploadVideos = async (turnId: number) => {
    if (files.length === 0) {
      setUploadStatus("No video files selected for upload.");
      setTimeout(() => setUploadStatus(""), 3000);
      return;
    }

    for (const fileItem of files) {
      const file = fileItem.file;
      const formData = new FormData();
      formData.append("video", file);

      try {
        const response = await fetch(`/api/turns/${turnId}/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (data.success) {
          setUploadStatus(`Video "${file.name}" uploaded successfully!`);
        } else {
          setUploadStatus(`Upload of "${file.name}" failed: ${data.message}`);
        }
      } catch (err) {
        console.error(`Error uploading video "${file.name}":`, err);
        setUploadStatus(`An error occurred during upload of "${file.name}".`);
      }
    }
    setUploadStatus("All videos processed. Redirecting...");
    setTimeout(() => {
      navigate(`/${currentEventId}/watch`);
    }, 1500);
  };

  const handleSubmitMetadata = async () => {
    let currentAthleteId = selectedAthlete;
    let currentRunId = selectedRun;
    let currentTurnId = selectedTurn;

    // 1. Create Athlete if newAthleteName is provided
    if (!selectedAthlete && newAthleteName.trim() !== "") {
      const newId = await handleCreateAthlete();
      if (newId) {
        currentAthleteId = newId;
      } else {
        setUploadStatus("Failed to create athlete.");
        setTimeout(() => setUploadStatus(""), 3000);
        return;
      }
    }

    // 2. Create Run if newRunName is provided
    if (!selectedRun && newRunName.trim() !== "") {
      if (!currentAthleteId) {
        setUploadStatus("Please select or create an athlete first.");
        setTimeout(() => setUploadStatus(""), 3000);
        return;
      }
      const newId = await handleCreateRun(currentAthleteId);
      if (newId) {
        currentRunId = newId;
      } else {
        setUploadStatus("Failed to create run.");
        setTimeout(() => setUploadStatus(""), 3000);
        return;
      }
    }

    // 3. If a new run was created, turns are already set by handleCreateRun.
    // If an existing run was selected, turns should have been fetched by the useEffect.
    // Ensure currentTurnId is set if turns exist and no specific turn is selected yet.
    if (!selectedTurn && turns.length > 0) {
      currentTurnId = turns[0].turn_id; // Automatically select the first turn
      setSelectedTurn(currentTurnId);
    }

    // If all metadata is set, inform the user that they can now upload their video.
    if (currentAthleteId && currentRunId && currentTurnId) {
      setUploadStatus("Metadata saved. Uploading videos...");
      await handleUploadVideos(currentTurnId);
    } else {
      setUploadStatus("Please complete all selections/creations.");
      setTimeout(() => setUploadStatus(""), 3000);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h2 className="text-2xl font-bold mb-2 text-white">
        Upload Videos for Event: {currentEventId}
      </h2>
      <p className="mb-8 text-white">Select details for your video upload.</p>

      <div className="space-y-8">
        {/* File Upload Component */}
        <Card className="">
          <CardHeader>
            <CardTitle className="text-white">Video File</CardTitle>
          </CardHeader>
          <CardContent>
            <FilePond
              name="video"
              labelIdle='Drag & Drop your video files or <span class="filepond--label-action">Browse</span>'
              acceptedFileTypes={["video/*"]}
              onupdatefiles={setFiles}
              allowMultiple={true}
              maxFiles={10}
            />

            {uploadStatus && (
              <div
                className={cn(
                  "mt-4 p-3 rounded-md font-medium text-center",
                  uploadStatus.includes("successfully")
                    ? "bg-green-800 text-green-200 border border-green-700"
                    : "bg-red-800 text-red-200 border border-red-700",
                )}
              >
                {uploadStatus}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Athlete Selection */}
        <Card className="">
          <CardHeader>
            <CardTitle className="text-white">Athlete</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              onValueChange={(value) => {
                if (value === "new") {
                  setSelectedAthlete(null);
                  setNewAthleteName("");
                } else {
                  setSelectedAthlete(parseInt(value, 10));
                  setNewAthleteName("");
                }
              }}
              value={selectedAthlete ? String(selectedAthlete) : "new"}
            >
              <SelectTrigger className="w-full md:w-[280px]">
                <SelectValue placeholder="Select an athlete" />
              </SelectTrigger>
              <SelectContent>
                {athletes.map((athlete) => (
                  <SelectItem
                    key={athlete.athlete_id}
                    value={String(athlete.athlete_id)}
                  >
                    {athlete.athlete_name}
                  </SelectItem>
                ))}
                <SelectItem value="new">Create New Athlete</SelectItem>
              </SelectContent>
            </Select>
            {!selectedAthlete && (
              <div className="flex w-full md:w-[280px] items-center space-x-2 mt-2">
                <Input
                  type="text"
                  placeholder="New Athlete Name"
                  value={newAthleteName}
                  onChange={(e) => setNewAthleteName(e.target.value)}
                  className="flex-grow"
                />
                <Button onClick={handleCreateAthlete}>Create</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Run Name Selection */}
        <Card className="">
          <CardHeader>
            <CardTitle className="text-white">Run Name</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              onValueChange={(value) => {
                if (value === "new") {
                  setSelectedRun(null);
                  setNewRunName("");
                } else {
                  setSelectedRun(parseInt(value, 10));
                  setNewRunName("");
                }
              }}
              value={selectedRun ? String(selectedRun) : "new"}
              disabled={!selectedAthlete && !newAthleteName}
            >
              <SelectTrigger className="w-full md:w-[280px]">
                <SelectValue placeholder="Select a run" />
              </SelectTrigger>
              <SelectContent>
                {filteredRuns.map((run) => (
                  <SelectItem key={run.run_id} value={String(run.run_id)}>
                    {run.run_name}
                  </SelectItem>
                ))}
                <SelectItem value="new">Create New Run</SelectItem>
              </SelectContent>
            </Select>
            {!selectedRun && (
              <div className="flex w-full md:w-[280px] items-center space-x-2 mt-2">
                <Input
                  type="text"
                  placeholder="New Run Name"
                  value={newRunName}
                  onChange={(e) => setNewRunName(e.target.value)}
                  className="flex-grow"
                  disabled={!selectedAthlete && !newAthleteName}
                />
                <Button
                  onClick={handleCreateRun}
                  disabled={!selectedAthlete && !newAthleteName}
                >
                  Create
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Turn Selection */}
        {(selectedRun || newRunName) && (
          <Card className="">
            <CardHeader>
              <CardTitle className="text-white">Turn</CardTitle>
            </CardHeader>
            <CardContent>
              <LeafletMap
                turns={turns}
                onSelectTurn={setSelectedTurn}
                selectedTurn={selectedTurn}
              />
              {selectedTurnName && (
                <p className="mt-4 text-white text-center">
                  Selected Turn: {selectedTurnName}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-center mt-8">
        <Button
          onClick={handleSubmitMetadata}
          disabled={
            !currentEventId ||
            (!selectedAthlete && newAthleteName.trim() === "") ||
            (!selectedRun && newRunName.trim() === "") ||
            (selectedRun && !selectedTurn && turns.length === 0)
          }
        >
          Confirm Details & Enable Upload
        </Button>
      </div>
    </div>
  );
}
