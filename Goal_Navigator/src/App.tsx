import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleBasedRedirect } from "@/components/RoleBasedRedirect";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { OKRSkeleton } from "@/components/OKRSkeleton";

// Eagerly loaded — small + on critical path
import LoginPage from "./pages/Login.tsx";
import AccessDeniedPage from "./pages/AccessDenied.tsx";
import NotFound from "./pages/NotFound.tsx";

// Code-split everything else: each route ships in its own chunk
const OKRsPage = lazy(() => import("./pages/OKRs.tsx"));
const DesempenoPage = lazy(() => import("./pages/Desempeno.tsx"));
const OnboardingPage = lazy(() => import("./pages/Onboarding.tsx"));
const EquipoPage = lazy(() => import("./pages/Equipo.tsx"));
const AdminPanelPage = lazy(() => import("./pages/AdminPanel.tsx"));
const AdminQAPage = lazy(() => import("./pages/AdminQA.tsx"));
const BiaJourneyPage = lazy(() => import("./pages/BiaJourney.tsx"));
const EnpsDashboardPage = lazy(() => import("./pages/EnpsDashboard.tsx"));
const PerformanceReviewPage = lazy(() => import("./pages/PerformanceReview.tsx"));
const SetupWizardPage = lazy(() => import("./pages/SetupWizard.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — OKR data rarely changes
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ImpersonationBanner />
          <Suspense fallback={<OKRSkeleton />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/setup" element={<SetupWizardPage />} />
              <Route path="/acceso-denegado" element={<AccessDeniedPage />} />
              <Route path="/" element={<RoleBasedRedirect />} />
              <Route path="/okrs" element={
                <ProtectedRoute>
                  <OKRsPage />
                </ProtectedRoute>
              } />
              <Route path="/desempeno" element={
                <ProtectedRoute>
                  <DesempenoPage />
                </ProtectedRoute>
              } />
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } />
              <Route path="/equipo" element={
                <ProtectedRoute requireTeamAccess>
                  <EquipoPage />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requireAdminAccess>
                  <AdminPanelPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/qa" element={
                <ProtectedRoute requireQAAccess>
                  <AdminQAPage />
                </ProtectedRoute>
              } />
              <Route path="/journey" element={
                <ProtectedRoute>
                  <BiaJourneyPage />
                </ProtectedRoute>
              } />
              <Route path="/enps" element={
                <ProtectedRoute requireEnpsAccess isEnpsRoute>
                  <EnpsDashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/performance-review" element={
                <ProtectedRoute>
                  <PerformanceReviewPage context="desempeno" />
                </ProtectedRoute>
              } />
              <Route path="/performance-review/equipo" element={
                <ProtectedRoute requireTeamAccess>
                  <PerformanceReviewPage context="equipo" />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
