import { useState, useEffect, useCallback } from 'react';
import { VideoPlayer } from '../components/VideoPlayer';

interface Video {
  key: string;
  size: number;
  etag: string;
}

interface Turn {
  turn_id: number;
  turn_name: string;
  event_id: number;
  athlete_id: number;
  r2_video_link: string;
}

export default function ConnerTest() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map Video objects to Turn objects for VideoPlayer component
  const mapVideosToTurns = (videos: Video[]): Turn[] => {
    return videos.map((video, index) => ({
      turn_id: index + 1,
      turn_name: video.key.replace(/\.[^/.]+$/, ""), // Remove file extension
      event_id: Math.floor(Math.random() * 100) + 1, // Random event ID for demo
      athlete_id: Math.floor(Math.random() * 50) + 1, // Random athlete ID for demo
      r2_video_link: `/api/videos/${video.key}` // Video URL endpoint
    }));
  };

  // Fetch videos from the API
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/videos');
      if (response.ok) {
        const videoList = await response.json();
        // Map videos to Turn format for VideoPlayer
        const mappedTurns = mapVideosToTurns(videoList);
        setTurns(mappedTurns);
      } else {
        setError('Failed to fetch videos');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Error fetching videos');
    } finally {
      setLoading(false);
    }
  }, []);

  

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Use mock data if no real videos are available
  if (turns.length === 0) {
    return (
      <div>
        <h2>No Videos Available</h2>
        <p>🎬 Using mock test data since no videos are available</p>
      </div>
    )
  }

  return (
    <div className="home-page">
      <div style={{ padding: '20px' }}>
        <h1>VideoPlayer Component Test</h1>
        
        {
          error && <div className="error-message">{error}</div>
        }

        <div>
          <h2>VideoPlayer Component</h2>
          <VideoPlayer turns={turns} />
        </div>

        <div style={{ marginTop: '20px' }}>
          <button onClick={fetchVideos} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Videos'}
          </button>
        </div>
      </div>
    </div>
  );
}
