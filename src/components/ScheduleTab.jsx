import React, { useState, useEffect, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion } from 'framer-motion';
import { Calendar, Printer, Trash2, Eraser, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";

// Função para gerar uma cor pastel aleatória
const getRandomPastelColor = () => {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(Math.random() * 25) + 75; // Saturação entre 75% e 100%
  const l = Math.floor(Math.random() * 15) + 80; // Luminosidade entre 80% e 95%
  return `hsl(${h}, ${s}%, ${l}%)`;
};

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

// --- Componente DraggableTraining atualizado para usar cores dinâmicas ---
const DraggableTraining = ({ training, day, period, onDelete, color }) => {
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
      style={{ backgroundColor: color, color: '#374151' }} // Usa a cor passada como prop
      className={`relative group p-2 rounded-md shadow-sm text-xs ${isDragging ? 'opacity-50' : ''}`}
    >
      <button
        onClick={() => onDelete(training.id, day, period)}
        className="absolute top-1 right-1 p-0.5 rounded bg-black/20 text-white opacity-0 group-hover:opacity-100 transition-opacity no-print"
      >
        <Trash2 size={12} />
      </button>
      
      <div ref={drag} className="cursor-grab space-y-1">
        <div className="flex justify-between items-start">
            <p className="font-bold pr-2 flex-1 break-words">{training.treinamento}</p>
            <p className="font-mono text-xs bg-black/10 px-1.5 py-0.5 rounded">{formatDuration(training.duracao)}</p>
        </div>
        <div className="text-[11px] space-y-0.5">
            <p><span className="font-semibold">Responsável:</span> {training.responsavel}</p>
            <p><span className="font-semibold">Tipo:</span> {training.tipo}</p>
            <p><span className="font-semibold">Funções:</span> {Array.isArray(training.funcao) ? training.funcao.join(', ') : training.funcao}</p>
        </div>
      </div>
    </motion.div>
  );
};

// --- Componente DroppableCell atualizado para passar a cor ---
const DroppableCell = ({ day, period, trainings, onMove, onDelete, colorMap, children }) => {
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
          <DraggableTraining 
            key={t.id} 
            training={t} 
            day={day} 
            period={period} 
            onDelete={onDelete}
            color={colorMap[t.responsavel] || '#E5E7EB'} // Passa a cor do mapa
          />
        ))}
      </div>
    </div>
  );
};


