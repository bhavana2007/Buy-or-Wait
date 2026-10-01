import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { Messages } from './pages/Messages';
import { CashFlow } from './pages/CashFlow';
import { BuyOrWait } from './pages/BuyOrWait';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Component to handle global 401 events
const SessionManager = () => {
  const { logout } = useAuth();
  
  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
    };
    
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, [logout]);
  
  return null;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SessionManager />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/buy-or-wait" element={<BuyOrWait />} />
                  <Route path="/cash-flow" element={<CashFlow />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/messages" element={<Messages />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
