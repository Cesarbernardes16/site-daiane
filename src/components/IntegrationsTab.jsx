import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';

const IntegrationsTab = () => {
  const [trainings, setTrainings] = useState([]);
  const [availablePositions, setAvailablePositions] = useState([]);
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [currentWeek, setCurrentWeek] = useState('');

  useEffect(() => {
    // Carregar treinamentos
    const savedTrainings = localStorage.getItem('trainings');
    if (savedTrainings) {
      const trainingsData = JSON.parse(savedTrainings);
      setTrainings(trainingsData);
      
      // Extrair posições únicas
      const positions = [...new Set(trainingsData.map(t => t.funcao))];
      setAvailablePositions(positions);
    }

    // Definir semana atual
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
    const startOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + startOffset);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // Sexta-feira
    
    const formatDate = (date) => {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };
    
    setCurrentWeek(`${formatDate(startOfWeek)} a ${formatDate(endOfWeek)}`);

    // Carregar seleções salvas
    const savedSelections = localStorage.getItem('selectedPositions');
    if (savedSelections) {
      setSelectedPositions(JSON.parse(savedSelections));
    }
  }, []);

  const handlePositionToggle = (position) => {
    const newSelections = selectedPositions.includes(position)
      ? selectedPositions.filter(p => p !== position)
      : [...selectedPositions, position];
    
    setSelectedPositions(newSelections);
    localStorage.setItem('selectedPositions', JSON.stringify(newSelections));
  };

  const generateSchedule = () => {
    if (selectedPositions.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos uma função para gerar a agenda",
        variant: "destructive"
      });
      return;
    }

    // Algoritmo de otimização da agenda
    const selectedTrainings = trainings.filter(t => selectedPositions.includes(t.funcao));
    
    // Agrupar treinamentos iguais
    const groupedTrainings = {};
    selectedTrainings.forEach(training => {
      if (training.tipo !== 'Grupo') {
         const key = `${training.treinamento}-${training.responsavel}-${training.funcao}`;
         if (!groupedTrainings[key]) {
            groupedTrainings[key] = { ...training, funcoes: [training.funcao] };
         }
         return;
      }

      const key = `${training.treinamento}-${training.responsavel}`;
      if (!groupedTrainings[key]) {
        groupedTrainings[key] = {
          ...training,
          funcoes: [training.funcao]
        };
      } else {
        if (!groupedTrainings[key].funcoes.includes(training.funcao)) {
            groupedTrainings[key].funcoes.push(training.funcao);
        }
      }
    });

    const optimizedSchedule = Object.values(groupedTrainings);
    
    // Salvar agenda gerada
    localStorage.setItem('generatedSchedule', JSON.stringify({
      week: currentWeek,
      positions: selectedPositions,
      schedule: optimizedSchedule,
      generatedAt: new Date().toISOString()
    }));

    toast({
      title: "Sucesso!",
      description: `Agenda gerada para ${selectedPositions.length} função(ões). Vá para a aba "Agenda Gerada" para visualizar.`
    });
  };

  const getPositionTrainings = (position) => {
    return trainings.filter(t => t.funcao === position);
  };

  const getTotalHours = (position) => {
    return getPositionTrainings(position).reduce((total, t) => total + t.duracao, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Integrações da Semana</h2>
          <p className="text-gray-600">Semana de {currentWeek}</p>
        </div>
        
        <Button
          onClick={generateSchedule}
          disabled={selectedPositions.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Play className="w-4 h-4 mr-2" />
          Gerar Agenda
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Funções */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-effect rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            Funções Disponíveis
          </h3>
          
          <div className="space-y-4">
            {availablePositions.map((position, index) => {
              const isSelected = selectedPositions.includes(position);
              const positionTrainings = getPositionTrainings(position);
              const totalHours = getTotalHours(position);
              
              return (
                <motion.div
                  key={position}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-300 shadow-md' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePositionToggle(position)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handlePositionToggle(position)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-800">{position}</h4>
                        {isSelected && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {positionTrainings.length} treinamento(s) • {totalHours}h total
                      </p>
                      <div className="space-y-1">
                        {positionTrainings.slice(0, 2).map((training, idx) => (
                          <div key={idx} className="text-xs text-gray-500">
                            • {training.treinamento} ({training.duracao}h)
                          </div>
                        ))}
                        {positionTrainings.length > 2 && (
                          <div className="text-xs text-gray-500">
                            • +{positionTrainings.length - 2} mais...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {availablePositions.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma função disponível</p>
              <p className="text-gray-400 text-sm">Cadastre treinamentos primeiro</p>
            </div>
          )}
        </motion.div>

        {/* Resumo da Seleção */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-effect rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            Resumo da Integração
          </h3>
          
          {selectedPositions.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedPositions.length}
                  </div>
                  <div className="text-sm text-gray-600">Funções</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">
                    {trainings.filter(t => selectedPositions.includes(t.funcao)).reduce((total, t) => total + t.duracao, 0)}h
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">Funções Selecionadas:</h4>
                {selectedPositions.map((position) => (
                  <div key={position} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                    <span className="text-gray-700">{position}</span>
                    <span className="text-sm text-gray-600">{getTotalHours(position)}h</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Otimizações aplicadas:</strong>
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Agrupamento de treinamentos em grupo</li>
                  <li>• Minimização de tempo ocioso</li>
                  <li>• Otimização por instrutor</li>
                  <li>• Respeito aos horários de trabalho</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma função selecionada</p>
              <p className="text-gray-400 text-sm">Selecione as funções que iniciarão a integração</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default IntegrationsTab;