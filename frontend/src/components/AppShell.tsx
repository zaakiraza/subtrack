import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authLogout } from "../api";
import { getSession, clearSession } from "../session";

/** Dark shell from the approved wireframes: fixed sidebar + fixed header. */

export interface NavItem {
  label: string;
  icon: string;
  to: string;
  adminOnly?: boolean;
}

const navClass = (active: boolean) =>
  "flex items-center gap-3 px-3 py-2 rounded-xl " +
  (active
    ? "bg-[#2563EB] text-[#F2F4F7] font-medium text-sm transition-colors"
    : "text-[#8B909A] hover:text-[#F2F4F7] hover:bg-[#1C1F26] transition-colors text-sm font-medium");

export function Sidebar() {
  const { pathname } = useLocation();
  const session = getSession();
  const isAdmin = session?.role === "SUPERADMIN";
  const items: NavItem[] = [
    { label: "Dashboard", icon: "dashboard", to: "/dashboard" },
    { label: "Subscriptions", icon: "receipt_long", to: "/dashboard" },
    { label: "Admin", icon: "admin_panel_settings", to: "/admin/users", adminOnly: true },
  ];
  return (
    <aside className="fixed top-0 left-0 h-screen w-[240px] flex flex-col z-30 border-r border-[#2A2E36] bg-[#14161A]">
      <div className="w-[240px] h-full flex flex-col justify-between p-4 bg-[#14161A]">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-[#F2F4F7] font-semibold text-sm shadow-none">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline text-base font-semibold tracking-tight text-[#F2F4F7]">SubTrack</span>
              <span className="text-[11px] font-medium text-[#8B909A] leading-tight">Production Tool</span>
            </div>
          </div>
          <div className="px-1">
            <a
              href="/subscriptions/form"
              className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-600 text-[#F2F4F7] font-medium text-xs py-2 px-3 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">add</span>
              <span>New Subscription</span>
            </a>
          </div>
          <nav className="flex flex-col gap-1">
            {items
              .filter((i) => !i.adminOnly || isAdmin)
              .map((i) => (
                <a key={i.label} href={i.to} className={navClass(pathname.startsWith(i.to))}>
                  <span className="material-symbols-outlined">{i.icon}</span>
                  <span>{i.label}</span>
                </a>
              ))}
          </nav>
        </div>
        <div className="flex flex-col gap-1 pt-4 border-t border-[#2A2E36]">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-xl text-[#8B909A] hover:text-[#F2F4F7] hover:bg-[#1C1F26] transition-colors text-sm font-medium">
            <span className="material-symbols-outlined">help</span>
            <span>Support</span>
          </a>
          <div className="mt-2 p-2.5 rounded-lg bg-[#1C1F26] border border-[#2A2E36] flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-md bg-[#2A2E36] flex items-center justify-center text-xs font-semibold text-[#F2F4F7]">
                ST
              </div>
              <div className="truncate text-xs">
                <p className="font-medium text-[#F2F4F7] truncate leading-none">{session?.email ?? "Signed in"}</p>
                <p className="text-[10px] text-[#8B909A] leading-tight mt-0.5">
                  {session?.role === "SUPERADMIN" ? "Superadmin" : "User"}
                </p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Session active"></span>
          </div>
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}

export function SignOutButton() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="flex items-center gap-3 px-3 py-2 rounded-xl text-[#8B909A] hover:text-[#F2F4F7] hover:bg-[#1C1F26] transition-colors text-sm font-medium disabled:opacity-50"
      onClick={async () => {
        setBusy(true);
        try {
          await authLogout();
        } catch {
          /* session may already be gone */
        }
        clearSession();
        navigate("/signin", { replace: true });
      }}
    >
      <span className="material-symbols-outlined">logout</span>
      <span>{busy ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}

export function Header() {
  const session = getSession();
  return (
    <header className="fixed top-0 left-[240px] right-0 h-16 z-20 bg-[#14161A] border-b border-[#2A2E36] flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8B909A]">search</span>
          <input
            className="w-full bg-[#1C1F26] border border-[#2A2E36] text-[#F2F4F7] placeholder-[#8B909A] text-xs rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-[#2563EB] focus:ring-0 transition-colors"
            placeholder="Search subscriptions..."
            type="text"
            aria-label="Search subscriptions"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <a href="/dashboard" className="text-xs font-medium text-[#8B909A] hover:text-[#F2F4F7] px-2 py-1.5 transition-colors">
          Help
        </a>
        <button
          type="button"
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[#8B909A] hover:text-[#F2F4F7] hover:bg-[#1C1F26] border border-transparent hover:border-[#2A2E36] transition-colors"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
        </button>
        <div className="h-4 w-[1px] bg-[#2A2E36] mx-1"></div>
        <a
          href="/subscriptions/form"
          className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-600 text-[#F2F4F7] font-medium text-xs py-1.5 px-3 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          <span>New Subscription</span>
        </a>
        <div className="flex items-center gap-2 pl-2">
          <div className="w-8 h-8 rounded-lg bg-[#1C1F26] border border-[#2A2E36] flex items-center justify-center text-xs font-medium text-[#F2F4F7]">
            ST
          </div>
          <span className="hidden sm:block text-xs text-[#8B909A]">{session?.email}</span>
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#0B0D10] text-[#F2F4F7] antialiased overflow-x-hidden selection:bg-[#2563EB] selection:text-white min-h-screen">
      <Sidebar />
      <Header />
      <main className="ml-[240px] pt-16 min-h-screen bg-[#0B0D10] text-[#F2F4F7]">
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
}

export function Toast({ message, tone = "success", onDone }: { message: string; tone?: "success" | "error"; onDone?: () => void }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => {
      setShow(false);
      onDone?.();
    }, 3000);
    return () => clearTimeout(t);
  }, [message]);
  if (!show || !message) return null;
  return (
    <div
      role="status"
      className={
        "fixed bottom-6 right-6 z-[60] px-4 py-2.5 rounded-lg text-xs font-medium border shadow-lg " +
        (tone === "success"
          ? "bg-[#1C1F26] border-emerald-900/50 text-emerald-400"
          : "bg-[#1C1F26] border-red-900/50 text-red-400")
      }
    >
      {message}
    </div>
  );
}

export function ConfirmModal({
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0D10]/75 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={(e) => e.key === "Escape" && !busy && onCancel()}
        className="w-full max-w-[540px] bg-[#14161A] border border-[#2A2E36] rounded-lg overflow-hidden flex flex-col"
      >
        <div className="px-6 pt-6 pb-4 border-b border-[#2A2E36]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F2F4F7]">warning</span>
            <h2 className="text-base font-semibold text-[#F2F4F7] tracking-tight">{title}</h2>
          </div>
          <p className="text-xs text-[#8B909A] mt-2 leading-relaxed">{children}</p>
        </div>
        <div className="px-6 py-4 bg-[#14161A] border-t border-[#2A2E36] flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            className="h-9 px-4 rounded-lg bg-[#1C1F26] border border-[#2A2E36] text-xs font-medium text-[#F2F4F7] hover:bg-[#2A2E36] transition-colors duration-150 disabled:opacity-50"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            className="h-9 px-4 rounded-lg bg-[#2563EB] text-xs font-medium text-[#F2F4F7] hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50 flex items-center gap-2"
            onClick={onConfirm}
          >
            {busy && <span className="w-3 h-3 border-2 border-[#F2F4F7]/40 border-t-[#F2F4F7] rounded-full animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
