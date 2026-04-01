import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
} from "drizzle-orm/pg-core";

export const presets = pgTable("presets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  baseModelId: text("base_model_id").notNull(),
  modelIds: jsonb("model_ids").notNull().$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const evaluations = pgTable("evaluations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  prompt: text("prompt").notNull(),
  systemPrompt: text("system_prompt"),
  baseModelId: text("base_model_id").notNull(),
  modelIds: jsonb("model_ids").notNull().$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const responses = pgTable("responses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  evaluationId: text("evaluation_id")
    .notNull()
    .references(() => evaluations.id, { onDelete: "cascade" }),
  modelId: text("model_id").notNull(),
  isBase: boolean("is_base").notNull().default(false),
  text: text("text").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  costUsd: real("cost_usd").notNull().default(0),
  blobKey: text("blob_key"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Preset = typeof presets.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
export type Response = typeof responses.$inferSelect;
