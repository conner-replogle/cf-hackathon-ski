import { useState, useEffect } from 'react'
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
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        <h2>Video Library</h2>
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
                onClick={() => setSelectedVideo(video.key)}
              >
                <h3>{video.key}</h3>
                <p>Size: {formatFileSize(video.size)}</p>
                <p style={{ marginTop: '0.25rem' }}>Click to play</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Player Section */}
      {selectedVideo && (
        <div className="video-player">
          <h2>Now Playing: {selectedVideo}</h2>
          <video
            key={selectedVideo}
            controls
            src={`/api/videos/${selectedVideo}`}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </>
  )
}

export default App
