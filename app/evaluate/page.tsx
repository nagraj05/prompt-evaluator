import { PromptForm } from "@/components/PromptForm";

export default function EvaluatePage() {
  return (
    <div className="max-w-3xl mx-auto w-full px-6 py-12 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Evaluation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compare a prompt across multiple models side-by-side.
        </p>
      </div>
      <PromptForm />
    </div>
  );
}
