import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentUser, seedData } from "@/lib/storage";
import Navbar from "@/components/Navbar";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import DonorList from "@/pages/DonorList";
import AddDonor from "@/pages/AddDonor";
import BloodRequest from "@/pages/BloodRequest";
import DonorDashboard from "@/pages/DonorDashboard";
import MapPage from "@/pages/MapPage";
import NotFound from "@/pages/NotFound";

seedData();

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/donors" element={<ProtectedRoute><DonorList /></ProtectedRoute>} />
          <Route path="/add-donor" element={<ProtectedRoute><AddDonor /></ProtectedRoute>} />
          <Route path="/blood-request" element={<ProtectedRoute><BloodRequest /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DonorDashboard /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
