import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import MapPage from '@/pages/MapPage';
import RoutesPage from '@/pages/RoutesPage';
import AlertsPage from '@/pages/AlertsPage';
import AgentPage from '@/pages/AgentPage';
import DashboardPage from '@/pages/DashboardPage';
import RewardsPage from '@/pages/RewardsPage';
import NotificationsPage from '@/pages/NotificationsPage';
import TicketsPage from '@/pages/TicketsPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#FFFBF0' }}>
        <div className="flex flex-col items-center gap-4">
          <span className="text-5xl animate-bounce">🦜</span>
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-700 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold" style={{ color: '#2D6A4F' }}>Cargando MueveCancún...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/rutas" element={<RoutesPage />} />
        <Route path="/alertas" element={<AlertsPage />} />
        <Route path="/agente" element={<AgentPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/notificaciones" element={<NotificationsPage />} />
        <Route path="/boletos" element={<TicketsPage />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;