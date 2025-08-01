import { Button } from "@/components/ui/button";
import { FileUp, Film, ShieldUser } from "lucide-react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="justify-center items-center">
      <div className="flex space-y-4 flex-col pt-8 max-w-3xl mx-auto">
        <Button asChild className="w-full" size="xl">
          <Link to="/upload/event">
            <FileUp className="size-6" />
            Upload Clips
          </Link>
        </Button>
        <Button asChild className="w-full" size="xl">
          <Link to="/watch">
            <Film className="size-6" />
            Watch Clips
          </Link>
        </Button>
        <hr />
        <Button asChild variant="secondary" className="w-full" size="xl">
          <Link to="/admin">
            <ShieldUser className="size-6" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