const ScheduleTab = () => {
    const { toast } = useToast();
    const [schedule, setSchedule] = useState(null);
    const [responsibleColors, setResponsibleColors] = useState({});

    // Carrega cores salvas do localStorage ao iniciar
    useEffect(() => {
        const savedColors = JSON.parse(localStorage.getItem('responsibleColors') || '{}');
        setResponsibleColors(savedColors);
    }, []);

    // --- LÓGICA DE GERAÇÃO DA AGENDA TOTALMENTE REFEITA ---
    useEffect(() => {
        const generateSchedule = () => {
            const savedTrainings = JSON.parse(localStorage.getItem('trainingsForSchedule') || '[]');
            if (savedTrainings.length === 0) {
                setSchedule(null);
                return;
            }

            // 1. Agrupar treinamentos por responsável
            const trainingsByResponsible = savedTrainings.reduce((acc, training) => {
                const { responsavel } = training;
                if (!acc[responsavel]) {
                    acc[responsavel] = [];
                }
                acc[responsavel].push(training);
                // Ordena os treinamentos de cada responsável pelo maior tempo
                acc[responsavel].sort((a, b) => b.duracao - a.duracao);
                return acc;
            }, {});

            // 2. Preparar a estrutura da semana
            const weekHours = {
                Monday: { Manhã: 240, Tarde: 240, trainings: [] },
                Tuesday: { Manhã: 240, Tarde: 240, trainings: [] },
                Wednesday: { Manhã: 240, Tarde: 240, trainings: [] },
                Thursday: { Manhã: 240, Tarde: 240, trainings: [] },
                Friday: { Manhã: 240, Tarde: 240, trainings: [] },
            };
            const days = Object.keys(weekHours);
            
            // 3. Distribuir os treinamentos
            for (const responsible in trainingsByResponsible) {
                const tasks = trainingsByResponsible[responsible];
                let placedAll = false;

                // Tenta colocar todos os treinamentos do responsável no mesmo dia
                for (const day of days) {
                    const totalDuration = tasks.reduce((sum, t) => sum + t.duracao, 0);
                    if (weekHours[day]['Manhã'] + weekHours[day]['Tarde'] >= totalDuration) {
                        tasks.forEach(task => {
                            if (weekHours[day]['Manhã'] >= task.duracao) {
                                weekHours[day].trainings.push({ ...task, period: 'Manhã' });
                                weekHours[day]['Manhã'] -= task.duracao;
                            } else {
                                weekHours[day].trainings.push({ ...task, period: 'Tarde' });
                                weekHours[day]['Tarde'] -= task.duracao;
                            }
                        });
                        placedAll = true;
                        break;
                    }
                }

                // Se não coube no mesmo dia, distribui pela semana
                if (!placedAll) {
                    tasks.forEach(task => {
                        let placed = false;
                        for (const day of days) {
                            for (const period of ['Manhã', 'Tarde']) {
                                if (weekHours[day][period] >= task.duracao) {
                                    weekHours[day].trainings.push({ ...task, period });
                                    weekHours[day][period] -= task.duracao;
                                    placed = true;
                                    break;
                                }
                            }
                            if (placed) break;
                        }
                    });
                }
            }
            
            // 4. Formatar o resultado final
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

    // --- Lógica para Cores Customizáveis ---
    const uniqueResponsibles = useMemo(() => {
        if (!schedule) return [];
        const responsibles = new Set();
        Object.values(schedule).forEach(day => {
            Object.values(day).forEach(period => {
                period.forEach(training => responsibles.add(training.responsavel));
            });
        });
        return Array.from(responsibles).sort();
    }, [schedule]);
    
    // Gera cores aleatórias para novos responsáveis
    useEffect(() => {
        const newColors = { ...responsibleColors };
        let hasChanged = false;
        uniqueResponsibles.forEach(name => {
            if (!newColors[name]) {
                newColors[name] = getRandomPastelColor();
                hasChanged = true;
            }
        });
        if (hasChanged) {
            setResponsibleColors(newColors);
        }
    }, [uniqueResponsibles]);

    const handleColorChange = (responsible, color) => {
        const newColors = { ...responsibleColors, [responsible]: color };
        setResponsibleColors(newColors);
        localStorage.setItem('responsibleColors', JSON.stringify(newColors));
    };
    
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
    
    const handlePrint = () => window.print();

    const handleClearSchedule = () => {
        if (window.confirm("Tem certeza que deseja limpar toda a agenda da semana? Esta ação não pode ser desfeita.")) {
            setSchedule(null);
            localStorage.removeItem('trainingsForSchedule');
            toast({
                title: "Agenda Limpa!",
                description: "A agenda foi reiniciada com sucesso.",
            });
        }
    };

    if (!schedule) {
        return (
            <div className="text-center py-20 no-print">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700">Nenhuma agenda gerada</h2>
              <p className="text-gray-500 mt-2">
                Vá para a aba "Integrações da Semana" para iniciar um novo planejamento.
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
                        <p className="text-gray-500">Arraste e solte para reorganizar e defina cores para os responsáveis.</p>
                    </div>
                     <div className="flex gap-2">
                        <Button onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir
                        </Button>
                        <Button onClick={handleClearSchedule} variant="destructive">
                            <Eraser className="w-4 h-4 mr-2" />
                            Limpar Agenda
                        </Button>
                    </div>
                </div>

                {/* --- PAINEL DE CONTROLE DE CORES --- */}
                <div className="p-4 bg-white border rounded-lg no-print">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Palette size={16}/>Controle de Cores</h3>
                    <div className="flex flex-wrap gap-4">
                        {uniqueResponsibles.map(name => (
                            <div key={name} className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={responsibleColors[name] || '#ffffff'}
                                    onChange={(e) => handleColorChange(name, e.target.value)}
                                    className="w-6 h-6 rounded-full border cursor-pointer"
                                />
                                <span className="text-sm text-gray-600">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-4">
                    {Object.keys(schedule).map((day) => (
                        <div key={day} className="space-y-4">
                            <h3 className="text-center font-bold text-gray-700">{dayNames[day]}</h3>
                            <div className="space-y-4">
                                <DroppableCell day={day} period="Manhã" trainings={schedule[day]['Manhã']} onMove={moveTraining} onDelete={handleDelete} colorMap={responsibleColors}>
                                    <p className="text-sm font-semibold text-center text-gray-600">Manhã</p>
                                </DroppableCell>
                                <DroppableCell day={day} period="Tarde" trainings={schedule[day]['Tarde']} onMove={moveTraining} onDelete={handleDelete} colorMap={responsibleColors}>
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