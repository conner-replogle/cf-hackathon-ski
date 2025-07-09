import { useState, useEffect } from 'react';
import { FilePond } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import { useParams } from 'react-router-dom';
import SearchAndCreateSelector from '../components/SearchAndCreateSelector';

interface Athlete {
  id: number;
  name: string;
}

interface Run {
  id: number;
  name: string;
  event_id: number;
  athlete_id: number;
}

// Hardcoded mock data
const initialAthletes: Athlete[] = [
  { id: 1, name: 'Mikaela Shiffrin' },
  { id: 2, name: 'Marcel Hirscher' },
  { id: 3, name: 'Lindsey Vonn' },
];

const initialRuns: Run[] = [
  { id: 1, name: 'Downhill Training 1', event_id: 1, athlete_id: 1 },
  { id: 2, name: 'Slalom Race 1', event_id: 1, athlete_id: 1 },
  { id: 3, name: 'Giant Slalom Quali', event_id: 2, athlete_id: 2 },
  { id: 4, name: 'Super-G Practice', event_id: 3, athlete_id: 3 },
];

const turns = Array.from({ length: 15 }, (_, i) => i + 1);

export default function Upload() {
  const { eventId } = useParams<{ eventId: string }>();
  const currentEventId = eventId ? parseInt(eventId, 10) : null;

  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [athletes, setAthletes] = useState<Athlete[]>(initialAthletes);
  const [selectedAthlete, setSelectedAthlete] = useState<number | null>(null);
  
  

  const [runs, setRuns] = useState<Run[]>(initialRuns);
  const [selectedRun, setSelectedRun] = useState<number | null>(null);
  
  

  const [selectedTurn, setSelectedTurn] = useState<number | null>(null);

  const filteredRuns = selectedAthlete
    ? runs.filter((run) => run.athlete_id === selectedAthlete && run.event_id === currentEventId)
    : [];

  useEffect(() => {
    // Reset run and turn selection when athlete or event changes
    setSelectedRun(null);
    setSelectedTurn(null);
  }, [selectedAthlete, currentEventId]);

  

  

  const handleFileUpload = () => {
    setUploadStatus('Video uploaded successfully!');
    setTimeout(() => setUploadStatus(''), 3000);
  };

  const handleUploadError = () => {
    setUploadStatus('Upload failed. Please try again.');
    setTimeout(() => setUploadStatus(''), 3000);
  };

  return (
    <div className="upload-page">
      <h2>Upload Videos for Event: {currentEventId}</h2>
      <p>Select details for your video upload.</p>

      <div className="upload-section">
        {/* Athlete Selection */}
        <div className="form-section">
          <h3>Athlete</h3>
          <SearchAndCreateSelector
            items={athletes}
            selectedItemId={selectedAthlete}
            onSelectItemId={setSelectedAthlete}
            onCreateItem={(athleteName) => {
              const newAthlete: Athlete = {
                id: athletes.length > 0 ? Math.max(...athletes.map(a => a.id)) + 1 : 1,
                name: athleteName,
              };
              setAthletes([...athletes, newAthlete]);
              setSelectedAthlete(newAthlete.id);
            }}
            placeholder="Search or type to create athlete"
            createButtonText="Create New Athlete"
          />
        </div>

        {/* Run Selection */}
        {selectedAthlete && (
          <div className="form-section">
            <h3>Run</h3>
            <SearchAndCreateSelector
              items={filteredRuns}
              selectedItemId={selectedRun}
              onSelectItemId={setSelectedRun}
              onCreateItem={(runName) => {
                if (selectedAthlete !== null && currentEventId !== null) {
                  const newRun: Run = {
                    id: runs.length > 0 ? Math.max(...runs.map(r => r.id)) + 1 : 1,
                    name: runName,
                    event_id: currentEventId,
                    athlete_id: selectedAthlete,
                  };
                  setRuns([...runs, newRun]);
                  setSelectedRun(newRun.id);
                }
              }}
              placeholder="Search or type to create run"
              createButtonText="Create New Run"
            />
          </div>
        )}

        {/* Turn Selection */}
        {selectedRun && (
          <div className="form-section">
            <h3>Turn</h3>
            <select
              onChange={(e) => setSelectedTurn(parseInt(e.target.value, 10))}
              value={selectedTurn || ''}
              className="form-dropdown"
              disabled={!selectedRun}
            >
              <option value="" disabled>
                Select a Turn
              </option>
              {turns.map((turn) => (
                <option key={turn} value={turn}>
                  Turn {turn}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* File Upload Component */}
        <div className="file-upload-section">
          <h3>Video File</h3>
          <FilePond
            server="/api/upload"
            name="video"
            labelIdle='Drag & Drop your video files or <span class="filepond--label-action">Browse</span>'
            acceptedFileTypes={['video/*']}
            onprocessfile={handleFileUpload}
            onprocessfilerevert={handleUploadError}
            allowMultiple={true}
            maxFiles={10}
            disabled={!selectedTurn}
          />
          
          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.includes('successfully') ? 'success' : 'error'}`}>
              {uploadStatus}
            </div>
          )}
        </div>
      </div>
      
      <div className="upload-info">
        <h3>Supported Formats</h3>
        <ul>
          <li>MP4 (.mp4)</li>
          <li>WebM (.webm)</li>
          <li>OGV (.ogv)</li>
          <li>AVI (.avi)</li>
          <li>MOV (.mov)</li>
        </ul>
        
        <h3>Upload Tips</h3>
        <ul>
          <li>Maximum file size: 500MB per video</li>
          <li>You can upload multiple videos at once</li>
          <li>Videos will be automatically added to your library</li>
        </ul>
      </div>
    </div>
  );
}