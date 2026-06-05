import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Spinner from "../ui/Spinner";

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8F6]">
      <Spinner size="lg" />
    </div>
  );
}

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export function RoleRoute({ allowed }) {
  const { profile, loading } = useAuth();
  if (loading) return <Loading />;
  const role = profile?.role || "user";
  return allowed.includes(role) ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
