// src/components/VideoPlayerComponent.tsx
import { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  onEnded: () => void;
  onLoadedMetadata: (duration: number) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
}

export const VideoPlayerComponent = ({ src, onEnded, onLoadedMetadata, currentTime, setCurrentTime }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        onLoadedMetadata(videoRef.current?.duration || 0);
      };
    }
  }, [src, onLoadedMetadata]);

  // When the currentTime prop changes, seek the video
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 1) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        controls
        onEnded={onEnded}
        key={src} // Use src as key to force re-render on video change
        src={src}
        className="w-full h-full"
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
          }
        }}
      />
    </div>
  );
};
