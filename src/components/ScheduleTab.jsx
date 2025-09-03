import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion } from 'framer-motion';
import { Calendar, Printer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";

// Função para formatar a duração
const formatDuration = (totalMinutes) => {
  if (!totalMinutes) return '0m';
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const ItemType = 'TRAINING';

// Componente para um item de treinamento que pode ser arrastado
const DraggableTraining = ({ training, day, period, onDelete }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType,
    item: { training, from: { day, period } },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`relative group p-2 rounded-md shadow-sm text-xs ${isDragging ? 'opacity-50' : ''} ${
        training.tipo === 'Grupo' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
      }`}
    >
      <button
        onClick={() => onDelete(training.id, day, period)}
        className="absolute top-1 right-1 p-0.5 rounded bg-black/10 text-white opacity-0 group-hover:opacity-100 transition-opacity no-print"
      >
        <Trash2 size={12} />
      </button>
      
      <div ref={drag} className="cursor-grab">
        <p className="font-bold pr-4">{training.treinamento}</p>
        <p>{training.responsavel}</p>
        <p className="font-mono text-right">{formatDuration(training.duracao)}</p>
      </div>
    </motion.div>
  );
};

// Componente para uma célula do calendário que pode receber itens
const DroppableCell = ({ day, period, trainings, onMove, onDelete, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (item) => onMove(item, { day, period }),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`p-2 rounded-lg h-full transition-colors ${isOver ? 'bg-yellow-100' : 'bg-gray-50'}`}
    >
      {children}
      <div className="space-y-2 mt-2">
        {trainings.map(t => (
          <DraggableTraining key={t.id} training={t} day={day} period={period} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
};


const ScheduleTab = () => {
    const { toast } = useToast();
    const [schedule, setSchedule] = useState(null);

    useEffect(() => {
        const generateSchedule = () => {
            const savedTrainings = JSON.parse(localStorage.getItem('trainingsForSchedule') || '[]');
            if (savedTrainings.length === 0) {
                setSchedule(null);
                return;
            }

            const sortedTrainings = [...savedTrainings].sort((a, b) => {
                if (a.tipo === 'Grupo' && b.tipo !== 'Grupo') return -1;
                if (a.tipo !== 'Grupo' && b.tipo === 'Grupo') return 1;
                return b.duracao - a.duracao;
            });

            const weekHours = {
                Monday: { Manhã: 240, Tarde: 240, trainings: [] },
                Tuesday: { Manhã: 240, Tarde: 240, trainings: [] },
                Wednesday: { Manhã: 240, Tarde: 240, trainings: [] },
                Thursday: { Manhã: 240, Tarde: 240, trainings: [] },
                Friday: { Manhã: 240, Tarde: 240, trainings: [] },
            };

            const days = Object.keys(weekHours);

            sortedTrainings.forEach(training => {
                let placed = false;
                for (const day of days) {
                    for (const period of ['Manhã', 'Tarde']) {
                        if (weekHours[day][period] >= training.duracao) {
                            weekHours[day].trainings.push({ ...training, period });
                            weekHours[day][period] -= training.duracao;
                            placed = true;
                            break;
                        }
                    }
                    if (placed) break;
                }
            });

            const finalSchedule = {};
            for(const day in weekHours) {
                finalSchedule[day] = {
                    'Manhã': weekHours[day].trainings.filter(t => t.period === 'Manhã'),
                    'Tarde': weekHours[day].trainings.filter(t => t.period === 'Tarde'),
                }
            }
            setSchedule(finalSchedule);
        };

        generateSchedule();
        
        window.addEventListener('storage', generateSchedule);
        return () => window.removeEventListener('storage', generateSchedule);

    }, []);
    
    const moveTraining = (item, to) => {
        const { training, from } = item;
        if (from.day === to.day && from.period === to.period) return;

        setSchedule(prev => {
            const newSchedule = JSON.parse(JSON.stringify(prev));
            const sourceList = newSchedule[from.day][from.period];
            const itemIndex = sourceList.findIndex(t => t.id === training.id);
            
            if (itemIndex > -1) {
                const [movedItem] = sourceList.splice(itemIndex, 1);
                newSchedule[to.day][to.period].push(movedItem);
            }
            
            return newSchedule;
        });
    };
    
    const handleDelete = (trainingId, day, period) => {
        if (window.confirm("Tem certeza que deseja remover este treinamento da agenda?")) {
            setSchedule(prev => {
                const newSchedule = JSON.parse(JSON.stringify(prev));
                newSchedule[day][period] = newSchedule[day][period].filter(t => t.id !== trainingId);
                return newSchedule;
            });
            toast({
                title: "Treinamento removido",
                description: "O treinamento foi removido da agenda desta semana.",
            });
        }
    };
    
    const handlePrint = () => {
        window.print();
    };

    if (!schedule) {
        return (
            <div className="text-center py-20 no-print">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700">Nenhuma agenda gerada</h2>
              <p className="text-gray-500 mt-2">
                Vá para a aba "Integrações da Semana", selecione as funções e clique em "Usar na Agenda".
              </p>
            </div>
        );
    }
    
    const dayNames = {
        Monday: 'Segunda-feira',
        Tuesday: 'Terça-feira',
        Wednesday: 'Quarta-feira',
        Thursday: 'Quinta-feira',
        Friday: 'Sexta-feira',
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="space-y-6" id="schedule-to-print">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">Agenda da Semana</h2>
                        <p className="text-gray-500">Arraste, solte ou exclua os treinamentos para reorganizar a agenda.</p>
                    </div>
                     <div className="flex gap-2">
                        <Button onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir Agenda
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-4">
                    {Object.keys(schedule).map((day) => (
                        <div key={day} className="space-y-4">
                            <h3 className="text-center font-bold text-gray-700">{dayNames[day]}</h3>
                            <div className="space-y-4">
                                <DroppableCell day={day} period="Manhã" trainings={schedule[day]['Manhã']} onMove={moveTraining} onDelete={handleDelete}>
                                    <p className="text-sm font-semibold text-center text-gray-600">Manhã</p>
                                </DroppableCell>
                                <DroppableCell day={day} period="Tarde" trainings={schedule[day]['Tarde']} onMove={moveTraining} onDelete={handleDelete}>
                                    <p className="text-sm font-semibold text-center text-gray-600">Tarde</p>
                                </DroppableCell>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DndProvider>
    );
};

export default ScheduleTab;