// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DailyAccountingPage from './pages/DailyAccountingPage';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import StationConfigPage from './pages/StationConfigPage';
import ConsolidatedReportPage from './pages/ConsolidatedReportPage';
import AppLayout from './components/AppLayout';
// Import the image directly to ensure it's processed by the build system
import { isAppConfigured, isAuthenticated } from './services/auth';
import AnalyticsPage from './pages/AnalyticsPage';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  if (!isAppConfigured()) return <Navigate to="/register" replace />;
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    // Use useEffect to set the background image as a CSS variable on the body
    // This ensures the image URL is resolved by Webpack/Vite and applied dynamically.

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
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/config" element={<StationConfigPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;