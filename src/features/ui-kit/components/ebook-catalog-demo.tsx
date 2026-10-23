import Link from "next/link";
import { SearchX } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CatalogToolbar } from "@/features/ui-kit/components/catalog-toolbar";
import {
  SAMPLE_EBOOK_CATEGORIES,
  sampleCategoryLabel,
  sampleEbooks,
  type SampleEbook,
} from "@/features/ui-kit/sample-ebooks";
import {
  buildListHref,
  filterByCategory,
  filterBySearch,
  paginate,
  parseListQuery,
  sortByTitleOrDate,
  type SearchParamsRecord,
} from "@/lib/list-query";

const PAGE_SIZE = 5;
const PATHNAME = "/ui-kit";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const columns: DataTableColumn<SampleEbook>[] = [
  {
    id: "title",
    header: "Title",
    cell: (book) => <span className="font-medium">{book.title}</span>,
  },
  {
    id: "category",
    header: "Category",
    cell: (book) => <Badge variant="secondary">{sampleCategoryLabel(book.category)}</Badge>,
    responsiveClassName: "hidden sm:table-cell",
  },
  {
    id: "published",
    header: "Published",
    cell: (book) => (
      <time dateTime={book.publishedOn} className="tabular-nums">
        {dateFormatter.format(new Date(book.publishedOn))}
      </time>
    ),
    className: "whitespace-nowrap",
  },
  {
    id: "pages",
    header: "Pages",
    cell: (book) => <span className="tabular-nums">{book.pages}</span>,
    className: "text-right",
    responsiveClassName: "hidden md:table-cell",
  },
];

// Server Component. It reads the URL, runs the pure list helpers on the sample
// data and renders the result. Later the same ListQuery will be passed to a
// Drizzle query instead (see docs/ARCHITECTURE.md → Pagination design).
export async function EbookCatalogDemo({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>;
}) {
  const params = await searchParams;
  const query = parseListQuery(params, {
    categories: SAMPLE_EBOOK_CATEGORIES.map((category) => category.value),
  });

  const searched = filterBySearch(sampleEbooks, query.q, (book) => book.title);
  const filtered = filterByCategory(searched, query.category, (book) => book.category);
  const sorted = sortByTitleOrDate(filtered, query.sort, {
    getTitle: (book) => book.title,
    getDate: (book) => book.publishedOn,
  });
  const result = paginate(sorted, query.page, PAGE_SIZE);

  return (
    <div className="space-y-4">
      <CatalogToolbar query={query} categories={SAMPLE_EBOOK_CATEGORIES} />

      {/* aria-live announces the new result count to screen-reader users. */}
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {result.totalItems === 0
          ? "No matching sample eBooks."
          : `Showing ${result.from}–${result.to} of ${result.totalItems} sample eBooks`}
      </p>

      {result.totalItems === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No results"
          description="Try a different search term or category."
          action={
            <Link
              href={PATHNAME}
              scroll={false}
              replace
              className={buttonVariants({ variant: "outline" })}
            >
              Reset filters
            </Link>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={result.items}
          getRowId={(book) => book.id}
          caption="Fictional sample eBooks for demonstration. Not real products."
        />
      )}

      <PaginationControls
        page={result.page}
        totalPages={result.totalPages}
        createHref={(page) => buildListHref(PATHNAME, query, { page })}
      />
    </div>
  );
}
