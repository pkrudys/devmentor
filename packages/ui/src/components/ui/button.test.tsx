import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders a native button by default", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("applies the requested variant and size classes", () => {
    render(
      <Button variant="destructive" size="lg">
        Delete
      </Button>
    );
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.className).toContain("bg-destructive");
    expect(button.className).toContain("h-10");
  });

  it("merges a custom className via cn()", () => {
    render(<Button className="custom-class">Go</Button>);
    expect(screen.getByRole("button", { name: "Go" }).className).toContain("custom-class");
  });

  it("renders as its child element when asChild is set", () => {
    render(
      <Button asChild>
        <a href="/somewhere">Link button</a>
      </Button>
    );
    const link = screen.getByRole("link", { name: "Link button" });
    expect(link).toHaveAttribute("href", "/somewhere");
    expect(link).toHaveAttribute("data-slot", "button");
  });
});
