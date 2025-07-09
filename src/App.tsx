import { useState, useEffect, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import 'filepond/dist/filepond.min.css'
import './App.css'
import { FilePond } from 'react-filepond';

interface Video {
  key: string;
  size: number;
  etag: string;
}

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlist, setPlaylist] = useState<Video[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaylistMode, setIsPlaylistMode] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Fetch videos from the API
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/videos');
      if (response.ok) {
        const videoList = await response.json();
        setVideos(videoList);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle successful file upload
  const handleFileUpload = () => {
    // Refresh the video list after upload
    fetchVideos();
  };

  // Create playlist from all videos
  const createPlaylist = () => {
    setPlaylist([...videos]);
    setCurrentVideoIndex(0);
    setIsPlaylistMode(true);
    setSelectedVideo(null);
  };

  // Handle video ended event
  const handleVideoEnded = () => {
    if (isPlaylistMode && playlist.length > 0) {
      const nextIndex = currentVideoIndex + 1;
      if (nextIndex < playlist.length) {
        setCurrentVideoIndex(nextIndex);
      } else {
        // Playlist finished, reset to beginning
        setCurrentVideoIndex(0);
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
    }
  };

  const playNext = () => {
    if (currentVideoIndex < playlist.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  // Exit playlist mode
  const exitPlaylistMode = () => {
    setIsPlaylistMode(false);
    setPlaylist([]);
    setCurrentVideoIndex(0);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Fetch videos on component mount
  useEffect(() => {
    fetchVideos();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };



  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Video Upload & Player</h1>
      
      {/* File Upload Section */}
      <div className="upload-section">
        <h2>Upload Video</h2>
        <FilePond
          server="/api/upload"
          name="video"
          labelIdle='Drag & Drop your video files or <span class="filepond--label-action">Browse</span>'
          acceptedFileTypes={['video/*']}
          onprocessfile={handleFileUpload}
        />
      </div>

      {/* Video List Section */}
      <div className="video-section">
        <div className="section-header">
          <h2>Video Library</h2>
          {videos.length > 0 && (
            <button 
              className="playlist-button"
              onClick={createPlaylist}
              disabled={isPlaylistMode}
            >
              {isPlaylistMode ? 'Playlist Active' : 'Create Playlist'}
            </button>
          )}
        </div>
        {loading ? (
          <p className="loading">Loading videos...</p>
        ) : videos.length === 0 ? (
          <p className="no-videos">No videos uploaded yet.</p>
        ) : (
          <div className="video-grid">
            {videos.map((video) => (
              <div
                key={video.key}
                className={`video-card ${selectedVideo === video.key ? 'selected' : ''}`}
                onClick={() => !isPlaylistMode && setSelectedVideo(video.key)}
                style={{ cursor: isPlaylistMode ? 'not-allowed' : 'pointer', opacity: isPlaylistMode ? 0.6 : 1 }}
              >
                <h3>{video.key}</h3>
                <p>Size: {formatFileSize(video.size)}</p>
                <p style={{ marginTop: '0.25rem' }}>
                  {isPlaylistMode ? 'Playlist mode active' : 'Click to play'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Playlist Section */}
      {isPlaylistMode && playlist.length > 0 && (
        <div className="playlist-section">
          <div className="section-header">
            <h2>Playlist ({currentVideoIndex + 1} of {playlist.length})</h2>
            <button className="exit-playlist-button" onClick={exitPlaylistMode}>
              Exit Playlist
            </button>
          </div>
          
          <div className="playlist-controls">
            <button onClick={playPrevious} disabled={currentVideoIndex === 0}>
              ⏮ Previous
            </button>
            <button onClick={playNext} disabled={currentVideoIndex === playlist.length - 1}>
              ⏭ Next
            </button>
          </div>

          <div className="playlist-items">
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
                <span className="video-name">{video.key}</span>
                {index === currentVideoIndex && <span className="current-indicator">▶ Playing</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Player Section */}
      {(selectedVideo || (isPlaylistMode && playlist.length > 0)) && (
        <div className="video-player">
          {isPlaylistMode ? (
            <>
              <h2>Now Playing: {playlist[currentVideoIndex]?.key}</h2>
              <video
                ref={videoRef}
                key={`${playlist[currentVideoIndex]?.key}-${currentVideoIndex}`}
                controls
                src={`/api/videos/${playlist[currentVideoIndex]?.key}`}
                onEnded={handleVideoEnded}
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            </>
          ) : (
            <>
              <h2>Now Playing: {selectedVideo}</h2>
              <video
                controls
                src={`/api/videos/${selectedVideo}`}
              >
                Your browser does not support the video tag.
              </video>
            </>
          )}
        </div>
      )}
    </>
  )
}

export default App
