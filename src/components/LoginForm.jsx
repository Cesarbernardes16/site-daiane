import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mail, KeyRound } from 'lucide-react';

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      let userRole = null;

      if (username === 'Daiane' && password === 'Maia@321') {
        userRole = 'admin';
      } else if (username === 'Integração' && password === 'mudar@123') {
        userRole = 'user';
      }

      if (userRole) {
        toast({
          title: "Login bem-sucedido!",
          description: `Bem-vindo, ${username}!`,
        });
        onLogin(userRole);
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
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-4xl h-[550px] bg-white rounded-2xl shadow-2xl flex overflow-hidden"
      >
        {/* Coluna da Esquerda - Formulário */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Login</h2>
            <p className="text-gray-500 mb-8">Por favor, insira seus dados para continuar</p>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Usuário ou Email"
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

              <div className="flex items-center justify-between text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Esqueceu a senha?
                </a>
              </div>

              <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'LOG IN'}
              </Button>
            </form>
          </motion.div>
        </div>

        {/* Coluna da Direita - Boas-vindas */}
        <div className="hidden md:flex w-1/2 bg-blue-600 p-12 text-white flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="wavy-background"></div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="z-10"
          >
            <h1 className="text-4xl font-bold mb-4">Bem-vindo!</h1>
            <p className="mb-8">Insira seus dados e comece sua jornada conosco.</p>
            {/* O BOTÃO "CADASTRE-SE" FOI REMOVIDO DAQUI */}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;