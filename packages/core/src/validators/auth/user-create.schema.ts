import { z } from "zod";

/** Shared client/server schema — imported by both /api/users and the admin CrudForm. */
export const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, "Name is required"),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
