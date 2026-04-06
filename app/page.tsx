"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/evaluate");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || isSignedIn) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Prompt Evaluator</h1>
        <p className="text-muted-foreground max-w-sm">
          Compare LLM responses across models in real time.
        </p>
      </div>
      <SignInButton mode="redirect" fallbackRedirectUrl="/evaluate">
        <Button size="lg">Sign in</Button>
      </SignInButton>
    </div>
  );
}
