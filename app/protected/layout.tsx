import { AuthButton } from "@/components/auth-button";
import { Suspense } from "react";
import ProtectedNavigation from "./protected-navigation";
import { createClient } from "@/lib/supabase/server";

async function WorkspaceNavigation() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const metadata = !error && user ? user.user_metadata : {};
  const name = [metadata.first_name, metadata.full_name, metadata.name, metadata.display_name]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0)
    ?.trim();

  return <ProtectedNavigation workspaceLabel={name ? `${name}’s workspace` : "Your workspace"} />;
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:pl-60">
      <Suspense><WorkspaceNavigation /></Suspense>
      <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-3 text-sm [&>div]:flex-wrap">
          <Suspense><AuthButton /></Suspense>
        </div>
      </header>
      <div className="mx-auto w-full min-w-0 max-w-7xl">{children}</div>
    </div>
  );
}
