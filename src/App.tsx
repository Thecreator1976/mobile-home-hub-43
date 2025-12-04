import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FullPageLoader } from "@/components/ui/loading";
import { queryClient } from "@/lib/queryClient";

// Eagerly loaded pages (critical path)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import PendingApproval from "./pages/PendingApproval";
import NotFound from "./pages/NotFound";

// Lazy loaded pages (code splitting)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SellerLeads = lazy(() => import("./pages/SellerLeads"));
const SellerLeadDetail = lazy(() => import("./pages/SellerLeadDetail"));
const NewSellerLead = lazy(() => import("./pages/NewSellerLead"));
const MakeOffer = lazy(() => import("./pages/MakeOffer"));
const Buyers = lazy(() => import("./pages/Buyers"));
const BuyerDetail = lazy(() => import("./pages/BuyerDetail"));
const NewBuyer = lazy(() => import("./pages/NewBuyer"));
const ImportBuyers = lazy(() => import("./pages/ImportBuyers"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const NewAppointment = lazy(() => import("./pages/NewAppointment"));
const Expenses = lazy(() => import("./pages/Expenses"));
const ValueEstimator = lazy(() => import("./pages/ValueEstimator"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));

// Wrapper for lazy loaded protected routes
const LazyAuthRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode; 
  requiredRole?: "admin" | "agent" | "viewer";
}) => (
  <AuthGuard requiredRole={requiredRole}>
    <Suspense fallback={<FullPageLoader text="Loading page..." />}>
      {children}
    </Suspense>
  </AuthGuard>
);

const App = () => (
  <ErrorBoundary>
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

              {/* Protected Routes with Lazy Loading */}
              <Route
                path="/dashboard"
                element={
                  <LazyAuthRoute>
                    <Dashboard />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/seller-leads"
                element={
                  <LazyAuthRoute>
                    <SellerLeads />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/seller-leads/new"
                element={
                  <LazyAuthRoute requiredRole="agent">
                    <NewSellerLead />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/seller-leads/:id"
                element={
                  <LazyAuthRoute>
                    <SellerLeadDetail />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/seller-leads/:id/make-offer"
                element={
                  <LazyAuthRoute requiredRole="agent">
                    <MakeOffer />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/buyers"
                element={
                  <LazyAuthRoute>
                    <Buyers />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/buyers/:id"
                element={
                  <LazyAuthRoute>
                    <BuyerDetail />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/buyers/new"
                element={
                  <LazyAuthRoute requiredRole="agent">
                    <NewBuyer />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/buyers/import"
                element={
                  <LazyAuthRoute requiredRole="agent">
                    <ImportBuyers />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <LazyAuthRoute>
                    <CalendarPage />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/calendar/new"
                element={
                  <LazyAuthRoute requiredRole="agent">
                    <NewAppointment />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/appointments"
                element={
                  <LazyAuthRoute>
                    <CalendarPage />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/appointments/new"
                element={
                  <LazyAuthRoute requiredRole="agent">
                    <NewAppointment />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <LazyAuthRoute>
                    <Expenses />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/purchase-orders"
                element={
                  <LazyAuthRoute>
                    <Expenses />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/personal-advances"
                element={
                  <LazyAuthRoute>
                    <Expenses />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/value-estimator"
                element={
                  <LazyAuthRoute>
                    <ValueEstimator />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/contracts"
                element={
                  <LazyAuthRoute>
                    <Dashboard />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/profit-loss"
                element={
                  <LazyAuthRoute requiredRole="admin">
                    <Dashboard />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <LazyAuthRoute requiredRole="admin">
                    <AdminUsers />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <LazyAuthRoute requiredRole="admin">
                    <Dashboard />
                  </LazyAuthRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
