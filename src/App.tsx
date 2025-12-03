import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SellerLeads from "./pages/SellerLeads";
import SellerLeadDetail from "./pages/SellerLeadDetail";
import NewSellerLead from "./pages/NewSellerLead";
import Buyers from "./pages/Buyers";
import CalendarPage from "./pages/CalendarPage";
import Expenses from "./pages/Expenses";
import ValueEstimator from "./pages/ValueEstimator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/seller-leads"
              element={
                <AuthGuard>
                  <SellerLeads />
                </AuthGuard>
              }
            />
            <Route
              path="/seller-leads/new"
              element={
                <AuthGuard requiredRole="agent">
                  <NewSellerLead />
                </AuthGuard>
              }
            />
            <Route
              path="/seller-leads/:id"
              element={
                <AuthGuard>
                  <SellerLeadDetail />
                </AuthGuard>
              }
            />
            <Route
              path="/buyers"
              element={
                <AuthGuard>
                  <Buyers />
                </AuthGuard>
              }
            />
            <Route
              path="/calendar"
              element={
                <AuthGuard>
                  <CalendarPage />
                </AuthGuard>
              }
            />
            <Route
              path="/appointments"
              element={
                <AuthGuard>
                  <CalendarPage />
                </AuthGuard>
              }
            />
            <Route
              path="/expenses"
              element={
                <AuthGuard>
                  <Expenses />
                </AuthGuard>
              }
            />
            <Route
              path="/purchase-orders"
              element={
                <AuthGuard>
                  <Expenses />
                </AuthGuard>
              }
            />
            <Route
              path="/personal-advances"
              element={
                <AuthGuard>
                  <Expenses />
                </AuthGuard>
              }
            />
            <Route
              path="/value-estimator"
              element={
                <AuthGuard>
                  <ValueEstimator />
                </AuthGuard>
              }
            />
            <Route
              path="/contracts"
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/profit-loss"
              element={
                <AuthGuard requiredRole="admin">
                  <Dashboard />
                </AuthGuard>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
