import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from "@/components/ui/toaster";
import { Helmet } from 'react-helmet';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Novo estado para armazenar o nível de acesso do usuário
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isAuthenticated') === 'true';
    const role = localStorage.getItem('userRole'); // Busca o nível salvo
    if (loggedIn && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', role); // Salva o nível no localStorage
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole'); // Remove o nível ao sair
  };

  return (
    <>
      <Helmet>
        <title>Sistema de Integração - Gestão de Treinamentos</title>
        <meta name="description" content="Organize e otimize a agenda de integração de novos colaboradores." />
      </Helmet>
      <Toaster />
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <LoginForm key="login" onLogin={handleLogin} />
        ) : (
          // Passa o nível de acesso para o Dashboard
          <Dashboard key="dashboard" onLogout={handleLogout} userRole={userRole} />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;