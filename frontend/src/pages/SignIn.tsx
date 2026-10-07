import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authLogin } from "../api";
import { setSession } from "../session";

/** SCREEN-001 — Sign In. */

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const guardMessage = (location.state as { message?: string } | null)?.message;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(guardMessage ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authLogin({ email, password });
      setSession({ userId: res.userId, role: res.role, email });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2 bg-[#1C1F26] border border-[#2A2E36] rounded-xl text-sm font-normal text-[#F2F4F7] placeholder-[#8B909A] focus:outline-none focus:border-[#2563EB] transition-colors duration-150";

  return (
    <div className="bg-[#0B0D10] text-[#F2F4F7] font-body antialiased min-h-screen selection:bg-[#2563EB] selection:text-[#F2F4F7]">
      <main className="min-h-screen bg-[#0B0D10] p-6 flex flex-col justify-between">
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-[420px] bg-[#14161A] border border-[#2A2E36] rounded-xl p-8">
            <div className="mb-6">
              <div className="w-9 h-9 rounded-xl bg-[#1C1F26] border border-[#2A2E36] flex items-center justify-center mb-4 text-[#F2F4F7]">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <h1 className="font-headline font-semibold text-2xl text-[#F2F4F7] tracking-tight">Sign in to SubTrack</h1>
              <p className="text-sm text-[#8B909A] mt-1.5 leading-normal">
                Track your subscriptions, renewals, and total spend.
              </p>
            </div>
            {error && (
              <div role="alert" className="mb-4 px-3 py-2 rounded-xl bg-[#1C1F26] border border-red-900/60 text-xs text-red-400">
                {error}
              </div>
            )}
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="block text-xs font-medium text-[#8B909A] mb-1.5" htmlFor="work-email">
                  Email
                </label>
                <input
                  className={inputCls}
                  id="work-email"
                  placeholder="name@company.com"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  disabled={submitting}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#8B909A]" htmlFor="password">
                    Password
                  </label>
                  <Link className="text-xs font-medium text-[#8B909A] hover:text-[#F2F4F7] transition-colors duration-150" to="/forgot-password">
                    Forgot password?
                  </Link>
                </div>
                <input
                  className={inputCls}
                  id="password"
                  placeholder="Enter your password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  disabled={submitting}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="pt-2">
                <button
                  className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1d4ed8] text-[#F2F4F7] font-medium text-sm rounded-xl transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-60"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  <span>{submitting ? "Signing In…" : "Sign In"}</span>
                  {!submitting && <span className="material-symbols-outlined text-[16px]">arrow_forward</span>}
                </button>
              </div>
            </form>
            <div className="mt-6 pt-5 border-t border-[#2A2E36] text-center">
              <p className="text-xs text-[#8B909A] leading-relaxed">
                New to SubTrack?{" "}
                <Link className="text-[#F2F4F7] underline hover:text-[#2563EB] transition-colors duration-150" to="/register">
                  Create an account
                </Link>
                .
              </p>
              <p className="text-[11px] text-[#8B909A] mt-2">
                Demo: demo@subtrack.local / demo12345 · admin@subtrack.local / admin12345
              </p>
            </div>
          </div>
        </div>
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between text-xs text-[#8B909A] pt-4 border-t border-[#1C1F26]">
          <div className="flex items-center gap-4">
            <span>SubTrack v1.0.0</span>
            <span className="w-1 h-1 rounded-full bg-[#2A2E36]"></span>
            <span>Operational</span>
          </div>
          <div className="flex items-center gap-6">
            <a className="hover:text-[#F2F4F7] transition-colors duration-150" href="#security">Security Policy</a>
            <a className="hover:text-[#F2F4F7] transition-colors duration-150 flex items-center gap-1.5" href="#status">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
              <span>Systems Active</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
