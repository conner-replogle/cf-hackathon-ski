import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import type { Clip } from 'worker/types';
import { Timeline } from './Timeline';

interface VideoPlayerProps {
  clips: Clip[];
}

interface VideoSegment {
  clip: Clip;
  streamUrl: string;
  duration: number;
  startTime: number;
  endTime: number;
}

async function fetchStreamData(clip: Clip): Promise<{ streamUrl: string; duration: number } | null> {
  try {
    const response = await fetch(`/api/clips/${clip.clipStreamId}/stream`);
    if (!response.ok) return null;
    const data = await response.json() as { result: { playback: { hls: string }; duration: number } };
    const streamUrl = data.result.playback.hls;
    const duration = data.result.duration;
    return { streamUrl, duration };
  } catch (error) {
    console.error("Error fetching stream data:", error);
    return null;
  }
}

export const VideoPlayer = ({ clips }: VideoPlayerProps) => {
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [globalTime, setGlobalTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const initialize = async () => {
      const promises = clips.map(fetchStreamData);
      const results = await Promise.all(promises);

      let cumulativeTime = 0;
      const newSegments: VideoSegment[] = [];

      results.forEach((result, index) => {
        if (result) {
          newSegments.push({
            clip: clips[index],
            streamUrl: result.streamUrl,
            duration: result.duration,
            startTime: cumulativeTime,
            endTime: cumulativeTime + result.duration,
          });
          cumulativeTime += result.duration;
        }
      });

      setSegments(newSegments);
      setTotalDuration(cumulativeTime);
    };

    if (clips.length > 0) {
      initialize();
    }
  }, [clips]);

  useEffect(() => {
    if (segments.length > 0 && videoRef.current) {
      const currentSegment = segments[currentClipIndex];
      if (currentSegment) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(currentSegment.streamUrl);
        hls.attachMedia(videoRef.current);

        const timeWithinClip = globalTime - currentSegment.startTime;
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (videoRef.current) {
            videoRef.current.currentTime = timeWithinClip > 0 ? timeWithinClip : 0;
            videoRef.current.play();
          }
        });
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [currentClipIndex, segments]);

  const handleTimeUpdate = () => {
    if (videoRef.current && segments[currentClipIndex]) {
      const currentSegment = segments[currentClipIndex];
      const newGlobalTime = currentSegment.startTime + videoRef.current.currentTime;
      setGlobalTime(newGlobalTime);
    }
  };

  const handleVideoEnded = () => {
    if (currentClipIndex < segments.length - 1) {
      setCurrentClipIndex(currentClipIndex + 1);
    } else {
      // Optionally loop or stop
      setCurrentClipIndex(0);
      setGlobalTime(0);
    }
  };

  const handleSeek = (time: number) => {
    const segmentIndex = segments.findIndex(s => time >= s.startTime && time < s.endTime);
    if (segmentIndex !== -1) {
      setGlobalTime(time);
      if (segmentIndex !== currentClipIndex) {
        setCurrentClipIndex(segmentIndex);
      } else {
        const timeWithinClip = time - segments[segmentIndex].startTime;
        if (videoRef.current) {
          videoRef.current.currentTime = timeWithinClip;
        }
      }
    }
  };

  return (
    <div>
      <video
        ref={videoRef}
        controls
        onEnded={handleVideoEnded}
        onTimeUpdate={handleTimeUpdate}
        style={{ width: '100%' }}
      />
      <Timeline segments={segments} currentTime={globalTime} totalDuration={totalDuration} onSeek={handleSeek} />
      
    </div>
  );
};