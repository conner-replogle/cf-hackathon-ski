export default function Home() {
  return (
    <div className="home-page">
      <div className="hero-section">
        <h2>Welcome to Video Manager</h2>
        <p>Upload, organize, and play your videos with ease.</p>
      </div>
      
      <div className="features">
        <div className="feature-card">
          <h3>📁 Upload Videos</h3>
          <p>Drag and drop video files or browse to upload them to your library.</p>
        </div>
        
        <div className="feature-card">
          <h3>📚 Video Library</h3>
          <p>Browse and play individual videos from your collection.</p>
        </div>
        
        <div className="feature-card">
          <h3>🎵 Playlist Mode</h3>
          <p>Create playlists and enjoy continuous video playback with reordering support.</p>
        </div>
      </div>
      
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <a href="/upload" className="action-button">
            Upload New Video
          </a>
          <a href="/library" className="action-button">
            Browse Library
          </a>
          <a href="/playlist" className="action-button">
            Manage Playlist
          </a>
        </div>
      </div>
    </div>
  );
}
