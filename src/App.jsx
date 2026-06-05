import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute, PublicRoute, RoleRoute } from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import LoginPage          from "./pages/LoginPage";
import DashboardPage      from "./pages/DashboardPage";
import VouchersPage       from "./pages/VouchersPage";
import RedemptionsPage    from "./pages/RedemptionsPage";
import ManageVouchersPage from "./pages/ManageVouchersPage";
import ManageUsersPage    from "./pages/ManageUsersPage";
import ManageDivisionsPage from "./pages/ManageDivisionsPage";
import ProfilePage        from "./pages/ProfilePage";
import NotFoundPage       from "./pages/NotFoundPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard"   element={<DashboardPage />} />
              <Route path="/vouchers"    element={<VouchersPage />} />
              <Route path="/redemptions" element={<RedemptionsPage />} />
              <Route path="/profile"     element={<ProfilePage />} />

              {/* Admin + Super Admin */}
              <Route element={<RoleRoute allowed={["admin", "super_admin"]} />}>
                <Route path="/manage-vouchers" element={<ManageVouchersPage />} />
              </Route>

              {/* Super Admin only */}
              <Route element={<RoleRoute allowed={["super_admin"]} />}>
                <Route path="/manage-users"     element={<ManageUsersPage />} />
                <Route path="/manage-divisions" element={<ManageDivisionsPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
