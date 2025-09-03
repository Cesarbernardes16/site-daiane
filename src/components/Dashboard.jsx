import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Users, Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TrainingsTab from './TrainingsTab';
import IntegrationsTab from './IntegrationsTab';
import ScheduleTab from './ScheduleTab';

const Dashboard = ({ onLogout, userRole }) => {
  const [activeTab, setActiveTab] = useState('trainings');

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">
                Sistema de Integração
              </h1>
            </div>
            
            <Button
              onClick={onLogout}
              variant="ghost"
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-gray-200 text-gray-600">
              <TabsTrigger 
                value="trainings" 
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Gestão de Treinamentos
              </TabsTrigger>
              <TabsTrigger 
                value="integrations"
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Integrações da Semana
              </TabsTrigger>
              <TabsTrigger 
                value="schedule"
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Agenda Gerada
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trainings" className="space-y-6">
              {/* Passando a prop userRole para o TrainingsTab */}
              <TrainingsTab userRole={userRole} />
            </TabsContent>

            <TabsContent value="integrations" className="space-y-6">
              <IntegrationsTab />
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <ScheduleTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;