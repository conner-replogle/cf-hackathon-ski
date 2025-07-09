import { Outlet, Link } from 'react-router-dom';
import './Layout.css';
import Logo from '@/assets/generated-image.png';

export default function Layout() {

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 border-b border-gray-700 flex items-center justify-between flex-wrap p-4">
        <div className="flex items-center gap-4">
          <Link to="/">
            <img src={Logo} className="h-16" alt="US Ski Team logo" />
          </Link>
        </div>
       
      </header>
      <main className="flex-1 w-full p-4">
        <Outlet />
      </main>
    </div>
  );
}
