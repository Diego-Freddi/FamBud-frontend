import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AppLayout from './components/Layout/AppLayout';
import lightTheme from './styles/theme';

// Import delle pagine
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CreateFamilyPage from './pages/CreateFamilyPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Route pubbliche */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            
            {/* Route per creazione famiglia */}
            <Route 
              path="/create-family" 
              element={
                <PrivateRoute>
                  <CreateFamilyPage />
                </PrivateRoute>
              } 
            />
            
            {/* Route protette con layout */}
            <Route 
              path="/" 
              element={
                <PrivateRoute requireFamily={true}>
                  <AppLayout />
                </PrivateRoute>
              }
            >
              {/* Route annidate che usano il layout */}
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="expenses" element={<div>Pagina Spese (da implementare)</div>} />
              <Route path="incomes" element={<div>Pagina Entrate (da implementare)</div>} />
              <Route path="budgets" element={<div>Pagina Budget (da implementare)</div>} />
              <Route path="categories" element={<div>Pagina Categorie (da implementare)</div>} />
              <Route path="family" element={<div>Pagina Famiglia (da implementare)</div>} />
              <Route path="settings" element={<div>Pagina Impostazioni (da implementare)</div>} />
              <Route path="profile" element={<div>Pagina Profilo (da implementare)</div>} />
              
              {/* Redirect root alla dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />
            </Route>
            
            {/* 404 - Redirect al login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
