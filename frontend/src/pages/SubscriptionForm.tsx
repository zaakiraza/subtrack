import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { subscriptionsCreate, subscriptionsList, subscriptionsUpdate } from "../api";
import { LoadingSpinner } from "../components/Shared";
import { todayIso } from "../format";
import type { BillingCycle, SubscriptionStatus } from "../types";

/** SCREEN-005 — Subscription create/edit form. */

const inputCls =
  "bg-[#1C1F26] border border-[#2A2E36] rounded-[8px] px-3 py-2 text-sm text-[#F2F4F7] focus:outline-none focus:border-[#2563EB] w-full placeholder-[#8B909A]";
const labelCls = "text-xs font-medium text-[#8B909A]";

export function SubscriptionForm() {
  const [params] = useSearchParams();
  const id = params.get("id");
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [nextRenewalDate, setNextRenewalDate] = useState(todayIso());
  const [category, setCategory] = useState("");
  const [cancellationUrl, setCancellationUrl] = useState("");
  const [status, setStatus] = useState<SubscriptionStatus>("ACTIVE");

  const [loading, setLoading] = useState(!!id);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const list = await subscriptionsList();
        const sub = list.find((s) => s.id === id);
        if (sub) {
          setName(sub.name);
          setCost(String(sub.cost));
          setCurrency(sub.currency);
          setBillingCycle(sub.billingCycle);
          setNextRenewalDate(sub.nextRenewalDate.slice(0, 10));
          setCategory(sub.category ?? "");
          setCancellationUrl(sub.cancellationUrl ?? "");
          setStatus(sub.status);
        } else {
          setErrors({ form: "Subscription not found." });
        }
      } catch (err) {
        setErrors({ form: err instanceof Error ? err.message : "Could not load the subscription." });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const title = useMemo(() => (id ? "Edit Subscription" : "Add Subscription"), [id]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required.";
    else if (name.length > 100) e.name = "Name must be 100 characters or fewer.";
    const c = Number(cost);
    if (!cost || Number.isNaN(c) || c <= 0) e.cost = "Cost must be a positive number.";
    if (!currency.trim()) e.currency = "Currency is required.";
    if (!nextRenewalDate) e.nextRenewalDate = "Next renewal date is required.";
    else if (nextRenewalDate < todayIso()) e.nextRenewalDate = "Date is in the past";
    if (cancellationUrl && !/^https?:\/\//.test(cancellationUrl)) e.cancellationUrl = "Enter a valid URL (http/https).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name,
      cost: Number(cost),
      currency,
      billingCycle,
      nextRenewalDate,
      category: category || undefined,
      cancellationUrl: cancellationUrl || undefined,
      status,
    };
    try {
      if (id) await subscriptionsUpdate(id, payload);
      else await subscriptionsCreate(payload);
      setSaved(true);
      navigate("/dashboard");
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Could not save the subscription." });
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#2A2E36]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-medium text-[#8B909A]">
            <Link to="/dashboard" className="hover:text-[#F2F4F7] transition-colors">
              Subscriptions
            </Link>
            <span className="text-[#2A2E36]">/</span>
            <span className="text-[#F2F4F7]">{title}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F2F4F7] mt-1">{title}</h1>
          <p className="text-sm text-[#8B909A]">Manage cost, billing cycle, renewal date, and status.</p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-[8px] bg-[#1C1F26] hover:bg-[#2A2E36] border border-[#2A2E36] text-[#F2F4F7] text-sm font-medium transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>

      {errors.form && (
        <div role="alert" className="px-3 py-2 rounded-[8px] bg-[#1C1F26] border border-red-900/60 text-xs text-red-400">
          {errors.form}
        </div>
      )}
      {saved && (
        <div role="status" className="px-3 py-2 rounded-[8px] bg-[#1C1F26] border border-emerald-900/60 text-xs text-emerald-400">
          Subscription saved
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-[#14161A] border border-[#2A2E36] rounded-[8px] p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2E36]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#8B909A]">business_center</span>
                <h2 className="text-sm font-semibold tracking-tight text-[#F2F4F7]">Service Profile</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={labelCls} htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  className={inputCls}
                  type="text"
                  value={name}
                  disabled={saving}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && <p className="text-[11px] text-red-400">{errors.name}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} htmlFor="category">
                  Category
                </label>
                <input
                  id="category"
                  className={inputCls}
                  type="text"
                  value={category}
                  disabled={saving}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  className={inputCls}
                  value={status}
                  disabled={saving}
                  onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-[#14161A] border border-[#2A2E36] rounded-[8px] p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2E36]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#8B909A]">payments</span>
                <h2 className="text-sm font-semibold tracking-tight text-[#F2F4F7]">Billing Schedule</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} htmlFor="cost">
                  Cost
                </label>
                <input
                  id="cost"
                  className={inputCls}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={cost}
                  disabled={saving}
                  onChange={(e) => setCost(e.target.value)}
                />
                {errors.cost && <p className="text-[11px] text-red-400">{errors.cost}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} htmlFor="currency">
                  Currency
                </label>
                <input
                  id="currency"
                  className={inputCls}
                  type="text"
                  value={currency}
                  disabled={saving}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                />
                {errors.currency && <p className="text-[11px] text-red-400">{errors.currency}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} htmlFor="billingCycle">
                  Billing Cycle
                </label>
                <select
                  id="billingCycle"
                  className={inputCls}
                  value={billingCycle}
                  disabled={saving}
                  onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} htmlFor="nextRenewalDate">
                  Next Renewal Date
                </label>
                <input
                  id="nextRenewalDate"
                  className={inputCls}
                  type="date"
                  value={nextRenewalDate}
                  disabled={saving}
                  onChange={(e) => setNextRenewalDate(e.target.value)}
                />
                {errors.nextRenewalDate && (
                  <p className={"text-[11px] " + (errors.nextRenewalDate === "Date is in the past" ? "text-amber-400" : "text-red-400")}>
                    {errors.nextRenewalDate}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={labelCls} htmlFor="cancellationUrl">
                  Cancellation URL
                </label>
                <input
                  id="cancellationUrl"
                  className={inputCls}
                  type="url"
                  placeholder="https://…"
                  value={cancellationUrl}
                  disabled={saving}
                  onChange={(e) => setCancellationUrl(e.target.value)}
                />
                {errors.cancellationUrl && <p className="text-[11px] text-red-400">{errors.cancellationUrl}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              className="px-4 py-2 rounded-[8px] bg-[#2563EB] hover:bg-[#1d4ed8] text-[#F2F4F7] text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
              type="submit"
              disabled={saving}
            >
              {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              <span className="material-symbols-outlined text-sm">save</span>
              <span>{id ? "Save Changes" : "Add Subscription"}</span>
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
