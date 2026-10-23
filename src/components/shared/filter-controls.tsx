"use client";

import { useId } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string };

export type FilterDefinition = {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
};

type FilterControlsProps = {
  filters: FilterDefinition[];
  onChange: (id: string, value: string) => void;
  onReset?: () => void;
  // Disable "Reset" when nothing is filtered.
  canReset?: boolean;
  className?: string;
};

function FilterSelect({
  filter,
  onChange,
}: {
  filter: FilterDefinition;
  onChange: (id: string, value: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {filter.label}
      </label>
      {/* `items` lets Base UI show the selected option's label, not its value. */}
      <Select
        items={filter.options}
        value={filter.value}
        onValueChange={(value) => {
          if (typeof value === "string") onChange(filter.id, value);
        }}
      >
        <SelectTrigger id={id} className="h-9 w-full sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {filter.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Generic: renders any number of dropdown filters plus a reset button.
// It holds no state; the parent owns the values (here, the URL does).
export function FilterControls({
  filters,
  onChange,
  onReset,
  canReset = true,
  className,
}: FilterControlsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap",
        className,
      )}
    >
      {filters.map((filter) => (
        <FilterSelect key={filter.id} filter={filter} onChange={onChange} />
      ))}
      {onReset ? (
        <Button
          type="button"
          variant="ghost"
          className="col-span-2 h-9 sm:col-span-1"
          disabled={!canReset}
          onClick={onReset}
        >
          <RotateCcw data-icon="inline-start" aria-hidden="true" />
          Reset filters
        </Button>
      ) : null}
    </div>
  );
}
