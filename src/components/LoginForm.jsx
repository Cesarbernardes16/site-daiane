import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mail, KeyRound, CheckCircle } from 'lucide-react';

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false); // Novo estado para controlar a tela de boas-vindas
  const { toast } = useToast();

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      let userRole = null;
      let welcomeName = '';

      if (username === 'Daiane' && password === 'Maia@321') {
        userRole = 'admin';
        welcomeName = 'Daiane';
      } else if (username === 'Integração' && password === 'mudar@123') {
        userRole = 'user';
        welcomeName = 'Equipe de Integração';
      }

      if (userRole) {
        setUsername(welcomeName); // Atualiza o nome para exibição
        setShowWelcome(true); // Ativa a tela de boas-vindas

        // Aguarda 2.5 segundos e então carrega o dashboard
        setTimeout(() => {
          onLogin(userRole);
        }, 2500);

      } else {
        toast({
          title: "Erro de Login",
          description: "Usuário ou senha inválidos.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="relative w-full max-w-4xl h-[550px]">
        <AnimatePresence>
          {showWelcome ? (
            // ===== TELA DE BOAS-VINDAS =====
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-blue-600 rounded-2xl flex flex-col items-center justify-center text-white text-center p-8"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 120 }}
              >
                <CheckCircle className="w-24 h-24 mx-auto mb-6" />
                <h1 className="text-5xl font-bold mb-2">Bem-vindo(a),</h1>
                <p className="text-4xl font-light">{username}!</p>
              </motion.div>
            </motion.div>
          ) : (
            // ===== TELA DE LOGIN (ORIGINAL) =====
            <motion.div
              key="login-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full bg-white rounded-2xl shadow-2xl flex overflow-hidden"
            >
              {/* Coluna da Esquerda - Formulário */}
              <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Login</h2>
                <p className="text-gray-500 mb-8">Por favor, insira seus dados para continuar</p>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Usuário"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-end text-sm">
                    <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                      Esqueceu a senha?
                    </a>
                  </div>
                  <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg" disabled={isLoading}>
                    {isLoading ? 'Verificando...' : 'LOG IN'}
                  </Button>
                </form>
              </div>

              {/* Coluna da Direita - Boas-vindas */}
              <div className="hidden md:flex w-1/2 bg-blue-600 p-12 text-white flex-col justify-center items-center text-center relative overflow-hidden">
                <div className="wavy-background"></div>
                <div className="z-10">
                  <h1 className="text-4xl font-bold mb-4">Olá de Novo!</h1>
                  <p>Insira seus dados para começar a gerenciar as integrações.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LoginForm;