import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading, userRole } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Only fire toast if we KNOW the role is non-admin (not null = still unknown)
    if (!loading && session && userRole !== null && userRole !== "admin" && !redirecting) {
      setRedirecting(true);
      toast({
        title: "Access Denied",
        description: `You are logged in, but your role is "${userRole}". Admin privileges required.`,
        variant: "destructive",
      });
    }
  }, [loading, session, userRole, redirecting]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // IMPORTANT: Only redirect if we KNOW the role is not admin.
  // If userRole is null, we don't know yet — do NOT redirect.
  if (userRole !== null && userRole !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
