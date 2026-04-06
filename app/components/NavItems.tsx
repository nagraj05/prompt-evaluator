"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Separator } from "@/components/ui/separator";

export function NavItems() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded || !isSignedIn) return null;

  return (
    <>
      <Separator orientation="vertical" className="h-4" />
      <div className="flex items-center gap-5">
        <Link
          href="/evaluate"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          New Evaluation
        </Link>
        <Link
          href="/history"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          History
        </Link>
      </div>
      <div className="ml-auto">
        <UserButton />
      </div>
    </>
  );
}
