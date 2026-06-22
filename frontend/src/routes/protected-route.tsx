import { Navigate } from "react-router-dom";

import { useAuth } from "../features/auth/hooks/use-auth";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: Props) {
  const {
    user,

    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-blue-50 text-sm font-medium text-blue-700">
        Carregando sua sessão...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
