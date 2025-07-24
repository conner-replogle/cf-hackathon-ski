import { SelectEvent } from "@/components/SelectEvent";

export function SelectEventPage() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <SelectEvent redirectUrl="/watch" />
    </div>
  );
}
