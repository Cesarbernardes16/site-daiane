import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, ListChecks, Clock, CalendarPlus } from 'lucide-react';

// Função para formatar a duração
const formatDuration = (totalMinutes) => {
  if (totalMinutes === null || totalMinutes === undefined) return '0m';
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const IntegrationsTab = () => {
  const { toast } = useToast();
  const [allFunctions, setAllFunctions] = useState([]);
  const [selectedFunctions, setSelectedFunctions] = useState({});
  const [trainingsForWeek, setTrainingsForWeek] = useState([]);
  const [loadingFunctions, setLoadingFunctions] = useState(true);
  const [loadingTrainings, setLoadingTrainings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFunctions = async () => {
      setLoadingFunctions(true);
      try {
        const { data, error } = await supabase.rpc('get_distinct_functions');
        if (error) throw error;
        const functionNames = data.map(item => item.funcao);
        setAllFunctions(functionNames || []);
      } catch (error) {
        toast({
          title: "Erro ao buscar funções",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoadingFunctions(false);
      }
    };
    fetchFunctions();
  }, [toast]);

  useEffect(() => {
    const fetchTrainings = async () => {
      const selected = Object.keys(selectedFunctions).filter(key => selectedFunctions[key]);
      
      if (selected.length === 0) {
        setTrainingsForWeek([]);
        return;
      }

      setLoadingTrainings(true);
      try {
        const { data, error } = await supabase
          .from('trainings')
          .select('*')
          .in('funcao', selected);

        if (error) throw error;
        
        const uniqueTrainings = Array.from(new Map(data.map(item => [item.treinamento, item])).values());
        setTrainingsForWeek(uniqueTrainings);

      } catch (error) {
        toast({
          title: "Erro ao buscar treinamentos",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoadingTrainings(false);
      }
    };

    fetchTrainings();
  }, [selectedFunctions, toast]);

  const handleFunctionToggle = (funcName) => {
    setSelectedFunctions(prev => ({
      ...prev,
      [funcName]: !prev[funcName]
    }));
  };

  const handleSaveToSchedule = () => {
    localStorage.setItem('trainingsForSchedule', JSON.stringify(trainingsForWeek));
    toast({
      title: "Sucesso!",
      description: "Treinamentos salvos e prontos para gerar a agenda.",
    });
  };

  const filteredFunctions = allFunctions.filter(func =>
    func.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Coluna da Esquerda: Seleção de Funções */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">1. Selecione as Funções</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar função..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-white p-4 rounded-lg border h-96 overflow-y-auto">
          {loadingFunctions ? (
            <p className="text-gray-500 text-center py-4">Carregando funções...</p>
          ) : (
            <ul className="space-y-3">
              {filteredFunctions.map(func => (
                <li key={func} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                  <Checkbox
                    id={func}
                    checked={!!selectedFunctions[func]}
                    onCheckedChange={() => handleFunctionToggle(func)}
                  />
                  <label htmlFor={func} className="flex-1 cursor-pointer text-sm font-medium text-gray-700">
                    {func}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Coluna da Direita: Treinamentos da Semana */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">2. Treinamentos da Semana</h2>
        <div className="bg-white p-4 rounded-lg border h-96 overflow-y-auto">
          {loadingTrainings ? (
            <p className="text-gray-500 text-center py-4">Buscando treinamentos...</p>
          ) : trainingsForWeek.length > 0 ? (
            <ul className="space-y-2">
              <AnimatePresence>
                {trainingsForWeek.map((training, index) => (
                  <motion.li
                    key={training.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="text-sm p-2 bg-gray-50 rounded-md flex justify-between items-center"
                  >
                    <span>{training.treinamento}</span>
                    <span className="font-mono text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">{formatDuration(training.duracao)}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          ) : (
             <div className="text-center py-16">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Selecione uma ou mais funções</p>
                <p className="text-gray-400 text-sm">para ver os treinamentos necessários.</p>
              </div>
          )}
        </div>
        
        {/* ===== AJUSTE REALIZADO AQUI ===== */}
        <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
            <div>
                <p className="text-xs text-gray-600">Treinamentos Selecionados</p>
                <p className="font-bold text-lg">{trainingsForWeek.length}</p>
            </div>
          <Button onClick={handleSaveToSchedule} disabled={trainingsForWeek.length === 0}>
            <CalendarPlus className="w-4 h-4 mr-2" />
            Usar na Agenda
          </Button>
        </div>
        {/* ================================== */}

      </div>
    </div>
  );
};

export default IntegrationsTab;