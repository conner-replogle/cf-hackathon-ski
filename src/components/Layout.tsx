import { Outlet, Link } from "react-router-dom";

import Logo from "@/assets/generated-image.png";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b flex items-center justify-between flex-wrap p-4">
        <div className="flex items-center gap-4">
          <Link to="/">
            <img src={Logo} className="h-16" alt="US Ski Team logo" />
          </Link>
        </div>
        <h1 className="text-foreground">Ski Video Upload & Player</h1>
      </header>
      <main className="flex-1 w-full p-4">
        <Outlet />
      </main>
    </div>
  );
}
