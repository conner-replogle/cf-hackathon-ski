import { Outlet, Link } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b flex items-center justify-center flex-wrap py-2 px-6 space-x-6">
        <Link to="/">
          <img src="/logo.png" className="h-16" alt="US Ski Team logo" />
        </Link>
        <Link to="/">
          <img src="/cloudflare.png" className="h-16" alt="Cloudflare Logo" />
        </Link>
      </header>
      <main className="flex-1 w-full p-4">
        <Outlet />
      </main>
    </div>
  );
}
