import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL in environment");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

console.log("Creating tables...");

await sql`
  CREATE TABLE IF NOT EXISTS "presets" (
    "id"            text        PRIMARY KEY NOT NULL,
    "name"          text        NOT NULL,
    "base_model_id" text        NOT NULL,
    "model_ids"     jsonb       NOT NULL,
    "created_at"    timestamp   NOT NULL DEFAULT now(),
    "updated_at"    timestamp   NOT NULL DEFAULT now()
  )
`;
console.log("✓ presets");

await sql`
  CREATE TABLE IF NOT EXISTS "evaluations" (
    "id"             text        PRIMARY KEY NOT NULL,
    "prompt"         text        NOT NULL,
    "system_prompt"  text,
    "base_model_id"  text        NOT NULL,
    "model_ids"      jsonb       NOT NULL,
    "created_at"     timestamp   NOT NULL DEFAULT now()
  )
`;
console.log("✓ evaluations");

await sql`
  CREATE TABLE IF NOT EXISTS "responses" (
    "id"             text        PRIMARY KEY NOT NULL,
    "evaluation_id"  text        NOT NULL REFERENCES "evaluations"("id") ON DELETE CASCADE,
    "model_id"       text        NOT NULL,
    "is_base"        boolean     NOT NULL DEFAULT false,
    "text"           text        NOT NULL,
    "latency_ms"     integer     NOT NULL,
    "input_tokens"   integer     NOT NULL DEFAULT 0,
    "output_tokens"  integer     NOT NULL DEFAULT 0,
    "cost_usd"       real        NOT NULL DEFAULT 0,
    "blob_key"       text,
    "created_at"     timestamp   NOT NULL DEFAULT now()
  )
`;
console.log("✓ responses");

console.log("\nAll tables created.");
