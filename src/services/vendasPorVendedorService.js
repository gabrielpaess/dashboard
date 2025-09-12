/**
 * Serviço para buscar dados de vendas por vendedor
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '../config/environment.js';

class VendasPorVendedorService {
  constructor() {
    // Usar process.env para Node.js e import.meta.env para browser
    const supabaseUrl = typeof window !== 'undefined'
      ? import.meta.env.VITE_SUPABASE_URL
      : process.env.VITE_SUPABASE_URL;
    
    const supabaseKey = typeof window !== 'undefined'
      ? import.meta.env.VITE_SUPABASE_ANON_KEY
      : process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing. Please check your environment variables.');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Buscar dados de vendas por vendedor
   * @param {Object} filters - Filtros de data e vendedor
   * @param {string} filters.dataInicial - Data inicial (YYYY-MM-DD)
   * @param {string} filters.dataFinal - Data final (YYYY-MM-DD)
   * @param {string} filters.nomeVendedor - Nome ou parte do nome do vendedor
   * @returns {Promise<Object>} Dados de vendas por vendedor
   */
  async getVendasPorVendedor(filters = {}) {
    try {
      console.log('📊 Buscando vendas por vendedor...', filters);

      let query = this.supabase
        .from('pedidos')
        .select('*')
        .not('situacao', 'eq', 'Cancelado') // Excluir pedidos cancelados
        .order('numero', { ascending: false });

      // Aplicar filtro de data
      if (filters.dataInicial && filters.dataFinal) {
        console.log(`🔍 Aplicando filtro de data: ${filters.dataInicial} até ${filters.dataFinal}`);
        query = query
          .gte('data_pedido', filters.dataInicial)
          .lte('data_pedido', filters.dataFinal);
      }

      // Aplicar filtro de vendedor
      if (filters.nomeVendedor && filters.nomeVendedor.trim()) {
        console.log(`🔍 Aplicando filtro de vendedor: ${filters.nomeVendedor}`);
        query = query.ilike('nome_vendedor', `%${filters.nomeVendedor.trim()}%`);
      }

      const { data: pedidos, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar vendas por vendedor: ${error.message}`);
      }

      console.log(`📊 Encontrados ${pedidos?.length || 0} pedidos na consulta`);

      if (!pedidos || pedidos.length === 0) {
        return {
          vendedores: [],
          totalVendas: 0,
          totalPedidos: 0,
          resumo: {}
        };
      }

      // Agrupar por vendedor
      const vendasPorVendedor = pedidos.reduce((acc, pedido) => {
        const vendedor = pedido.nome_vendedor || 'Não informado';
        
        if (!acc[vendedor]) {
          acc[vendedor] = {
            nome: vendedor,
            pedidos: [],
            totalVendas: 0,
            totalPedidos: 0,
            situacoes: {}
          };
        }

        acc[vendedor].pedidos.push(pedido);
        acc[vendedor].totalVendas += pedido.valor_total || 0;
        acc[vendedor].totalPedidos += 1;
        
        // Contar situações
        const situacao = pedido.situacao || 'Não informado';
        acc[vendedor].situacoes[situacao] = (acc[vendedor].situacoes[situacao] || 0) + 1;

        return acc;
      }, {});

      // Converter para array e ordenar por total de vendas
      const vendedores = Object.values(vendasPorVendedor)
        .sort((a, b) => b.totalVendas - a.totalVendas);

      // Calcular totais gerais
      const totalVendas = vendedores.reduce((sum, v) => sum + v.totalVendas, 0);
      const totalPedidos = vendedores.reduce((sum, v) => sum + v.totalPedidos, 0);

      // Calcular resumo por situação
      const resumo = pedidos.reduce((acc, pedido) => {
        const situacao = pedido.situacao || 'Não informado';
        acc[situacao] = (acc[situacao] || 0) + 1;
        return acc;
      }, {});

      console.log(`📊 Processados ${vendedores.length} vendedores`);
      console.log(`💰 Total de vendas: R$ ${totalVendas.toFixed(2)}`);
      console.log(`📦 Total de pedidos: ${totalPedidos}`);

      return {
        vendedores,
        totalVendas,
        totalPedidos,
        resumo,
        periodo: {
          dataInicial: filters.dataInicial,
          dataFinal: filters.dataFinal,
          vendedorFiltro: filters.nomeVendedor
        }
      };

    } catch (error) {
      console.error('❌ Erro ao buscar vendas por vendedor:', error);
      throw error;
    }
  }

  /**
   * Buscar lista de vendedores únicos
   * @param {Object} filters - Filtros de data
   * @returns {Promise<Array>} Lista de vendedores
   */
  async getVendedores(filters = {}) {
    try {
      console.log('👥 Buscando lista de vendedores...');

      let query = this.supabase
        .from('pedidos')
        .select('nome_vendedor')
        .not('situacao', 'eq', 'Cancelado')
        .not('nome_vendedor', 'is', null);

      // Aplicar filtro de data
      if (filters.dataInicial && filters.dataFinal) {
        query = query
          .gte('data_pedido', filters.dataInicial)
          .lte('data_pedido', filters.dataFinal);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar vendedores: ${error.message}`);
      }

      // Extrair vendedores únicos
      const vendedores = [...new Set(data.map(p => p.nome_vendedor).filter(Boolean))]
        .sort();

      console.log(`👥 Encontrados ${vendedores.length} vendedores únicos`);

      return vendedores;

    } catch (error) {
      console.error('❌ Erro ao buscar vendedores:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas de um vendedor específico
   * @param {string} nomeVendedor - Nome do vendedor
   * @param {Object} filters - Filtros de data
   * @returns {Promise<Object>} Estatísticas do vendedor
   */
  async getEstatisticasVendedor(nomeVendedor, filters = {}) {
    try {
      console.log(`📊 Buscando estatísticas do vendedor: ${nomeVendedor}`);

      let query = this.supabase
        .from('pedidos')
        .select('*')
        .eq('nome_vendedor', nomeVendedor)
        .not('situacao', 'eq', 'Cancelado')
        .order('numero', { ascending: false });

      // Aplicar filtro de data
      if (filters.dataInicial && filters.dataFinal) {
        query = query
          .gte('data_pedido', filters.dataInicial)
          .lte('data_pedido', filters.dataFinal);
      }

      const { data: pedidos, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar estatísticas do vendedor: ${error.message}`);
      }

      if (!pedidos || pedidos.length === 0) {
        return {
          nome: nomeVendedor,
          totalVendas: 0,
          totalPedidos: 0,
          ticketMedio: 0,
          situacoes: {},
          pedidos: []
        };
      }

      const totalVendas = pedidos.reduce((sum, p) => sum + (p.valor_total || 0), 0);
      const totalPedidos = pedidos.length;
      const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0;

      // Contar situações
      const situacoes = pedidos.reduce((acc, pedido) => {
        const situacao = pedido.situacao || 'Não informado';
        acc[situacao] = (acc[situacao] || 0) + 1;
        return acc;
      }, {});

      console.log(`📊 Vendedor ${nomeVendedor}: ${totalPedidos} pedidos, R$ ${totalVendas.toFixed(2)}`);

      return {
        nome: nomeVendedor,
        totalVendas,
        totalPedidos,
        ticketMedio,
        situacoes,
        pedidos: pedidos.map(p => ({
          id: p.id,
          numero: p.numero,
          cliente: p.nome_cliente,
          dataPedido: p.data_pedido,
          valor: p.valor_total,
          situacao: p.situacao
        }))
      };

    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas do vendedor:', error);
      throw error;
    }
  }
}

export const vendasPorVendedorService = new VendasPorVendedorService();
