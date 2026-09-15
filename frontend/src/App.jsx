import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Apps from './pages/Apps';
import Licenses from './pages/Licenses';
import Versions from './pages/Versions';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import ClientPortal from './pages/ClientPortal';
import CloudVariables from './pages/CloudVariables';
import Blacklist from './pages/Blacklist';
import Webhooks from './pages/Webhooks';
import AppUsers from './pages/AppUsers';
import AppSettings from './pages/AppSettings';
import Home from './pages/Home';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><span className="loading-spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><span className="loading-spinner" /></div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/client" element={<ClientPortal />} />
      <Route path="/portal" element={<ClientPortal />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/apps" element={<PrivateRoute><Layout><Apps /></Layout></PrivateRoute>} />
      <Route path="/apps/:id/settings" element={<PrivateRoute><Layout><AppSettings /></Layout></PrivateRoute>} />
      <Route path="/licenses" element={<PrivateRoute><Layout><Licenses /></Layout></PrivateRoute>} />
      <Route path="/versions" element={<PrivateRoute><Layout><Versions /></Layout></PrivateRoute>} />
      <Route path="/app-users" element={<PrivateRoute><Layout><AppUsers /></Layout></PrivateRoute>} />
      <Route path="/variables" element={<PrivateRoute><Layout><CloudVariables /></Layout></PrivateRoute>} />
      <Route path="/blacklist" element={<PrivateRoute><Layout><Blacklist /></Layout></PrivateRoute>} />
      <Route path="/webhooks" element={<PrivateRoute><Layout><Webhooks /></Layout></PrivateRoute>} />
      <Route path="/logs" element={<PrivateRoute><Layout><Logs /></Layout></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Layout><Settings /></Layout></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e1e2a',
              color: '#e8e8ef',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
