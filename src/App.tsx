// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DailyAccountingPage from './pages/DailyAccountingPage';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import StationConfigPage from './pages/StationConfigPage';
import ConsolidatedReportPage from './pages/ConsolidatedReportPage';
import AppLayout from './components/AppLayout';
import { isAppConfigured, isAuthenticated } from './services/auth';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  if (!isAppConfigured()) return <Navigate to="/register" replace />;
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes (With Navbar) */}
        <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
        }>
            <Route path="/dashboard" element={<DailyAccountingPage />} />
            <Route path="/consolidated" element={<ConsolidatedReportPage />} />
            <Route path="/config" element={<StationConfigPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;