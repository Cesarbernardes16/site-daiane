import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useToast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2, BookOpen, Clock, User, Upload, Search } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const TrainingsTab = ({ userRole }) => {
  const { toast } = useToast();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [formData, setFormData] = useState({
    funcao: '',
    treinamento: '',
    duracao: '',
    responsavel: '',
    tipo: 'Individual'
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    getTrainings();
  }, []);

  async function getTrainings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrainings(data || []);
    } catch (error) {
      toast({
        title: "Erro ao buscar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredTrainings = trainings.filter(
    (training) =>
      (training.funcao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (training.treinamento || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.funcao || !formData.treinamento || !formData.duracao || !formData.responsavel) {
      toast({ title: "Erro", description: "Todos os campos são obrigatórios", variant: "destructive" });
      return;
    }
    const trainingData = { ...formData, duracao: parseInt(formData.duracao) };

    try {
        if (editingTraining) {
            const { data, error } = await supabase.from('trainings').update(trainingData).eq('id', editingTraining.id).select();
            if (error) throw error;
            setTrainings(trainings.map(t => (t.id === data[0].id ? data[0] : t)));
            toast({ title: "Sucesso!", description: "Treinamento atualizado." });
        } else {
            const { data, error } = await supabase.from('trainings').insert(trainingData).select();
            if (error) throw error;
            setTrainings([data[0], ...trainings]);
            toast({ title: "Sucesso!", description: "Treinamento adicionado." });
        }
        setIsDialogOpen(false);
        setEditingTraining(null);
        setFormData({ funcao: '', treinamento: '', duracao: '', responsavel: '', tipo: 'Individual' });
    } catch (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Esta ação excluirá o treinamento permanentemente. Deseja continuar?")) {
        try {
            const { error } = await supabase.from('trainings').delete().eq('id', id);
            if (error) throw error;
            setTrainings(trainings.filter(t => t.id !== id));
            toast({ title: "Sucesso", description: "Treinamento excluído." });
        } catch (error) {
            toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        }
    }
  };

  const handleEdit = (training) => {
    setEditingTraining(training);
    setFormData({ ...training, duracao: training.duracao.toString() });
    setIsDialogOpen(true);
  };

  const handleImportCSV = (event) => {
    // PONTO DE VERIFICAÇÃO 1
    console.log('--- Passo 1: Função handleImportCSV foi chamada ---');
    const file = event.target.files[0];
    if (!file) return;

    // PONTO DE VERIFICAÇÃO 2
    console.log('--- Passo 2: Arquivo selecionado:', file.name, '---');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        // PONTO DE VERIFICAÇÃO 3
        console.log('--- Passo 3: Papa.parse completou a leitura. Dados brutos:', results.data, '---');
        
        const trainingsToImport = results.data.map(row => ({
          funcao: row.Função || row.funcao,
          treinamento: row.Treinamento || row.treinamento,
          duracao: parseInt(row['Duração (minutos)'] || row.duracao, 10),
          responsavel: row.Responsável || row.responsavel,
          tipo: row.Tipo || row.tipo || 'Individual'
        })).filter(t => t.funcao && t.treinamento && !isNaN(t.duracao) && t.responsavel);

        // PONTO DE VERIFICAÇÃO 4
        console.log('--- Passo 4: Dados filtrados e prontos para importar:', trainingsToImport, '---');

        if (trainingsToImport.length === 0) {
          toast({
            title: "Arquivo Vazio ou Inválido",
            description: "O CSV não contém dados válidos ou as colunas não foram reconhecidas.",
            variant: "destructive"
          });
          return;
        }

        // PONTO DE VERIFICAÇÃO 5
        console.log("--- Passo 5: PRESTES A CHAMAR A FUNÇÃO SUPABASE ---");
        const { data, error } = await supabase.functions.invoke('import-csv', {
          body: { trainings: trainingsToImport },
        });

        // PONTO DE VERIFICAÇÃO 6
        console.log("--- Passo 6: CHAMADA DA FUNÇÃO SUPABASE CONCLUÍDA ---", { data, error });

        if (error) {
          toast({
            title: "Erro na importação",
            description: `Ocorreu um erro: ${error.message}`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sucesso!",
            description: data.message || `${trainingsToImport.length} treinamentos importados com sucesso.`
          });
          getTrainings();
        }
      },
      error: (error) => {
        console.error('--- ERRO NO PAPA.PARSE:', error, '---');
        toast({
          title: "Erro ao ler o arquivo",
          description: error.message,
          variant: "destructive"
        });
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatDuration = (totalMinutes) => {
      if (!totalMinutes) return '0m';
      if (totalMinutes < 60) return `${totalMinutes}m`;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (minutes === 0) return `${hours}h`;
      return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Gestão de Treinamentos</h2>
          <p className="text-gray-500">Configure os treinamentos obrigatórios para cada função.</p>
        </div>
        <div className="flex gap-2">
          
          {userRole === 'admin' && (
            <>
              <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
              <Button variant="outline" onClick={() => fileInputRef.current.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Importar CSV
              </Button>
            </>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingTraining(null); setFormData({ funcao: '', treinamento: '', duracao: '', responsavel: '', tipo: 'Individual' }); setIsDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white text-gray-900 max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTraining ? 'Editar Treinamento' : 'Novo Treinamento'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="funcao">Função</Label><Input id="funcao" value={formData.funcao} onChange={(e) => setFormData(prev => ({ ...prev, funcao: e.target.value }))} placeholder="Ex: Motorista" /></div>
                <div className="space-y-2"><Label htmlFor="treinamento">Treinamento</Label><Input id="treinamento" value={formData.treinamento} onChange={(e) => setFormData(prev => ({ ...prev, treinamento: e.target.value }))} placeholder="Nome do treinamento" /></div>
                <div className="space-y-2"><Label htmlFor="duracao">Duração (minutos)</Label><Input id="duracao" type="number" min="1" value={formData.duracao} onChange={(e) => setFormData(prev => ({ ...prev, duracao: e.target.value }))} placeholder="Ex: 120" /></div>
                <div className="space-y-2"><Label htmlFor="responsavel">Responsável</Label><Input id="responsavel" value={formData.responsavel} onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))} placeholder="Nome do instrutor" /></div>
                <div className="space-y-2"><Label htmlFor="tipo">Tipo</Label><Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Individual">Individual</SelectItem><SelectItem value="Todos">Todos</SelectItem></SelectContent></Select></div>
                <div className="flex gap-2 pt-4"><Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">{editingTraining ? 'Atualizar' : 'Cadastrar'}</Button><Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingTraining(null); }}>Cancelar</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Filtrar por função ou treinamento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full sm:w-72"
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-gray-600 font-medium"><div className="flex items-center gap-2"><User className="w-4 h-4" />Função</div></th>
                <th className="text-left p-4 text-gray-600 font-medium"><div className="flex items-center gap-2"><BookOpen className="w-4 h-4" />Treinamento</div></th>
                <th className="text-left p-4 text-gray-600 font-medium"><div className="flex items-center gap-2"><Clock className="w-4 h-4" />Duração</div></th>
                <th className="text-left p-4 text-gray-600 font-medium">Responsável</th>
                <th className="text-left p-4 text-gray-600 font-medium">Tipo</th>
                <th className="text-left p-4 text-gray-600 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center p-12 text-gray-500">Carregando treinamentos...</td></tr>
              ) : filteredTrainings.length > 0 ? (
                filteredTrainings.map((training, index) => (
                  <motion.tr key={training.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-800 font-medium">{training.funcao}</td>
                    <td className="p-4 text-gray-600">{training.treinamento}</td>
                    <td className="p-4 text-gray-600">{formatDuration(training.duracao)}</td>
                    <td className="p-4 text-gray-600">{training.responsavel}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${training.tipo === 'Individual' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>{training.tipo}</span></td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(training)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-100">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {userRole === 'admin' && (
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(training.id)} className="text-red-600 hover:text-red-700 hover:bg-red-100">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum treinamento encontrado.</p>
                      <p className="text-gray-400 text-sm">{trainings.length > 0 ? 'Tente um filtro diferente.' : 'Clique em "Novo" para começar.'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default TrainingsTab;