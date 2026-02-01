// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DailyAccountingPage from './pages/DailyAccountingPage';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import StationConfigPage from './pages/StationConfigPage';
import AppLayout from './components/AppLayout'; // Import the layout
import { isAppConfigured, isAuthenticated } from './services/auth';

// Guard for protected pages
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  if (!isAppConfigured()) {
    // If station never set up, force registration
    return <Navigate to="/register" replace />;
  }
  if (!isAuthenticated()) {
    // If not logged in, force login
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public Routes (No Navbar) --- */}
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* --- Protected Routes (With Navbar) --- */}
        <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
        }>
            {/* These pages render INSIDE the AppLayout's <Outlet/> */}
            <Route path="/dashboard" element={<DailyAccountingPage />} />
            <Route path="/config" element={<StationConfigPage />} />
        </Route>
        
        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;