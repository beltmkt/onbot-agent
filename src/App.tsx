// App.tsx - exemplo de uso
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginInput } from './components/LoginInput';
import { Dashboard } from './components/Dashboard';


// Componente protegido
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Carregando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const { login, requestRegistration } = useAuth();

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            <LoginInput 
              onSubmit={login}
              onRegisterRequest={requestRegistration}
            />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

// Envolva seu App com o AuthProvider no index.tsx ou main.tsx
export default App;