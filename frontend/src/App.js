import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import PageTransition from './components/PageTransition';
import Dashboard from './pages/Dashboard';
import Ideas from './pages/Ideas';
import IdeaDetail from './pages/IdeaDetail';
import IdeaForm from './pages/IdeaForm';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const location = useLocation();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Layout>
        <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition>
            <Dashboard />
          </PageTransition>
        } />
        <Route path="/dashboard" element={
          <PageTransition>
            <Dashboard />
          </PageTransition>
        } />
        <Route path="/ideas" element={
          <PageTransition>
            <Ideas />
          </PageTransition>
        } />
        <Route path="/ideas/new" element={
          <PageTransition>
            <IdeaForm />
          </PageTransition>
        } />
        <Route path="/ideas/:id" element={
          <PageTransition>
            <IdeaDetail />
          </PageTransition>
        } />
        <Route path="/ideas/:id/edit" element={
          <PageTransition>
            <IdeaForm />
          </PageTransition>
        } />
        <Route path="/login" element={
          <PageTransition>
            <Login />
          </PageTransition>
        } />
        <Route path="/register" element={
          <PageTransition>
            <Register />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
          </Layout>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 