import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable, type DataTableColumn } from "./DataTable";

interface Row {
  id: string;
  name: string;
  count: number | null;
  createdAt?: Date;
}

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Name" },
  { key: "count", header: "Count" },
];

describe("DataTable", () => {
  it("renders the loading state and nothing else when loading", () => {
    render(<DataTable columns={columns} data={[]} getRowId={(r) => r.id} loading error="ignored" />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders the error state when an error is set (and not loading)", () => {
    render(<DataTable columns={columns} data={[]} getRowId={(r) => r.id} error="Boom" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Boom");
  });

  it("renders the default empty state when there is no data", () => {
    render(<DataTable columns={columns} data={[]} getRowId={(r) => r.id} />);
    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("renders a custom empty message", () => {
    render(<DataTable columns={columns} data={[]} getRowId={(r) => r.id} emptyMessage="No users yet." />);
    expect(screen.getByText("No users yet.")).toBeInTheDocument();
  });

  it("renders rows with default cell formatting: strings, null, and Date", () => {
    const createdAt = new Date("2026-01-01T00:00:00Z");
    const data: Row[] = [{ id: "1", name: "Alice", count: null, createdAt }];
    render(
      <DataTable
        columns={[...columns, { key: "createdAt", header: "Created" }]}
        data={data}
        getRowId={(r) => r.id}
      />
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText(createdAt.toLocaleString())).toBeInTheDocument();
    // the null `count` cell renders as an empty string — table still has one data row.
    expect(screen.getAllByRole("row")).toHaveLength(2); // header + 1 data row
  });

  it("uses a column's custom render function when provided", () => {
    const data: Row[] = [{ id: "1", name: "Alice", count: 3 }];
    render(
      <DataTable
        columns={[{ key: "name", header: "Name", render: (row) => `custom:${row.name}` }]}
        data={data}
        getRowId={(r) => r.id}
      />
    );
    expect(screen.getByText("custom:Alice")).toBeInTheDocument();
  });

  it("renders a row actions column when rowActions is provided", () => {
    const data: Row[] = [{ id: "1", name: "Alice", count: 1 }];
    render(
      <DataTable
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        rowActions={(row) => <button>Edit {row.name}</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Edit Alice" })).toBeInTheDocument();
  });

  it("does not render pagination controls when pageCount is 1 or less", () => {
    const data: Row[] = [{ id: "1", name: "Alice", count: 1 }];
    render(
      <DataTable
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        pagination={{ page: 1, pageCount: 1, onPageChange: vi.fn() }}
      />
    );
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
  });

  it("renders pagination controls and disables Previous on the first page", () => {
    const onPageChange = vi.fn();
    const data: Row[] = [{ id: "1", name: "Alice", count: 1 }];
    render(
      <DataTable
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        pagination={{ page: 1, pageCount: 3, onPageChange }}
      />
    );
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("disables Next on the last page and calls onPageChange when Previous is clicked", () => {
    const onPageChange = vi.fn();
    const data: Row[] = [{ id: "1", name: "Alice", count: 1 }];
    render(
      <DataTable
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        pagination={{ page: 3, pageCount: 3, onPageChange }}
      />
    );
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
