import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
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
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes (will add auth guard later) */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/seller-leads" element={<SellerLeads />} />
          <Route path="/seller-leads/new" element={<NewSellerLead />} />
          <Route path="/seller-leads/:id" element={<SellerLeadDetail />} />
          <Route path="/buyers" element={<Buyers />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/appointments" element={<CalendarPage />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/purchase-orders" element={<Expenses />} />
          <Route path="/personal-advances" element={<Expenses />} />
          <Route path="/value-estimator" element={<ValueEstimator />} />
          <Route path="/contracts" element={<Dashboard />} />
          <Route path="/profit-loss" element={<Dashboard />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
