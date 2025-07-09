import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Video {
  key: string;
  size: number;
  etag: string;
}

export default function Library() {
  const { eventId } = useParams<{ eventId: string }>();
  const currentEventId = eventId ? parseInt(eventId, 10) : null;

  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch videos from the API
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${currentEventId}/videos`);
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

  useEffect(() => {
    if (currentEventId) {
      fetchVideos();
    }
  }, [currentEventId]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const addToPlaylist = (video: Video) => {
    // Store the video in sessionStorage and navigate to playlist
    const currentPlaylist = JSON.parse(sessionStorage.getItem('playlist') || '[]');
    const updatedPlaylist = [...currentPlaylist, video];
    sessionStorage.setItem('playlist', JSON.stringify(updatedPlaylist));
    navigate('/playlist');
  };

  const createPlaylistFromAll = () => {
    sessionStorage.setItem('playlist', JSON.stringify(videos));
    navigate('/playlist');
  };

  return (
    <div className="library-page">
      <div className="section-header">
        <h2>Video Library for Event: {currentEventId}</h2>
        {videos.length > 0 && (
          <button 
            className="playlist-button"
            onClick={createPlaylistFromAll}
          >
            Add All to Playlist
          </button>
        )}
      </div>

      {loading ? (
        <p className="loading">Loading videos...</p>
      ) : videos.length === 0 ? (
        <div className="no-videos">
          <p>No videos uploaded yet.</p>
          <button onClick={() => navigate(`/${currentEventId}/upload`)} className="upload-button">
            Upload Your First Video
          </button>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <div
              key={video.key}
              className={`video-card ${selectedVideo === video.key ? 'selected' : ''}`}
            >
              <h3>{video.key}</h3>
              <p>Size: {formatFileSize(video.size)}</p>
              <div className="video-actions">
                <button 
                  onClick={() => setSelectedVideo(video.key)}
                  className="play-button"
                >
                  {selectedVideo === video.key ? 'Playing' : 'Play'}
                </button>
                <button 
                  onClick={() => addToPlaylist(video)}
                  className="add-button"
                >
                  Add to Playlist
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player Section */}
      {selectedVideo && (
        <div className="video-player">
          <h3>Now Playing: {selectedVideo}</h3>
          <video
            controls
            src={`/api/videos/${selectedVideo}`}
            autoPlay
          >
            Your browser does not support the video tag.
          </video>
          <button 
            onClick={() => setSelectedVideo(null)}
            className="close-player-button"
          >
            Close Player
          </button>
        </div>
      )}
    </div>
  );
}
