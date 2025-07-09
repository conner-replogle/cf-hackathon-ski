import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface Video {
  key: string;
  size: number;
  etag: string;
}

export default function Playlist() {
  const [playlist, setPlaylist] = useState<Video[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load playlist from sessionStorage
    const storedPlaylist = JSON.parse(sessionStorage.getItem('playlist') || '[]');
    setPlaylist(storedPlaylist);
  }, []);

  // Handle video ended event
  const handleVideoEnded = () => {
    if (playlist.length > 0) {
      const nextIndex = currentVideoIndex + 1;
      if (nextIndex < playlist.length) {
        setCurrentVideoIndex(nextIndex);
      } else {
        // Playlist finished, reset to beginning
        setCurrentVideoIndex(0);
        setIsPlaying(false);
        if (videoRef.current) {
          videoRef.current.pause();
        }
      }
    }
  };

  // Handle drag and drop for reordering playlist
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newPlaylist = [...playlist];
    const draggedItem = newPlaylist[draggedIndex];
    newPlaylist.splice(draggedIndex, 1);
    newPlaylist.splice(dropIndex, 0, draggedItem);

    setPlaylist(newPlaylist);
    sessionStorage.setItem('playlist', JSON.stringify(newPlaylist));
    
    // Adjust current video index if needed
    if (draggedIndex === currentVideoIndex) {
      setCurrentVideoIndex(dropIndex);
    } else if (draggedIndex < currentVideoIndex && dropIndex >= currentVideoIndex) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    } else if (draggedIndex > currentVideoIndex && dropIndex <= currentVideoIndex) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
    
    setDraggedIndex(null);
  };

  // Navigate playlist
  const playPrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
      setIsPlaying(true);
    }
  };

  const playNext = () => {
    if (currentVideoIndex < playlist.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
      setIsPlaying(true);
    }
  };

  const jumpToVideo = (index: number) => {
    setCurrentVideoIndex(index);
    setIsPlaying(true);
  };

  const removeFromPlaylist = (index: number) => {
    const newPlaylist = playlist.filter((_, i) => i !== index);
    setPlaylist(newPlaylist);
    sessionStorage.setItem('playlist', JSON.stringify(newPlaylist));
    
    // Adjust current video index if needed
    if (index < currentVideoIndex) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    } else if (index === currentVideoIndex && index >= newPlaylist.length) {
      setCurrentVideoIndex(Math.max(0, newPlaylist.length - 1));
    }
  };

  const clearPlaylist = () => {
    setPlaylist([]);
    setCurrentVideoIndex(0);
    setIsPlaying(false);
    sessionStorage.removeItem('playlist');
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (playlist.length === 0) {
    return (
      <div className="playlist-page">
        <h2>Playlist</h2>
        <div className="empty-playlist">
          <p>Your playlist is empty.</p>
          <button 
            onClick={() => navigate('/library')}
            className="browse-button"
          >
            Browse Library to Add Videos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="playlist-page">
      <div className="section-header">
        <h2>Playlist ({currentVideoIndex + 1} of {playlist.length})</h2>
        <div className="playlist-actions">
          <button 
            onClick={() => navigate('/library')}
            className="browse-button"
          >
            Add More Videos
          </button>
          <button onClick={clearPlaylist} className="clear-button">
            Clear Playlist
          </button>
        </div>
      </div>
      
      <div className="playlist-controls">
        <button onClick={playPrevious} disabled={currentVideoIndex === 0}>
          ⏮ Previous
        </button>
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="play-pause-button"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button onClick={playNext} disabled={currentVideoIndex === playlist.length - 1}>
          ⏭ Next
        </button>
      </div>

      {/* Video Player Section */}
      <div className="video-player">
        <h3>Now Playing: {playlist[currentVideoIndex]?.key}</h3>
        <video
          ref={videoRef}
          key={`${playlist[currentVideoIndex]?.key}-${currentVideoIndex}`}
          controls
          src={`/api/videos/${playlist[currentVideoIndex]?.key}`}
          onEnded={handleVideoEnded}
          autoPlay={isPlaying}
        >
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="playlist-items">
        <h3>Playlist Items</h3>
        <p className="drag-hint">Drag and drop to reorder videos:</p>
        {playlist.map((video, index) => (
          <div
            key={`${video.key}-${index}`}
            className={`playlist-item ${index === currentVideoIndex ? 'current' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <span className="drag-handle">⋮⋮</span>
            <span className="video-number">{index + 1}.</span>
            <div className="video-info">
              <span className="video-name">{video.key}</span>
              <span className="video-size">{formatFileSize(video.size)}</span>
            </div>
            <div className="playlist-item-actions">
              {index === currentVideoIndex && <span className="current-indicator">▶ Playing</span>}
              <button 
                onClick={() => jumpToVideo(index)}
                className="jump-button"
                disabled={index === currentVideoIndex}
              >
                Play
              </button>
              <button 
                onClick={() => removeFromPlaylist(index)}
                className="remove-button"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
