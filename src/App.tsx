import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { OnBotChat } from './components/OnBotChat'; // Importe o novo componente de chat


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
          <Route path="/onbot-chat" element={<OnBotChat />} /> {/* Nova rota para o chat */}
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