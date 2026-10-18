import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { CrudForm } from "./CrudForm";

const schema = z.object({
  name: z.string(),
  age: z.number().optional(),
  active: z.boolean(),
  role: z.enum(["admin", "user"]),
  weird: z.array(z.string()),
});

describe("CrudForm", () => {
  it("renders one field per schema key, marking required fields with *", () => {
    render(<CrudForm schema={schema} onSubmit={vi.fn()} />);
    const nameLabel = screen.getByText("name").closest("label")!;
    expect(nameLabel.textContent).toContain("*");

    const ageLabel = screen.getByText("age").closest("label")!;
    expect(ageLabel.textContent).not.toContain("*");
  });

  it("renders a checkbox for a boolean field and toggles it", () => {
    render(<CrudForm schema={schema} onSubmit={vi.fn()} />);
    const checkbox = screen.getByLabelText(/active/) as HTMLInputElement;
    expect(checkbox.type).toBe("checkbox");
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it("renders a select for an enum field with its options and updates on change", () => {
    render(<CrudForm schema={schema} onSubmit={vi.fn()} />);
    const select = screen.getByLabelText(/role/) as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.value)).toEqual(["", "admin", "user"]);
    fireEvent.change(select, { target: { value: "admin" } });
    expect(select.value).toBe("admin");
  });

  it("renders a number input for a number field and parses it as a number", () => {
    render(<CrudForm schema={schema} onSubmit={vi.fn()} />);
    const ageInput = screen.getByLabelText(/age/) as HTMLInputElement;
    expect(ageInput.type).toBe("number");
    fireEvent.change(ageInput, { target: { value: "42" } });
    expect(ageInput.value).toBe("42");
  });

  it("renders a disabled text input for an unsupported field type", () => {
    render(<CrudForm schema={schema} onSubmit={vi.fn()} />);
    const weirdInput = screen.getByLabelText(/weird/) as HTMLInputElement;
    expect(weirdInput.type).toBe("text");
    expect(weirdInput).toBeDisabled();
  });

  it("prefills fields from initialValues", () => {
    render(
      <CrudForm
        schema={schema}
        onSubmit={vi.fn()}
        initialValues={{ name: "Alice", active: true, role: "admin" }}
      />
    );
    expect((screen.getByLabelText(/name/) as HTMLInputElement).value).toBe("Alice");
    expect((screen.getByLabelText(/active/) as HTMLInputElement).checked).toBe(true);
  });

  it("shows server-provided fieldErrors next to the right field", () => {
    render(<CrudForm schema={schema} onSubmit={vi.fn()} fieldErrors={{ name: "Already taken" }} />);
    expect(screen.getByText("Already taken")).toBeInTheDocument();
  });

  it("validates locally on submit and shows errors without calling onSubmit, deduping by path", async () => {
    const onSubmit = vi.fn();
    render(<CrudForm schema={schema} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getAllByText(/Invalid|expected|required/i).length).toBeGreaterThan(0));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("dedupes multiple validation issues on the same field path", async () => {
    const dupeSchema = z.object({ name: z.string().min(5).email() });
    render(<CrudForm schema={dupeSchema} onSubmit={vi.fn()} initialValues={{ name: "ab" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getAllByText(/Invalid email address|characters/).length).toBe(1));
  });

  it("calls onSubmit with the parsed data when valid, and shows Saving… while pending", async () => {
    let resolveSubmit!: () => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        })
    );
    render(
      <CrudForm
        schema={schema}
        onSubmit={onSubmit}
        initialValues={{ name: "Alice", active: true, role: "admin", weird: [] }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Alice", active: true, role: "admin" })
    );

    resolveSubmit();
    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled());
  });

  it("uses a custom submitLabel", () => {
    render(<CrudForm schema={schema} onSubmit={vi.fn()} submitLabel="Create" />);
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("renders a Cancel button only when onCancel is provided", () => {
    const { rerender } = render(<CrudForm schema={schema} onSubmit={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();

    rerender(<CrudForm schema={schema} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("calls onCancel when the Cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<CrudForm schema={schema} onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("submits on Cmd+Enter", async () => {
    const onSubmit = vi.fn(async () => undefined);
    render(
      <CrudForm
        schema={schema}
        onSubmit={onSubmit}
        initialValues={{ name: "Alice", active: true, role: "admin", weird: [] }}
      />
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Save" }).closest("form")!, {
      key: "Enter",
      metaKey: true,
    });
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
  });

  it("submits on Ctrl+Enter", async () => {
    const onSubmit = vi.fn(async () => undefined);
    render(
      <CrudForm
        schema={schema}
        onSubmit={onSubmit}
        initialValues={{ name: "Alice", active: true, role: "admin", weird: [] }}
      />
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Save" }).closest("form")!, {
      key: "Enter",
      ctrlKey: true,
    });
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
  });

  it("does nothing on an unrelated key press", () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<CrudForm schema={schema} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Save" }).closest("form")!, { key: "a" });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("cancels on Escape when onCancel is provided", () => {
    const onCancel = vi.fn();
    render(<CrudForm schema={schema} onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Save" }).closest("form")!, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("does nothing on Escape when onCancel is not provided", () => {
    render(<CrudForm schema={schema} onSubmit={vi.fn()} />);
    const form = screen.getByRole("button", { name: "Save" }).closest("form")!;
    expect(() => fireEvent.keyDown(form, { key: "Escape" })).not.toThrow();
  });
});
