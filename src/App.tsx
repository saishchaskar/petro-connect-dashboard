// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import DailyAccountingPage from './pages/DailyAccountingPage';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import { isAppConfigured, isAuthenticated } from './services/auth';

// A protected route wrapper
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  if (!isAppConfigured()) {
    return <Navigate to="/register" replace />;
  }
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DailyAccountingPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;