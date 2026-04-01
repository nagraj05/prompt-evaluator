import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prompt Evaluator",
  description: "Compare LLM responses across models in real time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
          <nav className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
            <Link href="/" className="font-semibold text-sm tracking-tight">
              Prompt Evaluator
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-5">
              <Link
                href="/"
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
          </nav>
          <Separator />
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
