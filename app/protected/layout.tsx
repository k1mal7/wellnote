import { AuthButton } from "@/components/auth-button";
import Link from "next/link";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 md:px-5">
          <Link
            href="/protected"
            className="text-lg font-bold text-emerald-800"
          >
            WellNote
          </Link>

          <Suspense>
            <AuthButton />
          </Suspense>
        </div>
      </header>

      <div className="mx-auto w-full min-w-0 max-w-5xl px-4 py-5 md:px-5">
        {children}
      </div>
    </main>
  );
}