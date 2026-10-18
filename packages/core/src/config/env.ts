import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // >=32 chars as a floor for >=32 random bytes of entropy (base64/hex secrets
  // are longer anyway). Never hardcode a default here.
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Validated once, on first use — not at module load — so routes that never
 * touch auth (e.g. /api/health) don't require JWT_SECRET to be set.
 */
export function getEnv(): Env {
  if (cached) {
    return cached;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }

  cached = parsed.data;
  return cached;
}
