import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";

import { DashboardLayout } from "./components/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Overview from "./pages/Overview";
import FarmProfile from "./pages/FarmProfile";
import SmartAdvisory from "./pages/SmartAdvisory";
import VisionDiagnosis from "./pages/VisionDiagnosis";
import MarketSales from "./pages/MarketSales";
import Scheduler from "./pages/Scheduler";
import KnowledgeHub from "./pages/KnowledgeHub";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* PUBLIC */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

            {/* PROTECTED */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="farm-profile" element={<FarmProfile />} />
              <Route path="advisory" element={<SmartAdvisory />} />
              <Route path="diagnosis" element={<VisionDiagnosis />} />
              <Route path="market" element={<MarketSales />} />
              <Route path="scheduler" element={<Scheduler />} />
              <Route path="knowledge" element={<KnowledgeHub />} />
              <Route path="insights" element={<Insights />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
