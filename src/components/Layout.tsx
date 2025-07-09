import { Outlet, Link, useLocation } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="logo-section">
          <a href="https://vite.dev" target="_blank">
            <img src="/vite.svg" className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src="/src/assets/react.svg" className="logo react" alt="React logo" />
          </a>
        </div>
        <h1>Video Upload & Player</h1>
        <nav className="navigation">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
          >
            Home
          </Link>
          <Link 
            to="/upload" 
            className={location.pathname === '/upload' ? 'nav-link active' : 'nav-link'}
          >
            Upload
          </Link>
          <Link 
            to="/library" 
            className={location.pathname === '/library' ? 'nav-link active' : 'nav-link'}
          >
            Library
          </Link>
          <Link 
            to="/playlist" 
            className={location.pathname === '/playlist' ? 'nav-link active' : 'nav-link'}
          >
            Playlist
          </Link>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
