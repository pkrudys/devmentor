import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminUsersView, type UserRow } from "./AdminUsersView";

const apiCall = vi.fn();
vi.mock("@devmentor/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@devmentor/ui")>();
  return { ...actual, apiCall: (...args: unknown[]) => apiCall(...args) };
});

const initialUsers: UserRow[] = [{ id: "1", email: "a@b.com", name: "A", createdAt: "2026-01-01" }];

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText(/email/), { target: { value: "new@b.com" } });
  fireEvent.change(screen.getByLabelText(/name/), { target: { value: "New" } });
  fireEvent.click(screen.getByRole("button", { name: "Create" }));
}

describe("AdminUsersView", () => {
  it("renders the initial users", () => {
    render(<AdminUsersView initialUsers={initialUsers} />);
    expect(screen.getByText("a@b.com")).toBeInTheDocument();
  });

  it("creates a user then refetches the list on success", async () => {
    apiCall.mockResolvedValueOnce({ ok: true }); // POST
    apiCall.mockResolvedValueOnce({ ok: true, data: [...initialUsers, { ...initialUsers[0], id: "2" }] }); // GET
    render(<AdminUsersView initialUsers={initialUsers} />);
    fillAndSubmit();
    await waitFor(() => expect(apiCall).toHaveBeenCalledTimes(2));
  });

  it("surfaces an error when the post-create refetch itself fails", async () => {
    apiCall.mockResolvedValueOnce({ ok: true }); // POST
    apiCall.mockResolvedValueOnce({ ok: false, error: { message: "Refetch failed" } }); // GET
    render(<AdminUsersView initialUsers={initialUsers} />);
    fillAndSubmit();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Refetch failed"));
  });

  it("shows the server error and skips refetch when creation fails", async () => {
    apiCall.mockResolvedValueOnce({ ok: false, error: { message: "Email taken" } });
    render(<AdminUsersView initialUsers={initialUsers} />);
    fillAndSubmit();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Email taken"));
    expect(apiCall).toHaveBeenCalledTimes(1);
  });
});
