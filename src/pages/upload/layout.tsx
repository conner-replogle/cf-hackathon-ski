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
            <FileUp className="size-10" />
            <h1 className="text-xl font-bold">Upload Videos</h1>
            <p className="text-center">{description}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
