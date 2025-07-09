import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import './Layout.css';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 border-b border-gray-700 flex items-center justify-between flex-wrap p-4">
        <div className="flex items-center gap-4">
          <Link to="/">
            <img src="/us-ski-team-logo.svg" className="h-10" alt="US Ski Team logo" />
          </Link>
        </div>
        <h1>Video Upload & Player</h1>
        <nav className="flex gap-4">
          <Link to="/">
            <Button variant={location.pathname === '/' ? 'secondary' : 'ghost'}>
              Home
            </Button>
          </Link>
          <Link to="/upload">
            <Button variant={location.pathname === '/upload' ? 'secondary' : 'ghost'}>
              Upload
            </Button>
          </Link>
          <Link to="/library">
            <Button variant={location.pathname === '/library' ? 'secondary' : 'ghost'}>
              Library
            </Button>
          </Link>
          <Link to="/playlist">
            <Button variant={location.pathname === '/playlist' ? 'secondary' : 'ghost'}>
              Playlist
            </Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1 w-full p-4">
        <Outlet />
      </main>
    </div>
  );
}
