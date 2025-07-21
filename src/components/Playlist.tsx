// src/components/Playlist.tsx

interface Turn {
  turn_id: number;
  turn_name: string;
  event_id: number;
  athlete_id: number;
  r2_video_link: string;
}

interface PlaylistProps {
  turns: Turn[];
  currentVideoIndex: number;
  onVideoSelect: (index: number) => void;
}

export const Playlist = ({ turns, currentVideoIndex, onVideoSelect }: PlaylistProps) => {
  const currentVideo = turns[currentVideoIndex];

  if (!currentVideo) {
    return null;
  }

  return (
    <div className="md:col-span-1 space-y-6">
      <div className="bg-card p-4 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-2">{currentVideo.turn_name}</h3>
        <p className="text-md text-muted-foreground">Turn {currentVideoIndex + 1} of {turns.length}</p>
      </div>
      <div className="bg-card p-4 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Playlist</h3>
        <ul className="space-y-2">
          {turns.map((turn, index) => (
            <li
              key={turn.turn_id}
              className={`p-3 rounded-md cursor-pointer transition-colors text-sm font-medium ${index === currentVideoIndex ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              onClick={() => onVideoSelect(index)}
            >
              {index + 1}. {turn.turn_name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
