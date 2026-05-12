import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { loading, session } = useAuth();
  if (loading) return null;
  return session ? <Navigate to="/scribe" /> : <Navigate to="/login" />;
}
