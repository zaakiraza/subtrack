import { Link } from "react-router-dom";

/** 403 — shown to non-superadmin users hitting /admin/*. */

export function Forbidden() {
  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#F2F4F7] flex items-center justify-center p-6">
      <div className="w-full max-w-[420px] bg-[#14161A] border border-[#2A2E36] rounded-xl p-8 text-center">
        <div className="w-10 h-10 mx-auto rounded-lg bg-[#1C1F26] border border-[#2A2E36] flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[#F2F4F7]">block</span>
        </div>
        <h1 className="font-headline font-semibold text-2xl tracking-tight text-[#F2F4F7]">403</h1>
        <p className="text-sm text-[#8B909A] mt-2 leading-relaxed">You do not have access to this area.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-[#F2F4F7] text-xs font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
