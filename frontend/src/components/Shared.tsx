import type { ReactNode } from "react";

/** Shared UI the generated pages import. Keep these names stable. */

export function ErrorMessage({ children }: { children?: ReactNode }) {
  return children ? <p className="error" role="alert">{children}</p> : null;
}

export function SuccessMessage({ children }: { children?: ReactNode }) {
  return children ? <p className="ok" role="status">{children}</p> : null;
}

export function Card({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <article className={"card " + className}>{children}</article>;
}

export function CatalogGrid({ children }: { children?: ReactNode; count?: number }) {
  return <div className="catalog-grid">{children}</div>;
}

export function LoadingSpinner() {
  return <div className="loader" role="status" aria-label="Loading" />;
}

export function EmptyState({ children }: { children?: ReactNode }) {
  return <p className="muted">{children ?? "Nothing here yet."}</p>;
}
