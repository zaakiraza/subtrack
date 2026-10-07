import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { adminUserSubscriptionsList, adminUsersList, subscriptionsDelete, subscriptionsUpdate } from "../api";
import { ConfirmModal, Toast } from "../components/AppShell";
import { EmptyState, ErrorMessage, LoadingSpinner } from "../components/Shared";
import { fmtDate, fmtMoney, todayIso } from "../format";
import type { BillingCycle, Subscription, SubscriptionStatus } from "../types";

/** SCREEN-008 — Admin: a user's subscriptions. */

const inputCls =
  "w-full px-3 py-2 bg-[#1C1F26] border border-[#2A2E36] rounded-lg text-xs font-normal text-[#F2F4F7] placeholder-[#8B909A] focus:outline-none focus:border-[#2563EB] transition-colors duration-150";
const labelCls = "text-xs font-medium text-[#8B909A]";

export function AdminUserSubscriptions() {
  const { userId = "" } = useParams();
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [deleting, setDeleting] = useState<Subscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [formError, setFormError] = useState("");

  // edit form state
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [nextRenewalDate, setNextRenewalDate] = useState(todayIso());
  const [category, setCategory] = useState("");
  const [cancellationUrl, setCancellationUrl] = useState("");
  const [status, setStatus] = useState<SubscriptionStatus>("ACTIVE");

  const load = useCallback(async () => {
    setError("");
    setSubs(null);
    try {
      const [list, users] = await Promise.all([adminUserSubscriptionsList(userId), adminUsersList()]);
      setSubs(list);
      setOwnerEmail(users.find((u) => u.id === userId)?.email ?? "user");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load subscriptions.");
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  function openEdit(sub: Subscription) {
    setFormError("");
    setName(sub.name);
    setCost(String(sub.cost));
    setCurrency(sub.currency);
    setBillingCycle(sub.billingCycle);
    setNextRenewalDate(sub.nextRenewalDate.slice(0, 10));
    setCategory(sub.category ?? "");
    setCancellationUrl(sub.cancellationUrl ?? "");
    setStatus(sub.status);
    setEditing(sub);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setFormError("");
    try {
      await subscriptionsUpdate(editing.id, {
        name,
        cost: Number(cost),
        currency,
        billingCycle,
        nextRenewalDate,
        category: category || undefined,
        cancellationUrl: cancellationUrl || undefined,
        status,
      });
      setEditing(null);
      setToast("Subscription saved");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save the subscription.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await subscriptionsDelete(deleting.id);
      setDeleting(null);
      setToast("Subscription deleted");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not delete the subscription.");
      setDeleting(null);
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
  if (!subs) return <LoadingSpinner />;

  return (
    <>
      {toast && <Toast message={toast} onDone={() => setToast("")} />}

      <nav className="flex items-center gap-2 text-xs text-[#8B909A] mb-4">
        <Link to="/admin/users" className="hover:text-[#F2F4F7] transition-colors">
          Admin
        </Link>
        <span className="text-[#2A2E36]">/</span>
        <Link to="/admin/users" className="hover:text-[#F2F4F7] transition-colors">
          Users
        </Link>
        <span className="text-[#2A2E36]">/</span>
        <span className="text-[#F2F4F7] font-medium">{ownerEmail}</span>
      </nav>

      <section className="bg-[#14161A] border border-[#2A2E36] rounded-lg p-5 mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#1C1F26] border border-[#2A2E36] flex items-center justify-center text-[#F2F4F7] font-bold tracking-tight shrink-0">
            {ownerEmail.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#F2F4F7]">Viewing subscriptions of {ownerEmail}</div>
            <div className="text-xs text-[#8B909A]">{subs.length} subscriptions</div>
          </div>
        </div>
        <Link
          to="/admin/users"
          className="px-3 py-1.5 rounded-lg bg-[#1C1F26] border border-[#2A2E36] text-xs font-medium text-[#F2F4F7] hover:bg-[#2A2E36] transition-colors"
        >
          Back to users
        </Link>
      </section>

      <div className="bg-[#14161A] border border-[#2A2E36] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1C1F26] border-b border-[#2A2E36] text-[#8B909A]">
                <th className="py-2.5 px-4 font-medium uppercase tracking-wider text-[11px]">Service / Tool</th>
                <th className="py-2.5 px-3 font-medium uppercase tracking-wider text-[11px]">Category</th>
                <th className="py-2.5 px-3 font-medium uppercase tracking-wider text-[11px]">Billing</th>
                <th className="py-2.5 px-3 font-medium uppercase tracking-wider text-[11px]">Next Renewal</th>
                <th className="py-2.5 px-3 font-medium uppercase tracking-wider text-[11px] text-right">Cost</th>
                <th className="py-2.5 px-3 font-medium uppercase tracking-wider text-[11px]">Status</th>
                <th className="py-2.5 px-4 font-medium uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E36]">
              {subs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 px-4">
                    <EmptyState>User has no subscriptions</EmptyState>
                  </td>
                </tr>
              )}
              {subs.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#1C1F26] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-[#1C1F26] border border-[#2A2E36] flex items-center justify-center font-bold text-xs text-[#F2F4F7] shrink-0">
                        {sub.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="font-medium text-[#F2F4F7]">{sub.name}</div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[#8B909A]">{sub.category ?? "—"}</td>
                  <td className="py-3 px-3 text-[#F2F4F7]">{sub.billingCycle}</td>
                  <td className="py-3 px-3 text-[#8B909A] font-mono">{fmtDate(sub.nextRenewalDate)}</td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-[#F2F4F7]">
                    {fmtMoney(sub.cost, sub.currency)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={
                        "inline-flex items-center px-2 py-0.5 rounded bg-[#1C1F26] border text-[11px] font-medium " +
                        (sub.status === "ACTIVE"
                          ? "text-emerald-400 border-emerald-900/40"
                          : sub.status === "PAUSED"
                            ? "text-amber-400 border-amber-900/40"
                            : "text-[#8B909A] border-[#2A2E36]")
                      }
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(sub)}
                        className="px-2 py-1 rounded bg-[#1C1F26] border border-[#2A2E36] hover:bg-[#2A2E36] text-[11px] text-[#F2F4F7] font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(sub)}
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
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0D10]/75 p-4 overflow-y-auto">
          <form onSubmit={onSave} className="w-full max-w-[560px] bg-[#14161A] border border-[#2A2E36] rounded-lg overflow-hidden my-8">
            <div className="px-6 pt-6 pb-4 border-b border-[#2A2E36]">
              <h2 className="text-base font-semibold text-[#F2F4F7] tracking-tight">Edit subscription</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formError && (
                <div role="alert" className="sm:col-span-2 px-3 py-2 rounded-lg bg-[#1C1F26] border border-red-900/60 text-xs text-red-400">
                  {formError}
                </div>
              )}
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className={labelCls} htmlFor="e-name">Name</label>
                <input id="e-name" className={inputCls} type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} htmlFor="e-cost">Cost</label>
                <input id="e-cost" className={inputCls} type="number" step="0.01" min="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} htmlFor="e-currency">Currency</label>
                <input id="e-currency" className={inputCls} type="text" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} htmlFor="e-cycle">Billing Cycle</label>
                <select id="e-cycle" className={inputCls} value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} htmlFor="e-renewal">Next Renewal Date</label>
                <input id="e-renewal" className={inputCls} type="date" value={nextRenewalDate} onChange={(e) => setNextRenewalDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} htmlFor="e-category">Category</label>
                <input id="e-category" className={inputCls} type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} htmlFor="e-status">Status</label>
                <select id="e-status" className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className={labelCls} htmlFor="e-url">Cancellation URL</label>
                <input id="e-url" className={inputCls} type="url" value={cancellationUrl} onChange={(e) => setCancellationUrl(e.target.value)} />
              </div>
            </div>
            <div className="px-6 py-4 bg-[#14161A] border-t border-[#2A2E36] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="h-9 px-4 rounded-lg bg-[#1C1F26] border border-[#2A2E36] text-xs font-medium text-[#F2F4F7] hover:bg-[#2A2E36] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="h-9 px-4 rounded-lg bg-[#2563EB] text-xs font-medium text-[#F2F4F7] hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {deleting && (
        <ConfirmModal
          title="Delete subscription"
          busy={busy}
          confirmLabel="Delete Subscription"
          onConfirm={() => void onDelete()}
          onCancel={() => setDeleting(null)}
        >
          <p className="text-xs text-[#8B909A] mt-2 leading-relaxed">
            Delete {deleting.name}? This cannot be undone.
          </p>
        </ConfirmModal>
      )}
    </>
  );
}
