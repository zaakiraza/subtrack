import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { AppShell } from "./components/AppShell";
import { Forbidden } from "./pages/Forbidden";
import { getSession } from "./session";

function RequireAuth({ children }: { children: ReactNode }) {
  const session = getSession();
  if (!session) return <Navigate to="/signin" replace state={{ message: "Sign in required." }} />;
  return <AppShell>{children}</AppShell>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const session = getSession();
  if (!session) return <Navigate to="/signin" replace state={{ message: "Sign in required." }} />;
  if (session.role !== "SUPERADMIN") return <Forbidden />;
  return <AppShell>{children}</AppShell>;
}

import { ForgotPassword } from "./pages/ForgotPassword";
import { Register } from "./pages/Register";
import { SignIn } from "./pages/SignIn";
import { Dashboard } from "./pages/Dashboard";
import { SubscriptionForm } from "./pages/SubscriptionForm";
import { DeleteConfirm } from "./pages/DeleteConfirm";
import { AdminUsers } from "./pages/AdminUsers";
import { AdminUserSubscriptions } from "./pages/AdminUserSubscriptions";

export function App() {
  const location = useLocation();
  void location;
  return (
    <Routes>
      <Route path="/signin" element={<AppShell><SignIn /></AppShell>} />
      <Route path="/register" element={<AppShell><Register /></AppShell>} />
      <Route path="/forgot-password" element={<AppShell><ForgotPassword /></AppShell>} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/subscriptions/form" element={<RequireAuth><SubscriptionForm /></RequireAuth>} />
      <Route path="/subscriptions/delete-confirm" element={<RequireAuth><DeleteConfirm /></RequireAuth>} />
      <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
      <Route path="/admin/users/:userId/subscriptions" element={<RequireAdmin><AdminUserSubscriptions /></RequireAdmin>} />
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
