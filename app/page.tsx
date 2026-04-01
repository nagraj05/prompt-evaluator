import { PromptForm } from "@/components/PromptForm";

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-12">
      <h1 className="text-2xl font-semibold mb-8">New Evaluation</h1>
      <PromptForm />
    </div>
  );
}
