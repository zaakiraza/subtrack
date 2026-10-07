import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { adminUsersCreate, adminUsersDelete, adminUsersList, adminUsersUpdate } from "../api";
import { ConfirmModal, Toast } from "../components/AppShell";
import { EmptyState, ErrorMessage, LoadingSpinner } from "../components/Shared";
import { fmtDate } from "../format";
import { getSession } from "../session";
import type { AdminUserSummary } from "../types";

/** SCREEN-007 — Admin: Users. */

const inputCls =
  "w-full px-3 py-2 bg-[#1C1F26] border border-[#2A2E36] rounded-xl text-sm font-normal text-[#F2F4F7] placeholder-[#8B909A] focus:outline-none focus:border-[#2563EB] transition-colors duration-150";

type Dialog =
  | { kind: "create" }
  | { kind: "status"; user: AdminUserSummary }
  | { kind: "delete"; user: AdminUserSummary }
  | null;

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUserSummary[] | null>(null);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [actionError, setActionError] = useState("");
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [formError, setFormError] = useState("");

  const session = getSession();
  const me = session?.userId ?? "";

  const load = useCallback(async () => {
    setError("");
    setUsers(null);
    try {
      setUsers(await adminUsersList());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!email.trim()) return setFormError("Email is required.");
    if (tempPassword.length < 8) return setFormError("Temporary password must be at least 8 characters.");
    setBusy(true);
    try {
      await adminUsersCreate({ email, temporaryPassword: tempPassword });
      setDialog(null);
      setEmail("");
      setTempPassword("");
      setToast("User created");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create the user.");
    } finally {
      setBusy(false);
    }
  }

  async function onToggleStatus(user: AdminUserSummary) {
    setBusy(true);
    try {
      await adminUsersUpdate(user.id, { status: user.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE" });
      setDialog(null);
      setToast(user.status === "ACTIVE" ? "User deactivated" : "User reactivated");
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update the user.");
      setDialog(null);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(user: AdminUserSummary) {
    setBusy(true);
    try {
      await adminUsersDelete(user.id);
      setDialog(null);
      setToast("User deleted");
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete the user.");
      setDialog(null);
    } finally {
      setBusy(false);
    }
  }

  if (error)
    return (
      <div className="space-y-4">
        <ErrorMessage>{error}</ErrorMessage>
        <button
          type="button"
          onClick={() => void load()}
          className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-[#F2F4F7] text-xs font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  if (!users) return <LoadingSpinner />;

  return (
    <>
      {toast && <Toast message={toast} onDone={() => setToast("")} />}
      {actionError && (
        <div role="alert" className="mb-4 px-3 py-2 rounded-lg bg-[#1C1F26] border border-red-900/60 text-xs text-red-400">
          {actionError}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-[#8B909A] font-medium">
          <span className="hover:text-[#F2F4F7] cursor-pointer">Admin</span>
          <span className="text-[#2A2E36]">/</span>
          <span className="text-[#F2F4F7]">Users</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#F2F4F7]">Users &amp; Access Management</h1>
            <p className="text-xs text-[#8B909A] mt-1 max-w-2xl leading-relaxed">
              Manage user accounts, deactivation, and access to the tracker.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setDialog({ kind: "create" })}
              className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-[#F2F4F7] px-4 py-2 rounded-xl text-xs font-medium transition-colors"
            >
              <span className="material-symbols-outlined">person_add</span> + Invite User
            </button>
          </div>
        </div>
      </div>

      <section className="bg-[#14161A] border border-[#2A2E36] rounded-xl flex flex-col overflow-hidden mt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2A2E36] bg-[#14161A] text-[11px] font-semibold uppercase tracking-wider text-[#8B909A]">
                <th className="py-3 px-4" scope="col">User</th>
                <th className="py-3 px-4" scope="col">Role</th>
                <th className="py-3 px-4" scope="col">Status</th>
                <th className="py-3 px-4" scope="col">Subscriptions</th>
                <th className="py-3 px-4" scope="col">Created</th>
                <th className="py-3 px-4 text-right" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E36] text-xs">
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 px-4">
                    <EmptyState>No users found</EmptyState>
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#1C1F26] transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1C1F26] border border-[#2A2E36] flex items-center justify-center font-medium text-xs text-[#F2F4F7]">
                        {u.email.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-[#F2F4F7] group-hover:text-white">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#1C1F26] text-[#F2F4F7] border border-[#2A2E36]">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#1C1F26] border " +
                        (u.status === "ACTIVE" ? "text-emerald-400 border-emerald-900/40" : "text-red-400 border-red-900/40")
                      }
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#F2F4F7] font-medium">{u.subscriptionCount}</td>
                  <td className="py-3.5 px-4 text-[#8B909A] font-mono">{fmtDate(u.createdAt)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/admin/users/${u.id}/subscriptions`}
                        className="px-2 py-1 rounded bg-[#1C1F26] border border-[#2A2E36] hover:bg-[#2A2E36] text-[11px] text-[#F2F4F7] font-medium transition-colors"
                      >
                        View subscriptions
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDialog({ kind: "status", user: u })}
                        className="px-2 py-1 rounded bg-[#1C1F26] border border-[#2A2E36] hover:bg-[#2A2E36] text-[11px] text-[#F2F4F7] font-medium transition-colors"
                      >
                        {u.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDialog({ kind: "delete", user: u })}
                        className="px-2 py-1 rounded bg-[#1C1F26] border border-[#2A2E36] hover:bg-[#2A2E36] text-[11px] text-red-400 font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {dialog?.kind === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0D10]/75 p-4">
          <form
            onSubmit={onCreate}
            className="w-full max-w-[440px] bg-[#14161A] border border-[#2A2E36] rounded-lg overflow-hidden"
          >
            <div className="px-6 pt-6 pb-4 border-b border-[#2A2E36]">
              <h2 className="text-base font-semibold text-[#F2F4F7] tracking-tight">Create user</h2>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div role="alert" className="px-3 py-2 rounded-lg bg-[#1C1F26] border border-red-900/60 text-xs text-red-400">
                  {formError}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#8B909A]" htmlFor="u-email">
                  Email
                </label>
                <input id="u-email" className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#8B909A]" htmlFor="u-pass">
                  Temporary Password
                </label>
                <input
                  id="u-pass"
                  className={inputCls}
                  type="password"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-[#14161A] border-t border-[#2A2E36] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="h-9 px-4 rounded-lg bg-[#1C1F26] border border-[#2A2E36] text-xs font-medium text-[#F2F4F7] hover:bg-[#2A2E36] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="h-9 px-4 rounded-lg bg-[#2563EB] text-xs font-medium text-[#F2F4F7] hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {dialog?.kind === "status" && (
        <ConfirmModal
          title={dialog.user.status === "ACTIVE" ? "Deactivate user" : "Reactivate user"}
          busy={busy}
          confirmLabel={dialog.user.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
          onConfirm={() => void onToggleStatus(dialog.user)}
          onCancel={() => setDialog(null)}
        >
          <p className="text-xs text-[#8B909A] mt-2 leading-relaxed">
            {dialog.user.status === "ACTIVE"
              ? `${dialog.user.email} will no longer be able to sign in. Their data is retained.`
              : `${dialog.user.email} will be able to sign in again.`}
          </p>
        </ConfirmModal>
      )}

      {dialog?.kind === "delete" && (
        <ConfirmModal
          title="Delete user"
          busy={busy}
          confirmLabel="Delete User"
          onConfirm={() => void onDelete(dialog.user)}
          onCancel={() => setDialog(null)}
        >
          <p className="text-xs text-[#8B909A] mt-2 leading-relaxed">
            {dialog.user.id === me
              ? "You cannot delete this account."
              : `Delete ${dialog.user.email} and all their subscriptions? This cannot be undone.`}
          </p>
        </ConfirmModal>
      )}
    </>
  );
}
