// src/components/Timeline.tsx

import type { Clip } from "worker/types";

interface VideoSegment {
  clip: Clip;
  startTime: number;
  endTime: number;
  duration: number;
}

interface TimelineProps {
  videoSegments: VideoSegment[];
  currentTime: number;
  totalDuration: number;
  currentVideoIndex: number;
  onTimelineSeek: (time: number) => void;
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const Timeline = ({ videoSegments, currentTime, totalDuration, onTimelineSeek, currentVideoIndex }: TimelineProps) => {
  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const timeline = event.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetTime = percentage * totalDuration;
    onTimelineSeek(targetTime);
  };

  return (
    <div className="space-y-2">
      <div
        className="w-full h-8 bg-muted rounded-lg cursor-pointer relative overflow-hidden"
        onClick={handleTimelineClick}
      >
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-75 ease-linear"
          style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
        />
        {videoSegments.map((segment, index) => (
          <div
            key={String(segment.clip.turn_id) + String(segment.clip.run_id)}
            className={`absolute top-0 flex pl-4 justify-start items-center h-full border-r-2 border-background/50 transition-all duration-200 ${index === currentVideoIndex ? 'ring-2 ring-primary-foreground ring-offset-2 ring-offset-primary rounded-lg' : ''}`}
            style={{
              left: `${totalDuration > 0 ? (segment.startTime / totalDuration) * 100 : 0}%`,
              width: `${totalDuration > 0 ? (segment.duration / totalDuration) * 100 : 0}%`,
            }}
            title={`${segment.clip.turn_id} (${formatTime(segment.duration)})`}
          >
            <p>{segment.clip.turn_id}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(totalDuration)}</span>
      </div>
    </div>
  );
};
