import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

const queryClient = new QueryClient();

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
