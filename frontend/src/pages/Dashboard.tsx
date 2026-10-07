import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { subscriptionsList } from "../api";
import { EmptyState, ErrorMessage, LoadingSpinner } from "../components/Shared";
import { daysUntil, fmtDate, fmtMoney, monthlyEquivalent } from "../format";
import type { Subscription, SubscriptionStatus } from "../types";

/** SCREEN-004 — Dashboard: totals, sorted list, upcoming renewals, filters. */

type Filter = "all" | "active" | "paused" | "cancelled";

export function Dashboard() {
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    setError("");
    setSubs(null);
    try {
      setSubs(await subscriptionsList());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your subscriptions.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(
    () => (subs ? [...subs].sort((a, b) => a.nextRenewalDate.localeCompare(b.nextRenewalDate)) : []),
    [subs]
  );
  const visible = useMemo(
    () => (filter === "all" ? sorted : sorted.filter((s) => s.status === filter.toUpperCase())),
    [sorted, filter]
  );
  const monthly = useMemo(
    () =>
      sorted
        .filter((s) => s.status === "ACTIVE")
        .reduce((sum, s) => sum + monthlyEquivalent(s.cost, s.billingCycle), 0),
    [sorted]
  );
  const upcoming = useMemo(
    () =>
      sorted.filter((s) => {
        const d = daysUntil(s.nextRenewalDate);
        return s.status === "ACTIVE" && d >= 0 && d <= 30;
      }),
    [sorted]
  );

  if (error)
    return (
      <div className="space-y-4">
        <ErrorMessage>{error || "Could not load your subscriptions."}</ErrorMessage>
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

  const filterBtn = (f: Filter, label: string) => (
    <button
      key={f}
      type="button"
      onClick={() => setFilter(f)}
      className={
        "px-2.5 py-1 text-xs font-medium rounded bg-[#1C1F26] border transition-colors " +
        (filter === f
          ? "bg-[#2563EB] text-[#F2F4F7] border-[#2563EB]"
          : "text-[#F2F4F7] border-[#2A2E36] hover:bg-[#2A2E36]")
      }
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#F2F4F7] font-headline">Dashboard</h1>
          <p className="text-xs text-[#8B909A] mt-0.5">Overview of your subscriptions, upcoming renewals, and spend.</p>
        </div>
        <a
          href="/subscriptions/form"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-[#F2F4F7] font-medium text-xs transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          <span>Add Subscription</span>
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1C1F26] border border-[#2A2E36] rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#8B909A]">Monthly Spend</span>
            <span className="material-symbols-outlined text-[#8B909A]">payments</span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#F2F4F7] font-headline">{fmtMoney(monthly)}</div>
          <div className="mt-3 pt-2.5 border-t border-[#2A2E36] flex items-center justify-between text-[11px] text-[#8B909A]">
            <span>Normalized (yearly/12, quarterly/3)</span>
          </div>
        </div>
        <div className="bg-[#1C1F26] border border-[#2A2E36] rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#8B909A]">Yearly Spend</span>
            <span className="material-symbols-outlined text-[#8B909A]">monitoring</span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#F2F4F7] font-headline">{fmtMoney(monthly * 12)}</div>
          <div className="mt-3 pt-2.5 border-t border-[#2A2E36] flex items-center justify-between text-[11px] text-[#8B909A]">
            <span>Monthly total × 12</span>
          </div>
        </div>
        <div className="bg-[#1C1F26] border border-[#2A2E36] rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#8B909A]">Upcoming Renewals (30d)</span>
            <span className="material-symbols-outlined text-[#8B909A]">event_repeat</span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#F2F4F7] font-headline">{upcoming.length}</div>
          <div className="mt-3 pt-2.5 border-t border-[#2A2E36] flex items-center justify-between text-[11px] text-[#8B909A]">
            <span>Active subscriptions due soon</span>
          </div>
        </div>
        <div className="bg-[#1C1F26] border border-[#2A2E36] rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#8B909A]">Total Tracked</span>
            <span className="material-symbols-outlined text-[#8B909A]">savings</span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#F2F4F7] font-headline">{sorted.length}</div>
          <div className="mt-3 pt-2.5 border-t border-[#2A2E36] flex items-center justify-between text-[11px] text-[#8B909A]">
            <span>Including paused & cancelled</span>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-[#1C1F26] border border-[#2A2E36] rounded-lg p-8">
          <EmptyState>
            <span className="flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-[#8B909A]">receipt_long</span>
              <span>No subscriptions yet. Add your first one.</span>
              <Link
                to="/subscriptions/form"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-[#F2F4F7] font-medium text-xs transition-colors"
              >
                <span className="material-symbols-outlined">add</span>
                Add Subscription
              </Link>
            </span>
          </EmptyState>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="bg-[#1C1F26] border border-[#2A2E36] rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-[#F2F4F7] font-headline">Upcoming Renewals (next 30 days)</h2>
                  <p className="text-xs text-[#8B909A] mt-0.5">Plan for these charges before they hit.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {upcoming.map((s) => (
                  <div key={s.id} className="p-3 rounded bg-[#14161A] border border-[#2A2E36]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#F2F4F7] truncate">{s.name}</span>
                      <span className="text-[#8B909A] shrink-0 ml-2">
                        {daysUntil(s.nextRenewalDate) === 0 ? "Today" : `in ${daysUntil(s.nextRenewalDate)}d`}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#F2F4F7] mt-1 font-mono">
                      {fmtMoney(s.cost, s.currency)}
                    </div>
                    <div className="text-[10px] text-[#8B909A] mt-0.5">{fmtDate(s.nextRenewalDate)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#1C1F26] border border-[#2A2E36] rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2A2E36] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#14161A]">
              <div>
                <h2 className="text-sm font-semibold text-[#F2F4F7] font-headline">Subscriptions</h2>
                <p className="text-xs text-[#8B909A] mt-0.5">Sorted by next renewal date.</p>
              </div>
              <div className="flex items-center gap-2">
                {filterBtn("all", "All")}
                {filterBtn("active", "Active")}
                {filterBtn("paused", "Paused")}
                {filterBtn("cancelled", "Cancelled")}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#2A2E36] bg-[#14161A]/60 text-[#8B909A] font-medium uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Billing</th>
                    <th className="py-3 px-3">Next Renewal</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Cost</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2E36] font-normal">
                  {visible.map((s) => {
                    const passed = daysUntil(s.nextRenewalDate) < 0;
                    return (
                      <tr key={s.id} className="hover:bg-[#14161A] transition-colors">
                        <td className="py-3.5 px-4 font-medium text-[#F2F4F7]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded bg-[#14161A] border border-[#2A2E36] flex items-center justify-center font-bold text-xs text-[#F2F4F7]">
                              {s.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-[#F2F4F7]">{s.name}</div>
                              {s.category && <div className="text-[11px] text-[#8B909A]">{s.category}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-[#8B909A]">{s.category ?? "—"}</td>
                        <td className="py-3.5 px-3 text-[#F2F4F7] capitalize">{s.billingCycle.toLowerCase()}</td>
                        <td className="py-3.5 px-3 text-[#8B909A] font-mono">
                          {fmtDate(s.nextRenewalDate)}
                          {passed && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#14161A] text-amber-400 border border-amber-900/40">
                              Renewal passed
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-medium text-[#F2F4F7]">
                          {fmtMoney(s.cost, s.currency)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/subscriptions/form?id=${s.id}`}
                              className="px-2 py-1 rounded bg-[#1C1F26] border border-[#2A2E36] hover:bg-[#2A2E36] text-[11px] text-[#F2F4F7] font-medium transition-colors"
                            >
                              Edit
                            </Link>
                            <Link
                              to={`/subscriptions/delete-confirm?id=${s.id}`}
                              className="px-2 py-1 rounded bg-[#1C1F26] border border-[#2A2E36] hover:bg-[#2A2E36] text-[11px] text-red-400 font-medium transition-colors"
                            >
                              Delete
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-[#2A2E36] flex items-center justify-between text-xs text-[#8B909A] bg-[#14161A]">
              <span>
                Showing {visible.length} of {sorted.length} subscriptions
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export function StatusBadge({ status }: { status: SubscriptionStatus }) {
  if (status === "ACTIVE")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#14161A] text-emerald-400 border border-emerald-900/40">
        Active
      </span>
    );
  if (status === "PAUSED")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#14161A] text-amber-400 border border-amber-900/40">
        Paused
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#14161A] text-[#8B909A] border border-[#2A2E36]">
      Cancelled
    </span>
  );
}
