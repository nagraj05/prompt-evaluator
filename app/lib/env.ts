import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1),
  BLOB_READ_WRITE_TOKEN: z.string().min(1),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Missing required environment variables: ${missing}`);
  }
  return result.data;
}

export const env = validateEnv();
