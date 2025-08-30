import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const ScheduleTab = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [weekSchedule, setWeekSchedule] = useState({});

  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = () => {
    const savedSchedule = localStorage.getItem('generatedSchedule');
    if (savedSchedule) {
      const data = JSON.parse(savedSchedule);
      setScheduleData(data);
      generateWeekSchedule(data.schedule);
    }
  };

  const generateWeekSchedule = (trainings) => {
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const timeSlots = [
      { start: '07:00', end: '11:00', period: 'Manhã' },
      { start: '13:00', end: '17:00', period: 'Tarde' }
    ];

    const schedule = {};
    let currentDay = 0;
    let currentSlot = 0;
    let currentTime = 0;

    // Inicializar estrutura da agenda
    days.forEach(day => {
      schedule[day] = {
        Manhã: [],
        Tarde: []
      };
    });

    // Distribuir treinamentos
    trainings.forEach(training => {
      const duration = training.duracao;
      let remainingHours = duration;

      while (remainingHours > 0 && currentDay < days.length) {
        const day = days[currentDay];
        const slot = timeSlots[currentSlot];
        const availableHours = 4 - currentTime; // 4 horas por período
        const hoursToSchedule = Math.min(remainingHours, availableHours);

        if (hoursToSchedule > 0) {
          const startTime = addHours(slot.start, currentTime);
          const endTime = addHours(startTime, hoursToSchedule);

          schedule[day][slot.period].push({
            ...training,
            startTime,
            endTime,
            duration: hoursToSchedule,
            isPartial: duration > hoursToSchedule
          });

          remainingHours -= hoursToSchedule;
          currentTime += hoursToSchedule;
        }

        // Avançar para próximo slot/dia
        if (currentTime >= 4) {
          currentTime = 0;
          currentSlot++;
          
          // Se for sábado, só tem o período da manhã.
          // Se já passou do período da tarde ou se é sábado e já passou do período da manhã, vai para o próximo dia
          if ((currentDay === 5 && currentSlot >= 1) || (currentSlot >= timeSlots.length)) {
            currentSlot = 0;
            currentDay++;
          }
        }
      }
    });

    setWeekSchedule(schedule);
  };

  const addHours = (time, hours) => {
    const [h, m] = time.split(':').map(Number);
    const newHour = h + hours;
    return `${newHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const exportToPDF = () => {
    toast({
      title: "🚧 Funcionalidade em desenvolvimento",
      description: "A exportação para PDF será implementada em breve!"
    });
  };

  const exportToExcel = () => {
    toast({
      title: "🚧 Funcionalidade em desenvolvimento", 
      description: "A exportação para Excel será implementada em breve!"
    });
  };

  if (!scheduleData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Agenda Gerada</h2>
          <p className="text-gray-600">Visualize e gerencie a agenda de integração</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-xl p-12 text-center shadow-sm"
        >
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma agenda gerada</h3>
          <p className="text-gray-600 mb-6">
            Vá para a aba "Integrações da Semana" e selecione as funções para gerar uma agenda otimizada.
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Agenda Gerada</h2>
          <p className="text-gray-600">Semana de {scheduleData.week}</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={exportToPDF}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button
            onClick={exportToExcel}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-xl p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          Resumo da Integração
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {scheduleData.positions.length}
            </div>
            <div className="text-sm text-gray-600">Funções</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {scheduleData.schedule.length}
            </div>
            <div className="text-sm text-gray-600">Treinamentos</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {scheduleData.schedule.reduce((total, t) => total + t.duracao, 0)}h
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>Otimizações aplicadas:</strong> Treinamentos agrupados por instrutor, 
              horários otimizados para minimizar tempo ocioso.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Calendário Semanal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-effect rounded-xl overflow-hidden shadow-sm"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            Agenda Semanal
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <div className="calendar-grid min-w-[800px]">
            {/* Header */}
            <div className="calendar-cell bg-gray-100 font-medium text-gray-700 text-center">
              Horário
            </div>
            {Object.keys(weekSchedule).map(day => (
              <div key={day} className="calendar-cell bg-gray-100 font-medium text-gray-700 text-center">
                {day}
              </div>
            ))}
            
            {/* Manhã */}
            <div className="calendar-cell bg-gray-50 font-medium text-gray-700 text-center">
              <div className="flex flex-col items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>07:00</span>
                <span>-</span>
                <span>11:00</span>
              </div>
            </div>
            {Object.keys(weekSchedule).map(day => (
              <div key={`${day}-morning`} className="calendar-cell">
                <div className="space-y-1">
                  {weekSchedule[day]?.Manhã?.map((training, index) => (
                    <div
                      key={index}
                      className={`training-block ${
                        training.tipo === 'Individual' ? 'training-individual' : 'training-group'
                      }`}
                    >
                      <div className="font-medium">{training.treinamento}</div>
                      <div className="text-xs">
                        {training.funcoes ? training.funcoes.join(', ') : training.funcao}
                      </div>
                      <div className="text-xs opacity-90">
                        {training.responsavel}
                      </div>
                      <div className="text-xs opacity-70">
                        {training.startTime} - {training.endTime}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Tarde */}
            <div className="calendar-cell bg-gray-50 font-medium text-gray-700 text-center">
              <div className="flex flex-col items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>13:00</span>
                <span>-</span>
                <span>17:00</span>
              </div>
            </div>
            {Object.keys(weekSchedule).map(day => (
              <div key={`${day}-afternoon`} className="calendar-cell">
                <div className="space-y-1">
                  {weekSchedule[day]?.Tarde?.map((training, index) => (
                    <div
                      key={index}
                      className={`training-block ${
                        training.tipo === 'Individual' ? 'training-individual' : 'training-group'
                      }`}
                    >
                      <div className="font-medium">{training.treinamento}</div>
                      <div className="text-xs">
                        {training.funcoes ? training.funcoes.join(', ') : training.funcao}
                      </div>
                      <div className="text-xs opacity-90">
                        {training.responsavel}
                      </div>
                      <div className="text-xs opacity-70">
                        {training.startTime} - {training.endTime}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Legenda */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-effect rounded-xl p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Legenda</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-50 border-l-4 border-blue-500 rounded"></div>
            <span className="text-sm text-gray-700">Treinamento Individual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border-l-4 border-green-500 rounded"></div>
            <span className="text-sm text-gray-700">Treinamento em Grupo</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ScheduleTab;