"use client";

import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { EmptyState } from "../feedback/EmptyState";
import { ErrorMessage } from "../feedback/ErrorMessage";
import { LoadingMessage } from "../feedback/LoadingMessage";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface DataTablePagination {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  pagination?: DataTablePagination;
  rowActions?: (row: T) => ReactNode;
}

function cellValue<T>(row: T, key: string): ReactNode {
  const value = (row as Record<string, unknown>)[key];
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  return String(value);
}

/** Column-config-driven list rendering — use this for every list screen instead of a hand-rolled `<table>`/`.map()`. */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  loading,
  error,
  emptyMessage = "No results.",
  pagination,
  rowActions,
}: DataTableProps<T>) {
  if (loading) {
    return <LoadingMessage />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            {columns.map((column) => (
              <th key={column.key} className={cn("px-3 py-2 font-medium", column.className)}>
                {column.header}
              </th>
            ))}
            {rowActions && <th className="px-3 py-2" />}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={getRowId(row)} className="border-b border-border last:border-0">
              {columns.map((column) => (
                <td key={column.key} className={cn("px-3 py-2", column.className)}>
                  {column.render ? column.render(row) : cellValue(row, column.key)}
                </td>
              ))}
              {rowActions && <td className="px-3 py-2 text-right">{rowActions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && pagination.pageCount > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => pagination.onPageChange(pagination.page - 1)}
            className="rounded-md border px-2 py-1 disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pageCount}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.pageCount}
            onClick={() => pagination.onPageChange(pagination.page + 1)}
            className="rounded-md border px-2 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
