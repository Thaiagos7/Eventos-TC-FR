import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OAuthCallbackHandler } from "@/components/auth/OAuthCallbackHandler";
import { AuthProvider } from "@/contexts/AuthContext";
import { EventProvider } from "@/contexts/EventContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Registar from "./pages/Registar";
import Dashboard from "./pages/Dashboard";
import Eventos from "./pages/Eventos";
import EventoNovo from "./pages/EventoNovo";
import EventoDetalhe from "./pages/EventoDetalhe";
import EventoEditar from "./pages/EventoEditar";
import EventoParticipantes from "./pages/EventoParticipantes";
import EventosPendentes from "./pages/EventosPendentes";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Notificacoes from "./pages/Notificacoes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
      <AuthProvider>
        <EventProvider>
          <NotificationProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <OAuthCallbackHandler />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registar" element={<Registar />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/pendentes" element={<EventosPendentes />} />
                <Route path="/eventos" element={<Eventos />} />
                <Route path="/eventos/novo" element={<EventoNovo />} />
                <Route path="/eventos/:id" element={<EventoDetalhe />} />
                <Route path="/eventos/:id/editar" element={<EventoEditar />} />
                <Route path="/eventos/:id/participantes" element={<EventoParticipantes />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/notificacoes" element={<Notificacoes />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </EventProvider>
      </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
