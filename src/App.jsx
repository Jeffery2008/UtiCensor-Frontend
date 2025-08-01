import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import Layout from '@/components/Layout';
import Login from '@/components/Login';
import Dashboard from '@/components/Dashboard';
import Devices from '@/components/Devices';
import RouterZones from '@/components/RouterZones';
import RouterMapping from '@/components/RouterMapping';
import RouterOverview from '@/components/RouterOverview';
import AuthInitializer from '@/components/AuthInitializer';
import './App.css';

// Protected Route component
function ProtectedRoute({ children }) {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  if (!hasHydrated) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Public Route component (redirect to dashboard if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  if (!hasHydrated) return null;
  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <Router>
      <AuthInitializer />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="flows" element={<div>Network Flows (Coming Soon)</div>} />
          <Route path="devices" element={<Devices />} />
          <Route path="router-zones" element={<RouterZones />} />
          <Route path="router-overview" element={<RouterOverview />} />
          <Route path="router-mapping" element={<RouterMapping />} />
          <Route path="filters" element={<div>Filters (Coming Soon)</div>} />
          <Route path="analytics" element={<div>Analytics (Coming Soon)</div>} />
          <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
          <Route path="profile" element={<div>Profile (Coming Soon)</div>} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

