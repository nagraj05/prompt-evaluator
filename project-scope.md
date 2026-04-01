# Project Scope — Prompt Evaluator

## Problem Statement
Developers and researchers need a way to compare how different LLMs respond to the same prompt — against a chosen baseline model — without manually calling each model and aggregating results.

## Core Goal
A web app where a user submits a prompt, picks a **base model** and **comparison models**, then sees all responses in a grid with the base model highlighted as the reference point.

---

## Decisions Log
| Question | Decision |
|---|---|
| Authentication | None (open, single-user) |
| Model selection | User picks 1 base model + N comparison models |
| Model presets | Yes — save/load named model sets |
| Layout | Grid (all responses visible simultaneously) |
| Auto-scoring / ranking | No |
| Cost cap | No |
| API key | Single server-side env var (`OPENROUTER_API_KEY`) |
| Response storage | Final completed text only (no token-level history) |
| Deployment | Deferred |

---

## In Scope

### Prompt Submission
- Textarea for the user prompt
- Optional system prompt override
- Model picker:
  - Step 1 — select 1 **base model** (highlighted as reference)
  - Step 2 — select N **comparison models** from the full OpenRouter list
  - Save current selection as a named preset
  - Load a saved preset to restore selection
- Submit triggers parallel calls to base + comparison models

### Comparison Grid View
- Grid layout: base model card pinned / visually distinct, comparison cards alongside
- Per card: model name, provider badge, final response text, latency (ms), token count, estimated cost
- Responses stream in as each model completes (SSE)
- Skeleton/loading state per card until response arrives

### Model Management
- Live model list fetched from OpenRouter (`GET /models`), cached 6h
- Filter by: provider, context window, cost tier
- Select all / select none per filter group
- Named presets: create, rename, delete, load

### History
- Past evaluations listed: prompt preview, base model, comparison model count, date, total cost
- Click to re-open any past evaluation in the grid view
- Re-run: clone an evaluation (same prompt, edit models if desired)

### Persistence
- Evaluation metadata + final response text stored in Neon DB
- Raw full response JSON payloads stored in Neon Blob Store

---

## Out of Scope (v1)
- User accounts / authentication
- Multi-turn / chat mode
- Image or multimodal prompts
- Auto-scoring or judge model ranking
- Per-evaluation cost caps
- Custom API keys per user
- Fine-tuned model support
- Deployment pipeline

---

## Constraints
- `OPENROUTER_API_KEY` must be set server-side — never exposed to client
- Vercel Blob: 500 MB free tier, public blobs (URLs are unguessable but technically public)
- Next.js 16 App Router only
- Bun as package manager and runtime
