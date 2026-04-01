# Tech Stack

## Runtime & Tooling
| Layer | Choice | Notes |
|---|---|---|
| Runtime / Package Manager | Bun | Fast installs, native TS, replaces node+npm |
| Framework | Next.js 16 (App Router) | Server Components, Route Handlers, SSE |
| Language | TypeScript 5 | End-to-end type safety |
| Styling | Tailwind CSS 4 | Utility-first; postcss config already present |

## Database & Storage
| Layer | Choice | Notes |
|---|---|---|
| Relational DB | Neon (serverless Postgres) | Evaluation metadata, responses, presets |
| ORM | Drizzle ORM | Lightweight, fully typed, Neon-compatible |
| Migrations | drizzle-kit | Schema push / generate |
| Blob Storage | Vercel Blob | Full response JSON payloads (keeps DB lean) |

## AI / API
| Layer | Choice | Notes |
|---|---|---|
| Model Gateway | OpenRouter | Single key, 300+ models, OpenAI-compatible API |
| SDK | `openai` npm package | Pointed at `https://openrouter.ai/api/v1` |
| Parallel execution | `Promise.allSettled` | Fire all model calls concurrently |
| Real-time delivery | Server-Sent Events (SSE) | Route Handler streams results to client as each model finishes |

## Key Packages
```
@neondatabase/serverless     — Neon DB HTTP/WebSocket driver (edge-safe)
drizzle-orm                  — ORM
drizzle-kit                  — Migration CLI
openai                       — OpenRouter-compatible client
zod                          — Schema validation (env vars, API payloads)
```

## Environment Variables
```
DATABASE_URL=          # Neon Postgres connection string
OPENROUTER_API_KEY=    # OpenRouter API key (server-side only, never sent to client)
NEON_BLOB_URL=         # Neon Blob Store endpoint
NEON_BLOB_TOKEN=       # Neon Blob Store auth token
```

## What's NOT used
- No auth library (no login in v1)
- No job queue (parallel Promise.allSettled is sufficient for this use case)
- No external cache (Next.js `unstable_cache` covers model list caching)
