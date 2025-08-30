import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sistema de Integração - Gestão de Treinamentos</title>
        <meta name="description" content="Sistema completo para organizar e otimizar a agenda de integração de novos colaboradores" />
        <meta property="og:title" content="Sistema de Integração - Gestão de Treinamentos" />
        <meta property="og:description" content="Sistema completo para organizar e otimizar a agenda de integração de novos colaboradores" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            <LoginForm key="login" onLogin={handleLogin} />
          ) : (
            <Dashboard key="dashboard" onLogout={handleLogout} />
          )}
        </AnimatePresence>
        <Toaster />
      </div>
    </>
  );
}

export default App;