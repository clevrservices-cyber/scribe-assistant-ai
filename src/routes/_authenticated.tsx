import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { useAuth } from "@/lib/auth";
import { RecorderProvider } from "@/lib/recorder-context";
import { ScribeProvider } from "@/lib/scribe-context";

export const Route = createFileRoute("/_authenticated")({ component: Layout });

function Layout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" />;
  return (
    <ScribeProvider>
      <RecorderProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <AppHeader />
          <main className="flex-1 mx-auto max-w-2xl w-full px-4 pb-32 pt-4">
            <Outlet />
          </main>
          <AppFooter />
        </div>
      </RecorderProvider>
    </ScribeProvider>
  );
}
