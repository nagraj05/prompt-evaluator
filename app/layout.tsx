import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
        <header className="border-b border-neutral-200 dark:border-neutral-800">
          <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link href="/" className="font-semibold text-sm tracking-tight">
              Prompt Evaluator
            </Link>
            <Link
              href="/"
              className="text-sm text-neutral-500 hover:text-foreground transition-colors"
            >
              New Evaluation
            </Link>
            <Link
              href="/history"
              className="text-sm text-neutral-500 hover:text-foreground transition-colors"
            >
              History
            </Link>
          </nav>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
