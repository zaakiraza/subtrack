import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authRegister } from "../api";
import { setSession } from "../session";

/** SCREEN-002 — Register. */

export function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const fe: { email?: string; password?: string } = {};
    if (!email.trim()) fe.email = "Email is required.";
    if (!password) fe.password = "Password is required.";
    else if (password.length < 8) fe.password = "Password must be at least 8 characters.";
    setFieldErrors(fe);
    if (Object.keys(fe).length) return;
    setSubmitting(true);
    try {
      const res = await authRegister({ email, password });
      setSession({ userId: res.userId, role: "USER", email: res.email });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full bg-[#1C1F26] border border-[#2A2E36] rounded-xl text-xs text-[#F2F4F7] px-3 py-2.5 focus:outline-none focus:border-[#2563EB] placeholder-[#8B909A]";

  return (
    <div className="bg-[#0B0D10] text-[#F2F4F7] antialiased min-h-screen">
      <main className="min-h-screen bg-[#0B0D10]">
        <div className="p-6 max-w-3xl mx-auto py-12">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-[#F2F4F7] tracking-tight">Create SubTrack account</h1>
            <p className="text-xs text-[#8B909A] mt-1">
              Track renewals and total spend. Your subscriptions stay private to your account.
            </p>
          </div>
          <section className="bg-[#14161A] border border-[#2A2E36] rounded-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#2A2E36] mb-5">
              <div>
                <h2 className="text-sm font-semibold text-[#F2F4F7]">Account Details</h2>
                <p className="text-xs text-[#8B909A]">Choose the email and password you will sign in with.</p>
              </div>
              <span className="px-2 py-0.5 text-[11px] font-medium bg-[#1C1F26] border border-[#2A2E36] text-[#8B909A] rounded-lg">
                Step 1 of 1
              </span>
            </div>
            {error && (
              <div role="alert" className="mb-4 px-3 py-2 rounded-xl bg-[#1C1F26] border border-red-900/60 text-xs text-red-400">
                {error}
              </div>
            )}
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="block text-xs font-medium text-[#8B909A] mb-1.5" htmlFor="workEmail">
                  Email
                </label>
                <input
                  className={inputCls}
                  id="workEmail"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  disabled={submitting}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {fieldErrors.email && <p className="mt-1 text-[11px] text-red-400">{fieldErrors.email}</p>}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[#8B909A]" htmlFor="password">
                    Password
                  </label>
                  <span className="text-[11px] text-[#8B909A]">Minimum 8 characters</span>
                </div>
                <input
                  className={inputCls}
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  disabled={submitting}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="mt-2 flex items-center gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={
                        "h-1 flex-1 rounded-full " +
                        (password.length >= 8 && (i === 0 || password.length >= 12 + i * 4) ? "bg-[#2563EB]" : "bg-[#2A2E36]")
                      }
                    ></div>
                  ))}
                </div>
                {fieldErrors.password && <p className="mt-1 text-[11px] text-red-400">{fieldErrors.password}</p>}
              </div>
              <div className="pt-2">
                <button
                  className="w-full bg-[#2563EB] hover:bg-blue-700 text-[#F2F4F7] font-headline text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  Create Account
                </button>
              </div>
              <div className="pt-3 border-t border-[#2A2E36] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#8B909A] gap-2">
                <span>By creating an account, you agree to the Terms of Service.</span>
                <div className="flex items-center gap-1">
                  <span>Already have an account?</span>
                  <Link className="text-[#F2F4F7] hover:underline font-medium" to="/signin">
                    Sign in
                  </Link>
                </div>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
