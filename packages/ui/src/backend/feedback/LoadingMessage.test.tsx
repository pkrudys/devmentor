import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingMessage } from "./LoadingMessage";

describe("LoadingMessage", () => {
  it("renders the default message", () => {
    render(<LoadingMessage />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders a custom message", () => {
    render(<LoadingMessage message="Fetching users…" />);
    expect(screen.getByText("Fetching users…")).toBeInTheDocument();
  });
});
