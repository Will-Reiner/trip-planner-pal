import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./contexts/UserContext";
import { TripDataProvider } from "./contexts/TripDataContext";
import Login from "./pages/Login";
import AdminUsuarios from "./pages/AdminUsuarios";
import Gastronomia from "./pages/Gastronomia";
import Itens from "./pages/Itens";
import Experience from "./pages/Experience";
import Perfil from "./pages/Perfil";
import ListaDeMercado from "./pages/ListaDeMercado";
import Custos from "./pages/CustosNew";
import Caronas from "./pages/Caronas";
import QRRedeem from "./pages/QRRedeem";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useUser();
  const token = localStorage.getItem('trip_planner_token');
  const isAuthed = Boolean(token && currentUser);

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { currentUser } = useUser();
  const token = localStorage.getItem('trip_planner_token');
  const isAuthed = Boolean(token && currentUser);
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthed ? <Navigate to="/gastronomia" replace /> : <Login />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={isAuthed ? "/gastronomia" : "/login"} replace />} 
      />
      <Route 
        path="/admin-usuarios" 
        element={
          <ProtectedRoute>
            <AdminUsuarios />
          </ProtectedRoute>
        } 
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
        path="/caronas" 
        element={
          <ProtectedRoute>
            <Caronas />
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
      <Route 
        path="/game/qr/:token" 
        element={
          <ProtectedRoute>
            <QRRedeem />
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
