import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, User, DollarSign, Package, TrendingUp, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { vendasPorVendedorService } from '@/services/vendasPorVendedorService';

const VendasPorVendedor = ({ dateFilter, onDataChange }) => {
  const [vendedores, setVendedores] = useState([]);
  const [vendedorSelecionado, setVendedorSelecionado] = useState(null);
  const [pedidosVendedor, setPedidosVendedor] = useState([]);
  const [filtroVendedor, setFiltroVendedor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Buscar dados quando o filtro de data mudar
  useEffect(() => {
    if (dateFilter?.startDate && dateFilter?.endDate) {
      buscarDados();
    }
  }, [dateFilter]);

  const buscarDados = async () => {
    if (!dateFilter?.startDate || !dateFilter?.endDate) return;

    setLoading(true);
    setError(null);

    try {
      const filters = {
        dataInicial: dateFilter.startDate,
        dataFinal: dateFilter.endDate,
        nomeVendedor: filtroVendedor.trim() || undefined
      };

      const dados = await vendasPorVendedorService.getVendasPorVendedor(filters);
      setVendedores(dados.vendedores);
      
      // Notificar componente pai sobre os dados
      if (onDataChange) {
        onDataChange(dados);
      }

    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buscarPedidosVendedor = async (nomeVendedor) => {
    if (!dateFilter?.startDate || !dateFilter?.endDate) return;

    setLoading(true);
    setError(null);

    try {
      const filters = {
        dataInicial: dateFilter.startDate,
        dataFinal: dateFilter.endDate
      };

      const estatisticas = await vendasPorVendedorService.getEstatisticasVendedor(nomeVendedor, filters);
      setVendedorSelecionado(estatisticas);
      setPedidosVendedor(estatisticas.pedidos);

    } catch (err) {
      console.error('Erro ao buscar pedidos do vendedor:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getSituacaoColor = (situacao) => {
    const colors = {
      'Em aberto': 'text-blue-400',
      'Aprovado': 'text-yellow-400',
      'Preparando envio': 'text-orange-400',
      'Faturado': 'text-green-400',
      'Enviado': 'text-indigo-400',
      'Entregue': 'text-purple-400',
      'Cancelado': 'text-red-400'
    };
    return colors[situacao] || 'text-gray-400';
  };

  const handleFiltroChange = (e) => {
    setFiltroVendedor(e.target.value);
  };

  const handleBuscar = () => {
    buscarDados();
  };

  const handleLimparFiltro = () => {
    setFiltroVendedor('');
    buscarDados();
  };

  if (loading && vendedores.length === 0) {
    return (
      <div className="glass-effect rounded-xl p-6">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando vendas por vendedor...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-effect rounded-xl p-4 sm:p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
          <User className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" />
          <span className="hidden sm:inline">Vendas por Vendedor</span>
          <span className="sm:hidden">Vendedores</span>
        </h2>
        <div className="text-sm text-gray-400">
          {vendedores.length} vendedores encontrados
        </div>
      </div>

      {/* Filtro de vendedor */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Digite o nome do vendedor..."
              value={filtroVendedor}
              onChange={handleFiltroChange}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 text-sm sm:text-base"
              onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
            />
          </div>
          <Button
            onClick={handleBuscar}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base"
          >
            <Filter className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Buscar</span>
            <span className="sm:hidden">Buscar</span>
          </Button>
          {filtroVendedor && (
            <Button
              onClick={handleLimparFiltro}
              variant="outline"
              className="text-white border-white/20 text-sm sm:text-base"
            >
              <X className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Limpar</span>
              <span className="sm:hidden">Limpar</span>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Lista de vendedores */}
      <div className="space-y-4 mb-6">
        {vendedores.map((vendedor, index) => (
          <motion.div
            key={vendedor.nome}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-4 border border-purple-500/30 cursor-pointer hover:border-purple-400/50 transition-colors"
            onClick={() => buscarPedidosVendedor(vendedor.nome)}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">{vendedor.nome}</h3>
                  <p className="text-xs sm:text-sm text-gray-400">{vendedor.totalPedidos} pedidos</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-lg sm:text-xl font-bold text-white">{formatCurrency(vendedor.totalVendas)}</p>
                <p className="text-xs sm:text-sm text-gray-400">
                  Ticket médio: {formatCurrency(vendedor.totalVendas / vendedor.totalPedidos)}
                </p>
              </div>
            </div>
            
            {/* Situações do vendedor */}
            <div className="mt-3 flex flex-wrap gap-1 sm:gap-2">
              {Object.entries(vendedor.situacoes).map(([situacao, count]) => (
                <span
                  key={situacao}
                  className={`text-xs px-1 sm:px-2 py-1 rounded-full ${getSituacaoColor(situacao)} bg-white/10`}
                >
                  {situacao}: {count}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detalhes do vendedor selecionado */}
      {vendedorSelecionado && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="border-t border-white/20 pt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">
              Pedidos de {vendedorSelecionado.nome}
            </h3>
            <Button
              onClick={() => setVendedorSelecionado(null)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Resumo do vendedor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-blue-300">Total de Vendas</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(vendedorSelecionado.totalVendas)}</p>
            </div>
            <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-300">Total de Pedidos</span>
              </div>
              <p className="text-2xl font-bold text-white">{vendedorSelecionado.totalPedidos}</p>
            </div>
            <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-500/30">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-purple-300">Ticket Médio</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(vendedorSelecionado.ticketMedio)}</p>
            </div>
          </div>

          {/* Lista de pedidos */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pedidosVendedor.map((pedido, index) => (
              <motion.div
                key={pedido.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="bg-white/5 rounded-lg p-3 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Pedido #{pedido.numero}</p>
                    <p className="text-sm text-gray-300">{pedido.cliente}</p>
                    <p className="text-xs text-gray-400">{formatDate(pedido.dataPedido)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{formatCurrency(pedido.valor)}</p>
                    <p className={`text-sm ${getSituacaoColor(pedido.situacao)}`}>
                      {pedido.situacao}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VendasPorVendedor;
