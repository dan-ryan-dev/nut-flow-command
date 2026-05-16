import { QueryCache, MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CommandCenterPage from "./features/command-center/CommandCenterPage";
import ContainersLedgerPage from "./features/containers/ContainersLedgerPage";
import AlertsPage from "./features/alerts/AlertsPage";
import SettingsPage from "./features/settings/SettingsPage";
import NotFound from "./pages/NotFound.tsx";
import AuthPage from "./pages/AuthPage";
import { AuthProvider } from "./shared/auth/AuthProvider";
import { ProtectedRoute } from "./shared/auth/ProtectedRoute";

const isAuthExpired = (err: unknown) => {
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  return (
    msg.includes("jwt expired") ||
    msg.includes("invalid jwt") ||
    msg.includes("not authenticated") ||
    (err as { status?: number })?.status === 401
  );
};

const handleAuthError = (err: unknown) => {
  if (isAuthExpired(err)) {
    sessionStorage.setItem("nomos:session-expired", "1");
    void supabase.auth.signOut();
  }
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleAuthError }),
  mutationCache: new MutationCache({ onError: handleAuthError }),
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><CommandCenterPage /></ProtectedRoute>} />
            <Route path="/containers" element={<ProtectedRoute><ContainersLedgerPage /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
