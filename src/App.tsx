import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LearnMore from "./pages/LearnMore";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import Features from "./pages/Features";
import HelpCenter from "./pages/HelpCenter";
import ApiDocs from "./pages/ApiDocs";
import Developers from "./pages/Developers";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import OrderDetail from "./pages/OrderDetail";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import AdminOrders from "./pages/AdminOrders";
import AdminUpload from "./pages/AdminUpload";
import AdminVendors from "./pages/AdminVendors";
import AdminViewData from "./pages/AdminViewData";
import AdminClients from "./pages/AdminClients";
import AdminSettings from "./pages/AdminSettings";
import SetupAdmin from "./pages/SetupAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/learn-more" element={<LearnMore />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/features" element={<Features />} />
            <Route path="/help-center" element={<HelpCenter />} />
            <Route path="/api-docs" element={<ApiDocs />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/orders/:orderId" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/upload" element={<AdminRoute><AdminUpload /></AdminRoute>} />
            <Route path="/admin/vendors" element={<AdminRoute><AdminVendors /></AdminRoute>} />
            <Route path="/admin/data" element={<AdminRoute><AdminViewData /></AdminRoute>} />
            <Route path="/admin/clients" element={<AdminRoute><AdminClients /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/setup-admin" element={<SetupAdmin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
