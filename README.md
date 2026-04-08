# 🚀 Prompt Evaluator

**Prompt Evaluator** is a high-performance web application designed for developers and researchers to compare LLM responses side-by-side. Submitting a prompt triggers parallel calls to a **base model** and multiple **comparison models** via OpenRouter, streaming results in a real-time comparison grid.

---

## ✨ Key Features

- **Secure Access**: Integrated with **Clerk** for user authentication and protected routes.
- **Parallel Evaluation**: Compare responses from N models simultaneously against a reference base model.
- **Real-time Streaming**: Watch responses arrive via Server-Sent Events (SSE) as each model completes its task.
- **Model Presets**: Save and load custom groups of base/comparison models for reproducible testing.
- **Detailed Analytics**: Track latency (ms), token count (input/output), and estimated cost per model.
- **History Tracking**: View, re-open, and clone past evaluations stored in Neon DB.
- **Deep Response Archiving**: Full response JSON payloads are archived in Vercel Blob for long-term audit.

---

## 🛠️ Tech Stack

### Core
- **Runtime**: [Bun](https://bun.sh/) (Native TS execution, fast package management)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components, SSE)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Authentication**: [Clerk](https://clerk.com/)

### Data & AI
- **Database**: [Neon](https://neon.tech/) (Serverless Postgres)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Large Data Storage**: [Vercel Blob](https://vercel.com/storage/blob)
- **AI Gateway**: [OpenRouter](https://openrouter.ai/) (Access to 300+ models via a single API key)

---

## 🚀 Getting Started

### Prerequisites

- **Bun** installed on your system.
  - **Windows**: `powershell -c "irm bun.sh/install.ps1 | iex"`
  - **macOS/Linux**: `curl -fsSL https://bun.sh/install | bash`
- An **OpenRouter API Key**.
- A **Clerk** account and project keys.
- A **Neon Database** instance.
- A **Vercel Blob** storage bucket.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nagraj05/prompt-evaluator.git
   cd prompt-evaluator
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   # Neon Postgres
   DATABASE_URL=postgres://...

   # OpenRouter
   OPENROUTER_API_KEY=sk-or-...

   # Vercel Blob Store
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/evaluate
   ```

4. Run database migrations:
   ```bash
   # Using the custom migration script (works around WSL/Drizzle-kit bugs)
   bun --env-file=.env.local scripts/migrate.ts
   ```

5. Start the development server:
   ```bash
   bun dev
   ```

Open [http://localhost:3000](http://localhost:3000) to start evaluating.

---

## 📂 Project Structure

```text
app/
├── api/             # SSE streaming, model fetch, and evaluation routes
├── components/      # PromptForm, ModelPicker, and Grid components
│   └── ui/          # Generic shadcn/ui primitives
├── db/              # Drizzle schema and Neon client
├── lib/             # OpenRouter, Blob, and Zod env utilities
├── history/         # Past evaluation listing
└── evaluate/        # New evaluation entry point
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
