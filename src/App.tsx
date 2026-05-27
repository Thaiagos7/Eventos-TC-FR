import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OAuthCallbackHandler } from "@/components/auth/OAuthCallbackHandler";
import { AuthProvider } from "@/contexts/AuthContext";
import { EventProvider } from "@/contexts/EventContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Registar = lazy(() => import("./pages/Registar"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Eventos = lazy(() => import("./pages/Eventos"));
const EventoNovo = lazy(() => import("./pages/EventoNovo"));
const EventoDetalhe = lazy(() => import("./pages/EventoDetalhe"));
const EventoEditar = lazy(() => import("./pages/EventoEditar"));
const EventoParticipantes = lazy(() => import("./pages/EventoParticipantes"));
const EventosPendentes = lazy(() => import("./pages/EventosPendentes"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));

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
              <Suspense fallback={null}>
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
              </Suspense>
            </BrowserRouter>
          </NotificationProvider>
        </EventProvider>
      </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
