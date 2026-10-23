"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import { FilterControls } from "@/components/shared/filter-controls";
import { SearchInput } from "@/components/shared/search-input";
import {
  buildListHref,
  SORT_OPTIONS,
  type ListQuery,
  type SortOption,
} from "@/lib/list-query";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  "title-asc": "Title A–Z",
  "title-desc": "Title Z–A",
};

const ALL = "all";

type CatalogToolbarProps = {
  // Current state, parsed on the server from the URL. Passing it in (instead
  // of calling useSearchParams here) keeps the server as the single source of truth.
  query: ListQuery;
  categories: ReadonlyArray<{ value: string; label: string }>;
};

// Connects the generic SearchInput / FilterControls to the URL.
// Every change becomes ?q=…&category=…&sort=…, so the list state is shareable,
// bookmarkable and survives a refresh. The Back button undoes a filter.
export function CatalogToolbar({ query, categories }: CatalogToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function navigate(changes: Partial<ListQuery>) {
    // Any filter change returns to page 1, since page 3 of new results may not exist.
    const href = buildListHref(pathname, query, { ...changes, page: 1 });
    // A transition keeps the current results visible while the new ones render.
    startTransition(() => router.replace(href, { scroll: false }));
  }

  const isFiltered = Boolean(query.q || query.category || query.sort !== "newest");

  return (
    <div
      className="flex flex-col gap-3 lg:flex-row lg:items-end"
      aria-busy={isPending}
    >
      <div className="flex flex-col gap-1.5 lg:flex-1">
        <span aria-hidden="true" className="text-xs font-medium text-muted-foreground">
          Search
        </span>
        <SearchInput
          label="Search sample eBooks by title"
          placeholder="Search titles…"
          defaultValue={query.q}
          pending={isPending}
          onSearch={(q) => {
            if (q !== query.q) navigate({ q });
          }}
        />
      </div>
      <FilterControls
        filters={[
          {
            id: "category",
            label: "Category",
            value: query.category ?? ALL,
            options: [{ value: ALL, label: "All categories" }, ...categories],
          },
          {
            id: "sort",
            label: "Sort by",
            value: query.sort,
            options: SORT_OPTIONS.map((value) => ({ value, label: SORT_LABELS[value] })),
          },
        ]}
        onChange={(id, value) => {
          if (id === "category") navigate({ category: value === ALL ? null : value });
          if (id === "sort") {
            const sort = SORT_OPTIONS.find((option) => option === value);
            if (sort) navigate({ sort });
          }
        }}
        canReset={isFiltered}
        onReset={() =>
          startTransition(() => router.replace(pathname, { scroll: false }))
        }
      />
    </div>
  );
}
