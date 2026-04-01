import OpenAI from "openai";
import { env } from "./env";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: env.OPENROUTER_API_KEY,
});

export type ModelResult = {
  modelId: string;
  text: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export type CallModelOptions = {
  temperature?: number;
  maxTokens?: number;
};

export async function callModel(
  modelId: string,
  prompt: string,
  systemPrompt: string | null,
  opts: CallModelOptions = {}
): Promise<ModelResult> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const start = Date.now();

  const completion = await client.chat.completions.create({
    model: modelId,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1024,
  });

  const latencyMs = Date.now() - start;
  const choice = completion.choices[0];
  const text = choice?.message?.content ?? "";
  const usage = completion.usage;

  // OpenRouter returns cost in USD in the `usage` object under x_groq or as
  // a top-level field depending on the model. Fall back to 0 if not present.
  const costUsd =
    (usage as unknown as Record<string, number>)?.["cost"] ?? 0;

  return {
    modelId,
    text,
    latencyMs,
    inputTokens: usage?.prompt_tokens ?? 0,
    outputTokens: usage?.completion_tokens ?? 0,
    costUsd,
  };
}

export type OpenRouterModel = {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  pricing: {
    prompt: number;   // cost per token (input)
    completion: number; // cost per token (output)
  };
  isFree: boolean;
};

export async function fetchModels(): Promise<OpenRouterModel[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
  });

  if (!res.ok) {
    throw new Error(`OpenRouter /models failed: ${res.status}`);
  }

  const json = await res.json() as {
    data: Array<{
      id: string;
      name: string;
      context_length: number;
      pricing: { prompt: string; completion: string };
    }>;
  };

  return json.data.map((m) => {
    const provider = m.id.split("/")[0] ?? m.id;
    const promptPrice = parseFloat(m.pricing.prompt ?? "0");
    const completionPrice = parseFloat(m.pricing.completion ?? "0");
    return {
      id: m.id,
      name: m.name,
      provider,
      contextLength: m.context_length,
      pricing: { prompt: promptPrice, completion: completionPrice },
      isFree: promptPrice === 0 && completionPrice === 0,
    };
  });
}
