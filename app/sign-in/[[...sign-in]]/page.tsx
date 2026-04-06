import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Suspense>
        <SignIn fallbackRedirectUrl="/evaluate" />
      </Suspense>
    </div>
  );
}
