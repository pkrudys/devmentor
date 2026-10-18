import { z } from "zod";

export const userUpdateSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  name: z.string().min(1, "Name is required").optional(),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
