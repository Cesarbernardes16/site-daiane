import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const ScheduleTab = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [weekSchedule, setWeekSchedule] = useState({});
  const [draggingItem, setDraggingItem] = useState(null);

  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = () => {
    try {
      const savedSchedule = localStorage.getItem('generatedSchedule');
      if (savedSchedule) {
        const data = JSON.parse(savedSchedule);
        setScheduleData(data);
        if (data.weekSchedule) {
          setWeekSchedule(data.weekSchedule);
        } else if (data.schedule) {
          generateWeekSchedule(data.schedule);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados da agenda:", error);
      localStorage.removeItem('generatedSchedule');
    }
  };

  const saveSchedule = (newWeekSchedule) => {
    if (!scheduleData) return;
    const newScheduleData = { ...scheduleData, weekSchedule: newWeekSchedule };
    setScheduleData(newScheduleData);
    localStorage.setItem('generatedSchedule', JSON.stringify(newScheduleData));
  };

  const generateWeekSchedule = (trainings) => {
    const timeSlots = [
      { start: '07:00', end: '11:00', period: 'Manhã' },
      { start: '13:00', end: '17:00', period: 'Tarde' }
    ];

    const schedule = {};
    days.forEach(day => {
      schedule[day] = { Manhã: [], Tarde: [] };
    });

    if (!trainings) return;

    let currentDay = 0;
    let currentSlot = 0;
    let currentTime = 0;

    trainings.forEach((training, index) => {
      const duration = training.duracao;
      let remainingHours = duration;

      while (remainingHours > 0 && currentDay < days.length) {
        const day = days[currentDay];
        const slot = timeSlots[currentSlot];
        const availableHours = 4 - currentTime;
        const hoursToSchedule = Math.min(remainingHours, availableHours);

        if (hoursToSchedule > 0) {
          const startTime = addHours(slot.start, currentTime);
          const endTime = addHours(startTime, hoursToSchedule);

          schedule[day][slot.period].push({
            ...training,
            id: training.id || `training-${Date.now()}-${index}`,
            startTime,
            endTime,
            duration: hoursToSchedule,
            isPartial: duration > hoursToSchedule
          });

          remainingHours -= hoursToSchedule;
          currentTime += hoursToSchedule;
        }

        if (currentTime >= 4) {
          currentTime = 0;
          currentSlot++;
          if ((currentDay === 5 && currentSlot >= 1) || (currentSlot >= timeSlots.length)) {
            currentSlot = 0;
            currentDay++;
          }
        }
      }
    });

    setWeekSchedule(schedule);
    saveSchedule(schedule);
  };
  
  const handleDragStart = (item, day, period) => {
    setDraggingItem({ ...item, sourceDay: day, sourcePeriod: period });
  };
  
  const handleDrop = (targetDay, targetPeriod) => {
    if (!draggingItem) return;

    const { sourceDay, sourcePeriod, id } = draggingItem;
    
    if (sourceDay === targetDay && sourcePeriod === targetPeriod) {
        setDraggingItem(null);
        return;
    }

    const newSchedule = JSON.parse(JSON.stringify(weekSchedule));

    const sourceList = newSchedule[sourceDay]?.[sourcePeriod] || [];
    const targetList = newSchedule[targetDay]?.[targetPeriod] || [];
    
    const itemIndex = sourceList.findIndex(t => t.id === id);
    if (itemIndex > -1) {
      const [movedItem] = sourceList.splice(itemIndex, 1);
      targetList.push(movedItem);
      
      setWeekSchedule(newSchedule);
      saveSchedule(newSchedule);
      
      toast({
        title: "Agenda Atualizada!",
        description: `Treinamento movido de ${sourceDay} para ${targetDay}.`
      });
    }

    setDraggingItem(null);
  };

  const addHours = (time, hours) => {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + hours * 60;
    const newHour = Math.floor(totalMinutes / 60);
    const newMinute = totalMinutes % 60;
    return `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
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
          className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm"
        >
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma agenda gerada</h3>
          <p className="text-gray-600 mb-6">
            Vá para a aba "Integrações da Semana" e selecione as funções para gerar uma agenda otimizada.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
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
          <Button onClick={exportToPDF} variant="outline">
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button onClick={exportToExcel} variant="outline">
            <Download className="w-4 h-4 mr-2" /> Excel
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          Resumo da Integração
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {scheduleData?.positions?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Funções</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {scheduleData?.schedule?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Treinamentos</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {(scheduleData?.schedule?.reduce((total, t) => total + t.duracao, 0)) || 0}h
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            Agenda Semanal
          </h3>
        </div>
        <div className="overflow-x-auto p-2">
          <div className="calendar-grid min-w-[800px]">
            <div className="calendar-cell calendar-header">Horário</div>
            {days.map(day => (
              <div key={day} className="calendar-cell calendar-header">{day}</div>
            ))}
            
            <div className="calendar-cell calendar-time-col">
                <Clock className="w-4 h-4 mb-1" />
                <span>07:00 - 11:00</span>
            </div>
            {days.map(day => (
              <motion.div 
                key={`${day}-morning`} 
                className="calendar-cell"
                onDrop={() => handleDrop(day, 'Manhã')}
                onDragOver={(e) => e.preventDefault()}
              >
                {/* A DIV INTERNA com 'space-y-2' FOI REMOVIDA DAQUI */}
                {weekSchedule[day]?.Manhã?.map((training) => (
                  <motion.div
                    key={training.id}
                    drag
                    onDragStart={() => handleDragStart(training, day, 'Manhã')}
                    whileDrag={{ scale: 1.05, zIndex: 50, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
                    className={`training-block cursor-grab h-24 flex flex-col justify-center ${training.tipo === 'Individual' ? 'training-individual' : 'training-group'}`}
                  >
                    <div className="font-semibold truncate">{training.treinamento}</div>
                    <div className="text-xs truncate">{training.funcoes ? training.funcoes.join(', ') : training.funcao}</div>
                    <div className="text-xs opacity-90 truncate mt-1">{training.responsavel}</div>
                    <div className="text-xs opacity-70 truncate">{training.startTime} - {training.endTime}</div>
                  </motion.div>
                ))}
              </motion.div>
            ))}
            
            <div className="calendar-cell calendar-time-col">
                <Clock className="w-4 h-4 mb-1" />
                <span>13:00 - 17:00</span>
            </div>
            {days.map(day => (
              <motion.div 
                key={`${day}-afternoon`} 
                className="calendar-cell"
                onDrop={() => handleDrop(day, 'Tarde')}
                onDragOver={(e) => e.preventDefault()}
              >
                {/* E A DIV INTERNA FOI REMOVIDA DAQUI TAMBÉM */}
                {weekSchedule[day]?.Tarde?.map((training) => (
                   <motion.div
                    key={training.id}
                    drag
                    onDragStart={() => handleDragStart(training, day, 'Tarde')}
                    whileDrag={{ scale: 1.05, zIndex: 50, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
                    className={`training-block cursor-grab h-24 flex flex-col justify-center ${training.tipo === 'Individual' ? 'training-individual' : 'training-group'}`}
                  >
                    <div className="font-semibold truncate">{training.treinamento}</div>
                    <div className="text-xs truncate">{training.funcoes ? training.funcoes.join(', ') : training.funcao}</div>
                    <div className="text-xs opacity-90 truncate mt-1">{training.responsavel}</div>
                    <div className="text-xs opacity-70 truncate">{training.startTime} - {training.endTime}</div>
                  </motion.div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
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