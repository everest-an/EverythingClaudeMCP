import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Aurora from "@/components/Aurora";
import EmailLogin from "./EmailLogin";
import LoginButtons from "./LoginButtons";

export const metadata = {
  title: "Sign In",
  description:
    "Sign in to AwesomeContext to get your free API key and start using MCP tools with Claude Code.",
  alternates: { canonical: "/login" },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/dashboard");

  const { callbackUrl } = await searchParams;
  const redirectTo = callbackUrl ?? "/dashboard";

  return (
    <>
      <Aurora />
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-card rounded-2xl p-8 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">
            Sign in to AwesomeContext
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)] mb-8">
            Get your API key and start using MCP tools.
          </p>

          {/* Email magic link */}
          <EmailLogin callbackUrl={redirectTo} />

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[var(--glass-border)]" />
            <span className="text-[12px] text-[var(--text-tertiary)] uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-[var(--glass-border)]" />
          </div>

          {/* OAuth providers */}
          <LoginButtons callbackUrl={redirectTo} />

          <p className="mt-6 text-[12px] text-[var(--text-tertiary)]">
            By signing in, you agree to our terms of service.
          </p>
        </div>
      </div>
    </>
  );
}
