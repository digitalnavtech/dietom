import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  // Builds the URL for a page, so pages are real links: they work without
  // JavaScript, can be opened in a new tab, and are shareable.
  createHref: (page: number) => string;
  className?: string;
};

// Page numbers to show: first, last, current ±1, with gaps as "ellipsis".
// e.g. page 6 of 12 -> [1, "ellipsis", 5, 6, 7, "ellipsis", 12]
export function getPageItems(
  page: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | "ellipsis"> = [];
  sorted.forEach((value, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && value - previous > 1) items.push("ellipsis");
    items.push(value);
  });
  return items;
}

export function PaginationControls({
  page,
  totalPages,
  createHref,
  className,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;
  const disabledClass = "pointer-events-none opacity-50";

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-between gap-2", className)}
    >
      {hasPrevious ? (
        <Link
          href={createHref(page - 1)}
          scroll={false}
          className={buttonVariants({ variant: "outline" })}
        >
          <ChevronLeft data-icon="inline-start" aria-hidden="true" />
          Previous
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(buttonVariants({ variant: "outline" }), disabledClass)}
        >
          <ChevronLeft data-icon="inline-start" aria-hidden="true" />
          Previous
        </span>
      )}

      {/* Numbered links on wider screens; a compact label on phones. */}
      <ul className="hidden items-center gap-1 sm:flex">
        {getPageItems(page, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <li
              key={`ellipsis-${index}`}
              aria-hidden="true"
              className="px-1 text-muted-foreground"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={createHref(item)}
                scroll={false}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={buttonVariants({
                  variant: item === page ? "default" : "ghost",
                  size: "icon",
                })}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ul>
      <p className="text-sm text-muted-foreground sm:hidden">
        Page {page} of {totalPages}
      </p>

      {hasNext ? (
        <Link
          href={createHref(page + 1)}
          scroll={false}
          className={buttonVariants({ variant: "outline" })}
        >
          Next
          <ChevronRight data-icon="inline-end" aria-hidden="true" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(buttonVariants({ variant: "outline" }), disabledClass)}
        >
          Next
          <ChevronRight data-icon="inline-end" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
