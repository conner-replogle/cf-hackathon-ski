import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';


export default function Layout() {

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b flex items-center justify-between flex-wrap p-4">
        <div className="flex items-center gap-4">
          <Link to="/">
            <img src={Logo} className="h-16" alt="US Ski Team logo" />
          </Link>
        </div>
        <h1>Video Upload & Player</h1>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link to="/">
                <NavigationMenuLink className={location.pathname === '/' ? 'bg-accent text-accent-foreground' : ''}>
                  Home
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link to="/upload">
                <NavigationMenuLink className={location.pathname === '/upload' ? 'bg-accent text-accent-foreground' : ''}>
                  Upload
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link to="/library">
                <NavigationMenuLink className={location.pathname === '/library' ? 'bg-accent text-accent-foreground' : ''}>
                  Library
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link to="/playlist">
                <NavigationMenuLink className={location.pathname === '/playlist' ? 'bg-accent text-accent-foreground' : ''}>
                  Playlist
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </header>
      <main className="flex-1 w-full p-4">
        <Outlet />
      </main>
    </div>
  );
}
