import type { BillingCycle } from "./types";

export function fmtMoney(n: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

export function monthlyEquivalent(cost: number, cycle: BillingCycle): number {
  switch (cycle) {
    case "YEARLY": return cost / 12;
    case "QUARTERLY": return cost / 3;
    case "MONTHLY": return cost;
    case "WEEKLY": return (cost * 52) / 12;
    case "DAILY": return cost * 30;
  }
}

export function fmtDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function toDateInput(isoDate: string): string {
  return isoDate.slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysUntil(isoDate: string): number {
  return Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86400000);
}
