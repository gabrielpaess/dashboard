import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, GitPullRequest, Calendar, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
const DevelopmentView = ({
  data
}) => {
  const [showAllProjects, setShowAllProjects] = useState(false);
  
  // Validação de dados para evitar erros
  if (!data) {
    return (
      <div className="text-center text-gray-500 p-8">
        <p>Carregando dados de desenvolvimento...</p>
      </div>
    );
  }

  // Usar dados reais de desenvolvimento se disponíveis, senão usar dados mock
  const developmentData = data.developmentData || {
    backlog: 0,
    developedThisPeriod: 0,
    projects: []
  };
  
  const {
    backlog = 0,
    developedThisPeriod = 0,
    projects = []
  } = developmentData;
  
  // Determinar quantos projetos mostrar
  const projectsToShow = showAllProjects ? (projects || []) : (projects || []).slice(0, 5);
  const getStatusIcon = status => {
    switch (status) {
      case 'Atrasado':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'Em Risco':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'No Prazo':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'Entregue':
        return <CheckCircle className="w-5 h-5 text-purple-400" />;
      case 'Cancelado':
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
      case 'Concluído':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <Clock className="w-5 h-5 text-blue-400" />;
    }
  };
  return <motion.div className="space-y-6" initial={{
    opacity: 0,
    y: 10
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5
  }}>
      <div className="glass-effect rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Wrench className="w-6 h-6 mr-2 text-pink-400" />
          Visão de Desenvolvimento
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-pink-500/20 rounded-lg p-4 border border-pink-500/30 text-center">
            <GitPullRequest className="w-8 h-8 mx-auto mb-2 text-pink-300" />
            <p className="text-3xl font-bold text-white">{backlog}</p>
            <p className="text-sm text-pink-300">Aprovar Arte</p>
            <p className="text-xs text-pink-200">(Em aberto)</p>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-500/30 text-center">
            <Wrench className="w-8 h-8 mx-auto mb-2 text-purple-300" />
            <p className="text-3xl font-bold text-white">{developedThisPeriod}</p>
            <p className="text-sm text-purple-300">Ajustar Arquivos</p>
            <p className="text-xs text-purple-200">(Aprovado)</p>
          </div>
          <div className="bg-indigo-500/20 rounded-lg p-4 border border-indigo-500/30 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-indigo-300" />
            <p className="text-3xl font-bold text-white">{(projects || []).filter(p => p.diasRestantes !== undefined && p.diasRestantes <= 2).length}</p>
            <p className="text-sm text-indigo-300">Gargalos Identificados</p>
            <p className="text-xs text-indigo-200">(≤2 dias de prazo)</p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Projetos em Andamento</h3>
          <div className="space-y-3">
            {projectsToShow.map((project, index) => <motion.div key={project.id} initial={{
            opacity: 0,
            x: -20
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            duration: 0.3,
            delay: index * 0.1
          }} className="p-4 rounded-lg border bg-black/20 border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(project.status)}
                    <div>
                      <p className="font-medium text-white">{project.name}</p>
                      <p className={`text-sm ${
                        project.status === 'Atrasado' ? 'text-red-400' : 
                        project.status === 'Em Risco' ? 'text-yellow-400' : 
                        project.status === 'No Prazo' ? 'text-green-400' : 
                        project.status === 'Entregue' ? 'text-purple-400' : 
                        project.status === 'Cancelado' ? 'text-gray-400' : 
                        'text-gray-300'
                      }`}>{project.status}</p>
                      <p className="text-xs text-gray-400">
                        {project.situacao === 'Em aberto' ? 'Aprovar Arte' : 
                         project.situacao === 'aprovado' ? 'Ajustar Arquivos' : 
                         project.situacao}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Prazo</p>
                    <p className="text-sm font-medium text-white">{project.deadline}</p>
                    {project.diasRestantes !== undefined && (
                      <p className={`text-xs font-medium ${
                        project.diasRestantes <= 0 ? 'text-red-400' : 
                        project.diasRestantes <= 2 ? 'text-yellow-400' : 
                        'text-green-400'
                      }`}>
                        {project.diasRestantes <= 0 ? `${Math.abs(project.diasRestantes)} dias atrasado` : 
                         `${project.diasRestantes} dias restantes`}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>)}
            
            {/* Botão para ver todos os projetos */}
            {(projects || []).length > 5 && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllProjects(!showAllProjects)}
                  className="bg-transparent border-white/20 text-white hover:bg-white/10"
                >
                  {showAllProjects ? (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Ver Menos
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Ver Todos ({(projects || []).length} projetos)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>;
};
export default DevelopmentView;