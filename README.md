<div align="center">

```
██████╗ ██████╗  ██████╗ ███╗   ███╗██████╗ ████████╗    ███████╗██╗   ██╗ █████╗ ██╗     
██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔══██╗╚══██╔══╝    ██╔════╝██║   ██║██╔══██╗██║     
██████╔╝██████╔╝██║   ██║██╔████╔██║██████╔╝   ██║       █████╗  ██║   ██║███████║██║     
██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔═══╝    ██║       ██╔══╝  ╚██╗ ██╔╝██╔══██║██║     
██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║██║        ██║       ███████╗ ╚████╔╝ ██║  ██║███████╗
╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝        ╚═╝       ╚══════╝  ╚═══╝  ╚═╝  ╚═╝╚══════╝
```

**Run your prompt against multiple LLMs in parallel. Watch them race. Pick the best.**  
Real-time streaming · Side-by-side comparison · Cost & latency tracking.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-latest-F9F1E1?style=flat-square&logo=bun&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![OpenRouter](https://img.shields.io/badge/OpenRouter-300%2B%20models-6366F1?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-F5A96B?style=flat-square)

</div>

---

## ✦ What is Prompt Evaluator?

Prompt Evaluator is a full-stack tool for developers and researchers who need to compare LLM outputs across multiple models at once. Write a prompt, pick a base model and any number of comparison models, and submit — all models run in parallel and stream their responses back in real time.

No juggling browser tabs. No copy-pasting. Just the answers, side by side.

---

## ✦ Features

| | |
|---|---|
| ⚡ **Parallel execution** | All models run simultaneously via `Promise.allSettled` — no waiting in queue |
| 📡 **Real-time streaming** | Responses arrive via Server-Sent Events as each model finishes |
| 📊 **Per-model analytics** | Latency (ms), input/output tokens, and estimated cost tracked for every call |
| 🗂️ **Model presets** | Save and reload named sets of base + comparison models |
| 🕘 **Evaluation history** | Browse, re-open, and review past evaluations stored in Neon DB |
| 🗄️ **Full response archive** | Complete response payloads stored in Vercel Blob for long-term audit |
| 🔒 **Secure by default** | Single server-side API key — OpenRouter credentials never reach the client |

---

## ✦ Tech Stack

### Core
| Layer | Choice |
|---|---|
| Runtime | [Bun](https://bun.sh/) |
| Framework | [Next.js 16](https://nextjs.org/) — App Router, Server Components |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |

### Data & AI
| Layer | Choice |
|---|---|
| Database | [Neon](https://neon.tech/) — serverless Postgres |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) |
| Blob storage | [Vercel Blob](https://vercel.com/storage/blob) |
| AI gateway | [OpenRouter](https://openrouter.ai/) — 300+ models, one key |

---

## ✦ Requirements

- **Bun** — install below
- **OpenRouter API key** — [openrouter.ai/keys](https://openrouter.ai/keys)
- **Neon database** — [neon.tech](https://neon.tech/)
- **Vercel Blob** storage bucket

---

## ✦ Getting Started

### 1. Install Bun

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Via npm (any platform)
npm install -g bun

# Verify
bun --version
```

### 2. Clone & install dependencies

```bash
git clone https://github.com/nagraj05/prompt-evaluator.git
cd prompt-evaluator
bun install
```

### 3. Configure environment

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env.local
```

Open `.env.local` and set each value:

```env
# Neon Postgres
DATABASE_URL=postgres://...

# OpenRouter
OPENROUTER_API_KEY=sk-or-...

# Vercel Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

```bash
# 4. Run database migrations
bun --env-file=.env.local scripts/migrate.ts

# 5. Start the dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and start evaluating.

---

## ✦ How It Works

```
User submits prompt + model selection
         │
         ▼
POST /api/evaluate  →  creates evaluation row in Neon DB
         │
         ▼
GET /api/evaluate/[id]/stream  (SSE)
         │
         ├── OpenRouter call: base model ──────┐
         ├── OpenRouter call: comparison 1 ────┤ Promise.allSettled (parallel)
         └── OpenRouter call: comparison N ────┘
                                               │
                          each result emitted as SSE event
                          stored to Neon DB + Vercel Blob
                                               │
                                               ▼
                                    ComparisonGrid updates
                                    ResponseCard per model
```

---

## ✦ API Reference

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/models` | OpenRouter model list, cached 6 h |
| `POST` | `/api/evaluate` | Create evaluation, returns `evaluationId` |
| `GET` | `/api/evaluate/[id]/stream` | SSE — parallel model calls, emits per-model results |
| `GET` | `/api/presets` | List saved presets |
| `POST` | `/api/presets` | Save new preset |
| `DELETE` | `/api/presets/[id]` | Delete preset |
| `GET` | `/api/history` | Last 50 evaluations, newest first |

**SSE event shapes:**

```ts
{ type: "response", modelId, isBase, text, latencyMs, inputTokens, outputTokens, costUsd }
{ type: "error",    modelId, message }
{ type: "done" }
```

---

## ✦ Project Structure

```
app/
├── page.tsx                         # Home — PromptForm
├── eval/[id]/page.tsx               # Comparison grid view
├── history/page.tsx                 # Past evaluations list
├── api/
│   ├── models/route.ts              # OpenRouter model list
│   ├── evaluate/route.ts            # POST — create evaluation
│   ├── evaluate/[id]/stream/route.ts# GET SSE — parallel model calls
│   ├── presets/route.ts             # GET / POST presets
│   ├── presets/[id]/route.ts        # DELETE preset
│   └── history/route.ts             # GET history
├── db/
│   ├── client.ts                    # Neon + Drizzle singleton
│   └── schema.ts                    # presets, evaluations, responses
├── lib/
│   ├── env.ts                       # Zod env validation
│   ├── openrouter.ts                # callModel() + fetchModels()
│   ├── blob.ts                      # uploadResponse() / getResponse()
│   └── utils.ts                     # cn() helper
└── components/
    ├── PromptForm.tsx
    ├── ModelPicker.tsx
    ├── ComparisonGrid.tsx
    ├── ResponseCard.tsx
    └── ui/                          # shadcn/ui primitives
scripts/
└── migrate.ts                       # One-shot HTTP migration script
```

---

## ✦ License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built for developers who want answers, not tab management.

</div>
