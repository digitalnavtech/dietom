"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  label: string;
  defaultValue?: string;
  placeholder?: string;
  // Called after the user stops typing for `debounceMs`.
  onSearch: (value: string) => void;
  debounceMs?: number;
  maxLength?: number;
  pending?: boolean;
  className?: string;
};

// Generic and URL-agnostic: it only reports what was typed. The caller decides
// what a search means (update the URL, filter a local list, call an API...).
export function SearchInput({
  label,
  defaultValue = "",
  placeholder = "Search…",
  onSearch,
  debounceMs = 300,
  maxLength = 100,
  pending = false,
  className,
}: SearchInputProps) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Keep in sync when the value changes from outside (e.g. "Reset filters").
  const [syncedDefault, setSyncedDefault] = useState(defaultValue);
  if (defaultValue !== syncedDefault) {
    setSyncedDefault(defaultValue);
    setValue(defaultValue);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function schedule(next: string) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(next.trim()), debounceMs);
  }

  return (
    <div className={cn("relative w-full", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id={id}
        type="search"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete="off"
        className="h-9 pr-16 pl-8"
        onChange={(event) => {
          setValue(event.target.value);
          schedule(event.target.value);
        }}
        onKeyDown={(event) => {
          // Enter searches immediately instead of waiting for the debounce.
          if (event.key === "Enter") {
            clearTimeout(timer.current);
            onSearch(value.trim());
          }
        }}
      />
      <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-1">
        {pending ? <LoadingSpinner label="Searching" /> : null}
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Clear search"
            onClick={() => {
              clearTimeout(timer.current);
              setValue("");
              onSearch("");
            }}
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
