import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./contexts/UserContext";
import { TripDataProvider } from "./contexts/TripDataContext";
import Onboarding from "./pages/Onboarding";
import Gastronomia from "./pages/Gastronomia";
import Itens from "./pages/Itens";
import Experience from "./pages/Experience";
import Perfil from "./pages/Perfil";
import ListaDeMercado from "./pages/ListaDeMercado";
import Custos from "./pages/Custos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useUser();
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { currentUser } = useUser();
  
  return (
    <Routes>
      <Route 
        path="/" 
        element={currentUser ? <Navigate to="/gastronomia" replace /> : <Onboarding />} 
      />
      <Route 
        path="/gastronomia" 
        element={
          <ProtectedRoute>
            <Gastronomia />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/itens" 
        element={
          <ProtectedRoute>
            <Itens />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/lista-de-mercado" 
        element={
          <ProtectedRoute>
            <ListaDeMercado />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/custos" 
        element={
          <ProtectedRoute>
            <Custos />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/experience" 
        element={
          <ProtectedRoute>
            <Experience />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/perfil" 
        element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserProvider>
        <TripDataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TripDataProvider>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
