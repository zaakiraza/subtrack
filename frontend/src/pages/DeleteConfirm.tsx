import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { subscriptionsDelete, subscriptionsList } from "../api";
import { LoadingSpinner } from "../components/Shared";

/** SCREEN-006 — Delete confirmation (modal route). */

export function DeleteConfirm() {
  const [params] = useSearchParams();
  const id = params.get("id");
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const list = await subscriptionsList();
        const sub = list.find((s) => s.id === id);
        setName(sub?.name ?? "this subscription");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load the subscription.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onConfirm() {
    setDeleting(true);
    try {
      await subscriptionsDelete(id ?? "");
      navigate("/dashboard", { state: { toast: "Subscription deleted" } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the subscription.");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0D10]/75 p-4">
      <div className="w-full max-w-[540px] bg-[#14161A] border border-[#2A2E36] rounded-lg shadow-none overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-[#2A2E36]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#F2F4F7]">warning</span>
              <h2 className="text-base font-semibold text-[#F2F4F7] tracking-tight">Delete subscription</h2>
            </div>
            <Link className="text-[#8B909A] hover:text-[#F2F4F7] transition-colors p-1" to="/dashboard" title="Close">
              <span className="material-symbols-outlined text-base">close</span>
            </Link>
          </div>
          <p className="text-xs text-[#8B909A] mt-2 leading-relaxed">
            {loading ? <LoadingSpinner /> : `Delete ${name}? This cannot be undone.`}
          </p>
        </div>
        {error && (
          <div role="alert" className="mx-6 mt-4 px-3 py-2 rounded-lg bg-[#1C1F26] border border-red-900/60 text-xs text-red-400">
            {error}
          </div>
        )}
        <div className="px-6 py-4 bg-[#14161A] border-t border-[#2A2E36] flex items-center justify-end gap-3">
          <Link
            to="/dashboard"
            className="h-9 px-4 rounded-lg bg-[#1C1F26] border border-[#2A2E36] text-xs font-medium text-[#F2F4F7] hover:bg-[#2A2E36] transition-colors duration-150 flex items-center"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={deleting || loading}
            className="h-9 px-4 rounded-lg bg-[#2563EB] text-xs font-medium text-[#F2F4F7] hover:bg-blue-700 transition-colors duration-150 disabled:opacity-60 flex items-center gap-2"
          >
            {deleting && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            Delete Subscription
          </button>
        </div>
      </div>
    </div>
  );
}
