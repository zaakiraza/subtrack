import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { authForgotPassword, authResetPassword } from "../api";

/** SCREEN-003 — Forgot / Reset Password. */

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetOk, setResetOk] = useState(false);

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    setRequesting(true);
    try {
      await authForgotPassword({ email });
      setSent(true);
    } finally {
      setRequesting(false);
    }
  }

  async function onConfirm(e: FormEvent) {
    e.preventDefault();
    setTokenError("");
    setPasswordError("");
    if (!token.trim()) setTokenError("Reset token is required.");
    if (newPassword.length < 8) setPasswordError("Password must be at least 8 characters.");
    if (!token.trim() || newPassword.length < 8) return;
    setResetting(true);
    try {
      await authResetPassword({ token, newPassword });
      setResetOk(true);
    } catch (err) {
      setTokenError(err instanceof Error ? err.message : "Invalid or expired token.");
    } finally {
      setResetting(false);
    }
  }

  const inputCls =
    "h-9 w-full px-3 bg-[#1C1F26] border border-[#2A2E36] rounded-lg text-xs text-[#F2F4F7] placeholder-[#8B909A] focus:outline-none focus:border-[#2563EB]";

  return (
    <div className="bg-[#0B0D10] text-[#F2F4F7] font-body antialiased min-h-screen selection:bg-[#2563EB] selection:text-[#F2F4F7]">
      <main className="min-h-screen bg-[#0B0D10] p-6 flex flex-col justify-center items-center">
        <div className="w-full max-w-[440px] bg-[#14161A] border border-[#2A2E36] rounded-xl p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1C1F26] border border-[#2A2E36] flex items-center justify-center text-[#F2F4F7]">
              <span className="material-symbols-outlined text-[20px]">lock_reset</span>
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-semibold font-headline text-[#F2F4F7] tracking-tight">Reset your password</h1>
              <p className="text-xs text-[#8B909A] leading-relaxed">
                Enter your account email to receive a password reset link and recovery instructions.
              </p>
            </div>
          </div>

          {resetOk ? (
            <div className="bg-[#1C1F26] border border-emerald-900/60 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-emerald-400">Your password has been reset. You can now sign in.</p>
              <Link to="/signin" className="text-xs font-medium text-[#F2F4F7] underline hover:text-[#2563EB]">
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              {!sent ? (
                <form className="flex flex-col gap-5" onSubmit={onRequest}>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-medium text-[#F2F4F7]" htmlFor="email">
                        Email address
                      </label>
                      <span className="text-[#8B909A] text-[11px]">Required</span>
                    </div>
                    <input
                      className={inputCls}
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      disabled={requesting}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <p className="text-[11px] text-[#8B909A] leading-tight">Instructions will be sent to this email address.</p>
                  </div>
                  <button
                    className="h-9 w-full bg-[#2563EB] text-[#F2F4F7] rounded-lg text-xs font-medium hover:bg-[#1d4ed8] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    type="submit"
                    disabled={requesting}
                  >
                    {requesting && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                    Send Reset Link
                  </button>
                </form>
              ) : (
                <div className="bg-[#1C1F26] border border-[#2A2E36] rounded-lg p-3.5 flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-400 text-[18px] shrink-0 mt-0.5">mark_email_read</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-[#F2F4F7] leading-tight">
                      If an account exists, a reset link has been sent.
                    </span>
                    <p className="text-[11px] text-[#8B909A] leading-relaxed">
                      Paste the token from the email below to set a new password.
                    </p>
                  </div>
                </div>
              )}

              {sent && (
                <form className="flex flex-col gap-4 border-t border-[#2A2E36] pt-5" onSubmit={onConfirm}>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#F2F4F7]" htmlFor="token">
                      Reset Token
                    </label>
                    <input
                      className={inputCls}
                      id="token"
                      type="text"
                      required
                      value={token}
                      disabled={resetting}
                      onChange={(e) => setToken(e.target.value)}
                    />
                    {tokenError && <p className="text-[11px] text-red-400">{tokenError}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-medium text-[#F2F4F7]" htmlFor="newPassword">
                        New Password
                      </label>
                      <span className="text-[#8B909A] text-[11px]">Minimum 8 characters</span>
                    </div>
                    <input
                      className={inputCls}
                      id="newPassword"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={newPassword}
                      disabled={resetting}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    {passwordError && <p className="text-[11px] text-red-400">{passwordError}</p>}
                  </div>
                  <button
                    className="h-9 w-full bg-[#2563EB] text-[#F2F4F7] rounded-lg text-xs font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-60"
                    type="submit"
                    disabled={resetting}
                  >
                    {resetting ? "Resetting…" : "Reset Password"}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="flex items-center justify-center pt-1 border-t border-[#2A2E36]">
            <Link to="/signin" className="text-xs font-medium text-[#8B909A] hover:text-[#F2F4F7] transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              <span>Return to Sign In</span>
            </Link>
          </div>
        </div>
        <div className="mt-8 text-center flex items-center gap-4 text-xs text-[#8B909A]">
          <span>SubTrack</span>
          <span>•</span>
          <span>End-to-End Encrypted Session</span>
          <span>•</span>
          <span>SOC-2 Type II Certified</span>
        </div>
      </main>
    </div>
  );
}
