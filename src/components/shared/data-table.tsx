import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  // Hide less important columns on small screens, e.g. "hidden md:table-cell".
  responsiveClassName?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  // Describes the table for screen readers (and visually, below the table).
  caption: string;
  className?: string;
};

// Presentation only: it renders whatever rows it is given. Searching, sorting
// and paging happen before (in pure functions now, in the database later).
// It's a Server Component, so `cell` functions never ship to the browser.
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  caption,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("rounded-xl border", className)}>
      <Table>
        <TableCaption className="mb-3">{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                scope="col"
                className={cn(column.className, column.responsiveClassName)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={getRowId(row)}>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  className={cn(column.className, column.responsiveClassName)}
                >
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
