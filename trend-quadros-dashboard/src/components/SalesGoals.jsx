import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Edit, Save, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';

const SalesGoals = ({ data }) => {
  const { toast } = useToast();
  
  // Validação de dados para evitar erros
  if (!data || !data.daily || !data.weekly || !data.monthly) {
    return (
      <div className="text-center text-gray-500 p-4">
        <p>Carregando metas de vendas...</p>
      </div>
    );
  }

  const [isEditing, setIsEditing] = useState(false);
  const [goals, setGoals] = useState({
    daily: data.daily?.goal || 7000,
    weekly: data.weekly?.goal || 45000,
    monthly: data.monthly?.goal || 200000
  });

  const handleSaveGoals = () => {
    // Aqui você salvaria as metas no localStorage ou enviaria para a API
    localStorage.setItem('salesGoals', JSON.stringify(goals));
    setIsEditing(false);
    toast({
      title: "✅ Metas atualizadas!",
      description: "Suas metas de vendas foram salvas com sucesso."
    });
  };

  const handleCancelEdit = () => {
    setGoals({
      daily: data.daily.goal,
      weekly: data.weekly.goal,
      monthly: data.monthly.goal
    });
    setIsEditing(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateProgress = (current, goal) => {
    return Math.min((current / goal) * 100, 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-effect rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Target className="w-6 h-6 mr-2 text-yellow-400" />
          Gestão de Metas
        </h2>
        
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleSaveGoals} className="text-green-400 border-green-400/50 hover:bg-green-400/10 hover:text-green-300 bg-transparent">
                <Save className="w-4 h-4 mr-1" />
                Salvar
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelEdit} className="text-red-400 border-red-400/50 hover:bg-red-400/10 hover:text-red-300 bg-transparent">
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="text-white border-white/20 hover:bg-white/10 hover:text-white bg-transparent">
              <Edit className="w-4 h-4 mr-1" />
              Editar Metas
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Meta Diária */}
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Meta Diária</h3>
          
          {isEditing ? (
            <Input
              type="number"
              value={goals.daily}
              onChange={(e) => setGoals({...goals, daily: Number(e.target.value)})}
              className="mb-3 bg-white/10 border-white/20 text-white"
              placeholder="Meta diária"
            />
          ) : (
            <p className="text-2xl font-bold text-white mb-3">{formatCurrency(goals.daily)}</p>
          )}
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Atual</span>
              <span className="text-white">{formatCurrency(data.daily.current)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${calculateProgress(data.daily.current, goals.daily)}%` }}
                transition={{ duration: 1 }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-400">
              {calculateProgress(data.daily.current, goals.daily).toFixed(1)}% atingido
            </p>
          </div>
        </div>

        {/* Meta Semanal */}
        <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-lg p-4 border border-green-500/30">
          <h3 className="text-lg font-semibold text-green-400 mb-3">Meta Semanal</h3>
          
          {isEditing ? (
            <Input
              type="number"
              value={goals.weekly}
              onChange={(e) => setGoals({...goals, weekly: Number(e.target.value)})}
              className="mb-3 bg-white/10 border-white/20 text-white"
              placeholder="Meta semanal"
            />
          ) : (
            <p className="text-2xl font-bold text-white mb-3">{formatCurrency(goals.weekly)}</p>
          )}
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Atual</span>
              <span className="text-white">{formatCurrency(data.weekly.current)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${calculateProgress(data.weekly.current, goals.weekly)}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-400">
              {calculateProgress(data.weekly.current, goals.weekly).toFixed(1)}% atingido
            </p>
          </div>
        </div>

        {/* Meta Mensal */}
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-500/30">
          <h3 className="text-lg font-semibold text-orange-400 mb-3">Meta Mensal</h3>
          
          {isEditing ? (
            <Input
              type="number"
              value={goals.monthly}
              onChange={(e) => setGoals({...goals, monthly: Number(e.target.value)})}
              className="mb-3 bg-white/10 border-white/20 text-white"
              placeholder="Meta mensal"
            />
          ) : (
            <p className="text-2xl font-bold text-white mb-3">{formatCurrency(goals.monthly)}</p>
          )}
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Atual</span>
              <span className="text-white">{formatCurrency(data.monthly.current)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${calculateProgress(data.monthly.current, goals.monthly)}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-400">
              {calculateProgress(data.monthly.current, goals.monthly).toFixed(1)}% atingido
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SalesGoals;