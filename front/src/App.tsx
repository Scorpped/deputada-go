import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PainelLayout } from "@/components/PainelLayout";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import PainelIndex from "./pages/painel/Index.tsx";
import AdminDashboard from "./pages/painel/admin/Dashboard.tsx";
import AdminLideres from "./pages/painel/admin/Lideres.tsx";
import AdminApoiadores from "./pages/painel/admin/Apoiadores.tsx";
import LiderDashboard from "./pages/painel/lider/Dashboard.tsx";
import ProfileSettings from "./pages/painel/ProfileSettings.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/cadastro" element={<Index />} />
            <Route path="/login" element={<Login />} />

            {/* Protected panel routes */}
            <Route path="/painel" element={<PainelLayout />}>
              {/* Index: redirect by role */}
              <Route index element={<PainelIndex />} />

              {/* Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/lideres" element={<AdminLideres />} />
                <Route path="admin/apoiadores" element={<AdminApoiadores />} />
              </Route>

              {/* Lider routes */}
              <Route element={<ProtectedRoute allowedRoles={["lider"]} />}>
                <Route path="lider" element={<LiderDashboard />} />
              </Route>

              {/* Shared routes (admin + lider) */}
              <Route element={<ProtectedRoute allowedRoles={["admin", "lider"]} />}>
                <Route path="perfil" element={<ProfileSettings />} />
              </Route>
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
