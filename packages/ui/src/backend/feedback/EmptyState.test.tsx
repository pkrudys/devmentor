import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders the default message", () => {
    render(<EmptyState />);
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
  });

  it("renders a custom message", () => {
    render(<EmptyState message="No users yet." />);
    expect(screen.getByText("No users yet.")).toBeInTheDocument();
  });
});
