import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, mongoUser, loading } = useAuth();
  const location = window.location.pathname;

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // 1. Not Logged In -> Go to Auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // 2. Logged In BUT No Mongo Profile (Incomplete Onboarding) -> Go to Onboarding
  if (user && !mongoUser && location !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // 3. Logged In AND Onboarding Complete -> Go to Dashboard
  if (user && mongoUser && location === "/onboarding") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

