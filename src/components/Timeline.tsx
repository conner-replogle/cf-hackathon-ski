import React from 'react';

interface VideoSegment {
  clip: { turnName?: string };
  duration: number;
  startTime: number;
  endTime: number;
}

interface TimelineProps {
  segments: VideoSegment[];
  currentTime: number;
  totalDuration: number;
  onSeek: (time: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ segments, currentTime, totalDuration, onSeek }) => {
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const timelineRect = e.currentTarget.getBoundingClientRect();
    const clickPosition = e.clientX - timelineRect.left;
    const seekTime = (clickPosition / timelineRect.width) * totalDuration;
    onSeek(seekTime);
  };

  if (totalDuration === 0) {
    return null; // Don't render timeline until we have durations
  }

  return (
    <div className="w-full bg-gray-200 rounded-lg p-2 cursor-pointer my-4" onClick={handleSeek}>
      <div className="relative w-full h-12 bg-gray-700 rounded">
        {segments.map((segment, index) => (
          <div
            key={index}
            className="absolute h-full bg-orange-500 opacity-75 rounded border-r-2 border-gray-900 flex items-center justify-center"
            style={{
              left: `${(segment.startTime / totalDuration) * 100}%`,
              width: `${(segment.duration / totalDuration) * 100}%`,
            }}
          >
            <span className="text-white text-xs font-semibold truncate px-2">
              {segment.clip.turnName || `Clip ${index + 1}`}
            </span>
          </div>
        ))}
        <div
          className="absolute top-0 h-full w-1 bg-red-600 rounded"
          style={{ left: `calc(${(currentTime / totalDuration) * 100}% - 2px)` }}
        />
      </div>
    </div>
  );
};