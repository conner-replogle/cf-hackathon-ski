import { useState, useEffect, useCallback } from 'react';
import { VideoPlayer } from '../components/VideoPlayer';



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
 

  // Fetch videos from the API
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/runs/2/turns');
      if (response.ok) {
        const videoList = await response.json();
        // Map videos to Turn format for VideoPlayer
        setTurns(videoList.turns);
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
