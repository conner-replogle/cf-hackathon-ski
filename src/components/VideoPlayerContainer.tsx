// src/components/VideoPlayerContainer.tsx
import { useState, useEffect, useCallback } from 'react';
import { VideoPlayerComponent } from './VideoPlayerComponent';
import { Playlist } from './Playlist';
import { Timeline } from './Timeline';
import type { Clip } from 'worker/types';



interface VideoSegment {
  clip: Clip;
  startTime: number;
  endTime: number;
  duration: number;
}

export const VideoPlayerContainer = ({ clips }: { clips: Clip[] }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [videoSegments, setVideoSegments] = useState<VideoSegment[]>([]);


  useEffect(() => {
    const loadVideoDurations = async () => {
      const segments: VideoSegment[] = [];
      let currentStartTime = 0;

      for (const clip of clips) {
        const duration = await new Promise<number>((resolve) => {
          const tempVideo = document.createElement('video');
          tempVideo.preload = 'metadata';
          tempVideo.onloadedmetadata = () => {
            resolve(tempVideo.duration || 10);
          };
          tempVideo.onerror = () => {
            resolve(10); // Default duration on error
          };
          tempVideo.src = "/api/videos/" + clip.clip_r2;
        });

        segments.push({
          clip,
          startTime: currentStartTime,
          endTime: currentStartTime + duration,
          duration,
        });
        currentStartTime += duration;
      }

      setVideoSegments(segments);
      setTotalDuration(currentStartTime);
    };

    if (clips.length > 0) {
      loadVideoDurations();
    }
  }, [clips]);

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
    if (currentVideoIndex < clips.length - 1) {
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

  if (clips.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
        <p className="text-muted-foreground">No videos available for this run.</p>
      </div>
    );
  }

  const currentVideo = clips[currentVideoIndex];
  if (!currentVideo) {
    console.log("No video found for index", currentVideoIndex)
    return null;
  }
  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-4">
        <VideoPlayerComponent
          src={"/api/videos/" + currentVideo.clip_r2}
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
        clips={clips}
        currentVideoIndex={currentVideoIndex}
        onVideoSelect={handleVideoSelect}
      />
    </div>
  );
};
