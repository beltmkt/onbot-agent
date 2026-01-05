import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { CreateUsers } from './components/CreateUsers';
import { Home } from './components/Home';
import { MainLayout } from './components/MainLayout';
import { Teams } from './components/Teams';
import { TransferContacts } from './components/TransferContacts';
import { Audit } from './components/Audit';
import { Settings } from './components/Settings';
import { RemaxRequests } from './components/RemaxRequests';
import { ChatPage } from './components/ChatPage'; // Importe o novo componente de chat


const ProtectedRoutesLayout: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div>Carregando...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <MainLayout />;
};

// Novo componente para proteger a rota do chat sem o MainLayout
const ProtectedChatRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div>Carregando...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />; // Renderiza o componente filho (ChatPage) diretamente
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />
        
        <Route element={<ProtectedRoutesLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/create-users" element={<CreateUsers />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/transfer-contacts" element={<TransferContacts />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/remax-requests" element={<RemaxRequests />} />
        </Route>

        {/* Rota do Chat fora do MainLayout para ocupar a tela toda */}
        <Route element={<ProtectedChatRoute />}>
          <Route path="/onbot-chat" element={<ChatPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

// Envolva seu App com o AuthProvider no index.tsx ou main.tsx
export default App;