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
import PendingApproval from "./pages/PendingApproval";
import PaymentRequired from "./pages/PaymentRequired";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

// Lazy loaded pages (code splitting)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const NewAppointment = lazy(() => import("./pages/NewAppointment"));
const ValueEstimator = lazy(() => import("./pages/ValueEstimator"));
const MessengerInbox = lazy(() => import("./pages/MessengerInbox"));
const Integrations = lazy(() => import("./pages/Integrations"));
const SellerLeads = lazy(() => import("./pages/SellerLeads"));
const SellerLeadDetail = lazy(() => import("./pages/SellerLeadDetail"));
const NewSellerLead = lazy(() => import("./pages/NewSellerLead"));
const EditSellerLead = lazy(() => import("./pages/EditSellerLead"));
const MakeOffer = lazy(() => import("./pages/MakeOffer"));
const Buyers = lazy(() => import("./pages/Buyers"));
const BuyerDetail = lazy(() => import("./pages/BuyerDetail"));
const NewBuyer = lazy(() => import("./pages/NewBuyer"));
const EditBuyer = lazy(() => import("./pages/EditBuyer"));
const ImportBuyers = lazy(() => import("./pages/ImportBuyers"));
const Expenses = lazy(() => import("./pages/Expenses"));
const PurchaseOrders = lazy(() => import("./pages/PurchaseOrders"));
const NewPurchaseOrder = lazy(() => import("./pages/NewPurchaseOrder"));
const PersonalAdvances = lazy(() => import("./pages/PersonalAdvances"));
const ProfitLoss = lazy(() => import("./pages/ProfitLoss"));
const ContractTemplates = lazy(() => import("./pages/ContractTemplates"));
const Contracts = lazy(() => import("./pages/Contracts"));
const ContractDetail = lazy(() => import("./pages/ContractDetail"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminOrganizations = lazy(() => import("./pages/AdminOrganizations"));

const LazyAuthRoute = ({
  children,
  requiredRole,
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
              <Route
                path="/accept-invite"
                element={
                  <Suspense fallback={<FullPageLoader text="Loading..." />}>
                    <AcceptInvite />
                  </Suspense>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <Suspense fallback={<FullPageLoader text="Loading..." />}>
                    <ForgotPassword />
                  </Suspense>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <Suspense fallback={<FullPageLoader text="Loading..." />}>
                    <ResetPassword />
                  </Suspense>
                }
              />
              <Route
                path="/verify-email"
                element={
                  <Suspense fallback={<FullPageLoader text="Loading..." />}>
                    <VerifyEmail />
                  </Suspense>
                }
              />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route path="/payment-required" element={<PaymentRequired />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Admin routes */}
              <Route
                path="/admin/settings"
                element={
                  <LazyAuthRoute requiredRole="admin">
                    <Settings />
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
                path="/admin/contract-templates"
                element={
                  <LazyAuthRoute requiredRole="admin">
                    <ContractTemplates />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/admin/integrations"
                element={
                  <LazyAuthRoute requiredRole="admin">
                    <Integrations />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/admin/organizations"
                element={
                  <LazyAuthRoute requiredRole="admin">
                    <AdminOrganizations />
                  </LazyAuthRoute>
                }
              />

              {/* Seller leads */}
              <Route
                path="/seller-leads/new"
                element={
                  <LazyAuthRoute requiredRole="agent">
                    <NewSellerLead />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/seller-leads/:id/edit"
                element={
                  <LazyAuthRoute requiredRole="agent">
                    <EditSellerLead />
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
                path="/seller-leads/:id"
                element={
                  <LazyAuthRoute requiredRole="viewer">
                    <SellerLeadDetail />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/seller-leads"
                element={
                  <LazyAuthRoute requiredRole="viewer">
                    <SellerLeads />
                  </LazyAuthRoute>
                }
              />

              {/* Buyers */}
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
                path="/buyers/:id/edit"
                element={
                  <LazyAuthRoute requiredRole="agent">
                    <EditBuyer />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/buyers/:id"
                element={
                  <LazyAuthRoute requiredRole="viewer">
                    <BuyerDetail />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/buyers"
                element={
                  <LazyAuthRoute requiredRole="viewer">
                    <Buyers />
                  </LazyAuthRoute>
                }
              />

              {/* Calendar */}
              <Route
                path="/calendar/new"
                element={
                  <LazyAuthRoute requiredRole="agent">
                    <NewAppointment />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <LazyAuthRoute requiredRole="viewer">
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
                path="/appointments"
                element={
                  <LazyAuthRoute requiredRole="viewer">
                    <CalendarPage />
                  </LazyAuthRoute>
                }
              />

              {/* Other routes */}
              <Route
                path="/messenger"
                element={
                  <LazyAuthRoute requiredRole="viewer">
                    <MessengerInbox />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/value-estimator"
                element={
                  <LazyAuthRoute requiredRole="viewer">
                    <ValueEstimator />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/purchase-orders/new"
                element={
                  <LazyAuthRoute requiredRole="agent">
                    <NewPurchaseOrder />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/purchase-orders"
                element={
                  <LazyAuthRoute requiredRole="viewer">
                    <PurchaseOrders />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <LazyAuthRoute requiredRole="viewer">
                    <Expenses />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/personal-advances"
                element={
                  <LazyAuthRoute requiredRole="viewer">
                    <PersonalAdvances />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/profit-loss"
                element={
                  <LazyAuthRoute requiredRole="admin">
                    <ProfitLoss />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/contracts/:id"
                element={
                  <LazyAuthRoute requiredRole="viewer">
                    <ContractDetail />
                  </LazyAuthRoute>
                }
              />
              <Route
                path="/contracts"
                element={
                  <LazyAuthRoute requiredRole="viewer">
                    <Contracts />
                  </LazyAuthRoute>
                }
              />

              {/* Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <LazyAuthRoute requiredRole="viewer">
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
