// src/components/VideoPlayerContainer.tsx
import { useState, useEffect, useCallback } from 'react';
import { VideoPlayerComponent } from './VideoPlayerComponent';
import { Playlist } from './Playlist';
import { Timeline } from './Timeline';

interface Turn {
  turn_id: number;
  turn_name: string;
  event_id: number;
  athlete_id: number;
  r2_video_link: string;
}

interface VideoSegment {
  turn: Turn;
  startTime: number;
  endTime: number;
  duration: number;
}

export const VideoPlayerContainer = ({ turns }: { turns: Turn[] }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [videoSegments, setVideoSegments] = useState<VideoSegment[]>([]);


  useEffect(() => {
    const loadVideoDurations = async () => {
      const segments: VideoSegment[] = [];
      let currentStartTime = 0;

      for (const turn of turns) {
        const duration = await new Promise<number>((resolve) => {
          const tempVideo = document.createElement('video');
          tempVideo.preload = 'metadata';
          tempVideo.onloadedmetadata = () => {
            resolve(tempVideo.duration || 10);
          };
          tempVideo.onerror = () => {
            resolve(10); // Default duration on error
          };
          tempVideo.src = "/api/videos/" + turn.r2_video_link;
        });

        segments.push({
          turn,
          startTime: currentStartTime,
          endTime: currentStartTime + duration,
          duration,
        });
        currentStartTime += duration;
      }

      setVideoSegments(segments);
      setTotalDuration(currentStartTime);
    };

    if (turns.length > 0) {
      loadVideoDurations();
    }
  }, [turns]);

  const handleTimelineSeek = useCallback((targetTime: number) => {
    let segmentIndex = videoSegments.findIndex(
      (segment) => targetTime >= segment.startTime && targetTime < segment.endTime
    );

    if (segmentIndex === -1 && targetTime === totalDuration && totalDuration > 0) {
      segmentIndex = videoSegments.length - 1;
    }

    if (segmentIndex !== -1) {


      setCurrentTime(targetTime);

      if (segmentIndex !== currentVideoIndex) {
        setCurrentVideoIndex(segmentIndex);
      }
      // The VideoPlayerComponent will now seek based on the global currentTime
      // and its own segment's start time.
    }
  }, [videoSegments, currentVideoIndex, totalDuration]);

  const handleVideoEnd = () => {
    if (currentVideoIndex < turns.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else {
      setCurrentVideoIndex(0);
    }
  };

  const handleVideoSelect = (index: number) => {
    if (videoSegments[index]) {
      handleTimelineSeek(videoSegments[index].startTime);
    }
  };



  const handleLoadedMetadata = (_duration: number) => {
    // This is where we could update the duration if it was initially estimated
  };

  if (turns.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
        <p className="text-muted-foreground">No videos available for this run.</p>
      </div>
    );
  }

  const currentVideo = turns[currentVideoIndex];

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-4">
        <VideoPlayerComponent
          src={"/api/videos/" + currentVideo.r2_video_link}
          onEnded={handleVideoEnd}
          onLoadedMetadata={handleLoadedMetadata}
          currentTime={videoSegments[currentVideoIndex] ? currentTime - videoSegments[currentVideoIndex].startTime : 0}
          setCurrentTime={(time) => {
            const segment = videoSegments[currentVideoIndex];
            if (segment) {
              setCurrentTime(segment.startTime + time);
            }
          }}
        />
        <Timeline
          videoSegments={videoSegments}
          currentTime={currentTime}
          totalDuration={totalDuration}
          currentVideoIndex={currentVideoIndex}
          onTimelineSeek={handleTimelineSeek}
        />
      </div>
      <Playlist
        turns={turns}
        currentVideoIndex={currentVideoIndex}
        onVideoSelect={handleVideoSelect}
      />
    </div>
  );
};
