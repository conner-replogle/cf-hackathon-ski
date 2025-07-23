import { FileUp } from "lucide-react";

type Props = {
  children: React.ReactNode;
  description: string;
};
export default function Layout({ children, description }: Props) {
  return (
    <div className="bg-background flex flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 flex items-center justify-center bg-primary/10 rounded-full">
              <FileUp className="size-10 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Upload Videos</h1>
            <p className="text-center">{description}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
