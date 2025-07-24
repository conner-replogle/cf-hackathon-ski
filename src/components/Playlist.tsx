// src/components/Playlist.tsx

import type { Clip } from "worker/types";


interface PlaylistProps {
  clips: Clip[];
  currentVideoIndex: number;
  onVideoSelect: (index: number) => void;
}

export const Playlist = ({ clips, currentVideoIndex, onVideoSelect }: PlaylistProps) => {
  const currentVideo = clips[currentVideoIndex];

  if (!currentVideo) {
    return null;
  }

  return (
    <div className="md:col-span-1 space-y-6">
      <div className="bg-card p-4 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-2">{currentVideo.turn_id}</h3>
        <p className="text-md text-muted-foreground">Turn {currentVideoIndex + 1} of {clips.length}</p>
      </div>
      <div className="bg-card p-4 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Playlist</h3>
        <ul className="space-y-2">
          {clips.map((clip, index) => (
            <li
              key={clip.turn_id}
              className={`p-3 rounded-md cursor-pointer transition-colors text-sm font-medium ${index === currentVideoIndex ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              onClick={() => onVideoSelect(index)}
            >
              {index + 1}. {clip.turn_id}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
