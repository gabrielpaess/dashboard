import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Edit, Save, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
import { nestjsApiClient } from '../services';

const SalesGoals = ({ data, user }) => {
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
  const [loading, setLoading] = useState(false);

  // Verificar se o usuário é admin
  const isAdmin = user?.nivel === 'admin';

  // Sincronizar dados quando as props mudarem
  useEffect(() => {
    setGoals({
      daily: data.daily?.goal || 7000,
      weekly: data.weekly?.goal || 45000,
      monthly: data.monthly?.goal || 200000
    });
  }, [data]);

  const handleSaveGoals = async () => {
    console.log('🔍 Debug - Usuário:', user);
    console.log('🔍 Debug - isAdmin:', isAdmin);
    console.log('🔍 Debug - Autenticado:', nestjsApiClient.isAuthenticated());
    
    if (!isAdmin) {
      toast({
        title: "❌ Acesso negado",
        description: "Apenas administradores podem alterar as metas.",
        variant: "destructive"
      });
      return;
    }

    // Validar se os valores são números válidos
    const dailyGoal = Number(goals.daily);
    const weeklyGoal = Number(goals.weekly);
    const monthlyGoal = Number(goals.monthly);

    if (isNaN(dailyGoal) || isNaN(weeklyGoal) || isNaN(monthlyGoal)) {
      toast({
        title: "❌ Valores inválidos",
        description: "Por favor, insira valores numéricos válidos para as metas.",
        variant: "destructive"
      });
      return;
    }

    if (dailyGoal < 0 || weeklyGoal < 0 || monthlyGoal < 0) {
      toast({
        title: "❌ Valores inválidos",
        description: "As metas não podem ser valores negativos.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Debug - Valores originais:', goals);
      console.log('🔍 Debug - Valores validados:', {
        daily_goal: dailyGoal,
        weekly_goal: weeklyGoal,
        monthly_goal: monthlyGoal
      });
      console.log('🔍 Debug - Tipos dos valores:', {
        daily_goal: typeof dailyGoal,
        weekly_goal: typeof weeklyGoal,
        monthly_goal: typeof monthlyGoal
      });
      
      const response = await nestjsApiClient.post('/api/sales-goals', {
        daily_goal: dailyGoal,
        weekly_goal: weeklyGoal,
        monthly_goal: monthlyGoal
      });
      
      console.log('🔍 Debug - Resposta da API:', response);

      if (response.success && response.data) {
        setIsEditing(false);
        toast({
          title: "✅ Metas atualizadas!",
          description: "Suas metas de vendas foram salvas com sucesso."
        });
        
        // Recarregar a página após 1 segundo para mostrar os novos dados
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(response.error || 'Falha ao salvar metas');
      }
    } catch (error) {
      console.error('Erro ao salvar metas:', error);
      toast({
        title: "❌ Erro ao salvar",
        description: error.message || "Erro ao salvar as metas. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setGoals({
      daily: data.daily?.goal || 7000,
      weekly: data.weekly?.goal || 45000,
      monthly: data.monthly?.goal || 200000
    });
    setIsEditing(false);
  };

  const formatCurrency = (value) => {
    const numValue = parseFloat(value) || 0;
    if (isNaN(numValue)) {
      console.warn('⚠️ Valor inválido para formatação de moeda:', value);
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const calculateProgress = (current, goal) => {
    const currentNum = parseFloat(current) || 0;
    const goalNum = parseFloat(goal) || 1; // Evitar divisão por zero
    
    if (isNaN(currentNum) || isNaN(goalNum)) {
      console.warn('⚠️ Valores inválidos para cálculo de progresso:', { current, goal });
      return 0;
    }
    
    return Math.min((currentNum / goalNum) * 100, 100);
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
        
        {isAdmin && (
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSaveGoals} 
                  disabled={loading}
                  className="text-green-400 border-green-400/50 hover:bg-green-400/10 hover:text-green-300 bg-transparent"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelEdit} 
                  disabled={loading}
                  className="text-red-400 border-red-400/50 hover:bg-red-400/10 hover:text-red-300 bg-transparent"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)} 
                className="text-white border-white/20 hover:bg-white/10 hover:text-white bg-transparent"
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar Metas
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Meta Diária */}
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Meta Diária</h3>
          
          {isEditing ? (
            <Input
              type="number"
              value={goals.daily}
              onChange={(e) => setGoals({...goals, daily: e.target.value})}
              className="mb-3 bg-white/10 border-white/20 text-white"
              placeholder="Meta diária"
              min="0"
              step="0.01"
            />
          ) : (
            <p className="text-2xl font-bold text-white mb-3">{formatCurrency(data.daily.goal)}</p>
          )}
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Atual</span>
              <span className="text-white">{formatCurrency(data.daily.current)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${calculateProgress(data.daily.current, data.daily.goal)}%` }}
                transition={{ duration: 1 }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-400">
              {calculateProgress(data.daily.current, data.daily.goal).toFixed(1)}% atingido
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
              onChange={(e) => setGoals({...goals, weekly: e.target.value})}
              className="mb-3 bg-white/10 border-white/20 text-white"
              placeholder="Meta semanal"
              min="0"
              step="0.01"
            />
          ) : (
            <p className="text-2xl font-bold text-white mb-3">{formatCurrency(data.weekly.goal)}</p>
          )}
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Atual</span>
              <span className="text-white">{formatCurrency(data.weekly.current)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${calculateProgress(data.weekly.current, data.weekly.goal)}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-400">
              {calculateProgress(data.weekly.current, data.weekly.goal).toFixed(1)}% atingido
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
              onChange={(e) => setGoals({...goals, monthly: e.target.value})}
              className="mb-3 bg-white/10 border-white/20 text-white"
              placeholder="Meta mensal"
              min="0"
              step="0.01"
            />
          ) : (
            <p className="text-2xl font-bold text-white mb-3">{formatCurrency(data.monthly.goal)}</p>
          )}
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Atual</span>
              <span className="text-white">{formatCurrency(data.monthly.current)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${calculateProgress(data.monthly.current, data.monthly.goal)}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-400">
              {calculateProgress(data.monthly.current, data.monthly.goal).toFixed(1)}% atingido
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SalesGoals;