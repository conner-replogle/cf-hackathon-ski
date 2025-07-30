import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { FormControl } from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";

export type ComboboxData = {
  label: string;
  value: string | number;
};

type Props = {
  data: ComboboxData[];
  value: ComboboxData["value"];
  onSelect: (val: ComboboxData["value"]) => void;
  itemLabel: string;
  isInForm?: boolean;
};

export default function Combobox({
  data,
  value,
  onSelect,
  itemLabel,
  isInForm = true,
}: Props) {
  const [comboboxOpen, setComboboxOpen] = useState(false);
  return (
    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
      <PopoverTrigger asChild>
        {isInForm ? (
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              size="lg"
              className={cn(
                "w-full justify-between",
                !value && "text-muted-foreground",
              )}
            >
              {value
                ? data.find((item) => item.value === value)?.label
                : `Select ${itemLabel}`}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </FormControl>
        ) : (
          <Button
            variant="outline"
            role="combobox"
            size="lg"
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground",
            )}
          >
            {value
              ? data.find((item) => item.value === value)?.label
              : `Select ${itemLabel}`}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)]"
        side="bottom"
      >
        <Command>
          <CommandInput
            placeholder={`Search ${itemLabel}s...`}
            className="h-12"
          />
          <CommandList>
            <CommandEmpty>No {itemLabel}s found.</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  value={item.label}
                  key={item.value}
                  onSelect={() => {
                    onSelect(item.value);
                    setComboboxOpen(false);
                  }}
                >
                  {item.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      item.value === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
