/**
 * Serviço Centralizado de Pedidos
 * Trabalha com a tabela pedidos principal que contém todos os dados
 */

import { createClient } from '@supabase/supabase-js';

class PedidosCentralizedService {
  constructor() {
    // Valores hardcoded para garantir funcionamento
    const supabaseUrl = 'https://jpkpifxctubvauwjvimd.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwa3BpZnhjdHVidmF1d2p2aW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5ODg2NDYsImV4cCI6MjA3MjU2NDY0Nn0.A7cXsrpIsN4TdEIV77wWRSBa-kf9YlHv-vZARlm2p20';
    
    console.log('🔧 PedidosCentralizedService: Configurando Supabase...', {
      url: supabaseUrl ? '✅' : '❌',
      key: supabaseKey ? '✅' : '❌'
    });
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Buscar todos os pedidos com filtros
   */
  async getPedidos(filters = {}) {
    try {
      let query = this.supabase
        .from('pedidos')
        .select('*')
        .order('data_pedido', { ascending: false });

      // Aplicar filtros
      if (filters.situacao) {
        query = query.in('situacao', filters.situacao);
      }

      if (filters.dataInicial && filters.dataFinal) {
        console.log(`🔍 Aplicando filtro de data: ${filters.dataInicial} até ${filters.dataFinal}`);
        // Usar data_pedido que está no formato YYYY-MM-DD
        query = query
          .gte('data_pedido', filters.dataInicial)
          .lte('data_pedido', filters.dataFinal);
      }

      if (filters.nomeCliente) {
        query = query.ilike('nome_cliente', `%${filters.nomeCliente}%`);
      }

      if (filters.nomeVendedor) {
        query = query.ilike('nome_vendedor', `%${filters.nomeVendedor}%`);
      }

      if (filters.envio15) {
        query = query.eq('envio_15', true);
      }

      if (filters.envio45) {
        query = query.eq('envio_45', true);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar pedidos: ${error.message}`);
      }

      console.log(`📊 Encontrados ${data?.length || 0} pedidos na consulta`);
      
      // Debug: mostrar alguns pedidos de exemplo
      if (data && data.length > 0) {
        console.log('📋 Exemplo de pedidos encontrados:');
        data.slice(0, 3).forEach(pedido => {
          console.log(`  - ID: ${pedido.id}, Data: ${pedido.data_pedido}, Valor: R$ ${pedido.valor_total}, Situação: ${pedido.situacao}`);
        });
      }

      return data || [];

    } catch (error) {
      console.error('❌ Erro ao buscar pedidos:', error);
      throw error;
    }
  }

  /**
   * Buscar pedidos em produção (Em aberto, Aprovado, Preparando envio, Faturado)
   */
  async getPedidosProducao(filters = {}) {
    const situacoesProducao = ['Em aberto', 'Aprovado', 'Preparando envio', 'Faturado'];
    
    return await this.getPedidos({
      ...filters,
      situacao: situacoesProducao
    });
  }

  /**
   * Calcular WIP Total (Itens em Produção)
   */
  async getWIPTotal(filters = {}) {
    try {
      const pedidos = await this.getPedidosProducao(filters);
      
      let totalItens = 0;
      const itensDetalhados = [];

      pedidos.forEach(pedido => {
        if (pedido.itens_json && Array.isArray(pedido.itens_json)) {
          pedido.itens_json.forEach(item => {
            // Tentar ambas as estruturas: item.quantidade (estrutura real) ou item.item.quantidade (estrutura antiga)
            const quantidade = parseFloat(item.quantidade || item.item?.quantidade || 0);
            totalItens += quantidade;
            
            itensDetalhados.push({
              pedido_id: pedido.id,
              numero: pedido.numero,
              situacao: pedido.situacao,
              data_pedido: pedido.data_pedido_pt_br,
              descricao: item.item?.descricao || 'Item sem descrição',
              quantidade: quantidade
            });
          });
        } else {
          // Pedido sem itens
          itensDetalhados.push({
            pedido_id: pedido.id,
            numero: pedido.numero,
            situacao: pedido.situacao,
            data_pedido: pedido.data_pedido_pt_br,
            descricao: 'Sem itens',
            quantidade: 0
          });
        }
      });

      // Log detalhado
      console.log('📦 ITENS EM PRODUÇÃO (CENTRALIZADO) - Detalhamento:');
      console.log(`📊 Total de itens: ${totalItens}`);
      console.log(`📋 Total de pedidos: ${pedidos.length}`);
      console.log('🔍 Itens por pedido:');
      
      itensDetalhados.forEach((item, index) => {
        console.log(`   ${index + 1}. Pedido ${item.numero} (${item.situacao}) - ${item.descricao} - ${item.quantidade} itens - Data: ${item.data_pedido}`);
      });

      return {
        totalItens,
        totalPedidos: pedidos.length,
        itensDetalhados,
        pedidos
      };

    } catch (error) {
      console.error('❌ Erro ao calcular WIP Total:', error);
      throw error;
    }
  }

  /**
   * Calcular WIP Total com filtro de data
   */
  async getWIPTotalByDateRange(startDate, endDate) {
    return await this.getWIPTotal({
      dataInicial: startDate,
      dataFinal: endDate
    });
  }

  /**
   * Buscar pedidos da semana
   */
  async getPedidosSemana(filters = {}) {
    // Se há filtro de data, usar o período do filtro
    if (filters.dataInicial && filters.dataFinal) {
      console.log(`📊 Buscando pedidos da semana com filtro de data: ${filters.dataInicial} até ${filters.dataFinal}`);
      return await this.getPedidosProducao(filters);
    }
    
    // Sem filtro de data, usar semana atual
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo
    inicioSemana.setHours(0, 0, 0, 0);
    
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6); // Sábado
    fimSemana.setHours(23, 59, 59, 999);

    const startDate = inicioSemana.toISOString().split('T')[0];
    const endDate = fimSemana.toISOString().split('T')[0];

    console.log(`📊 Buscando pedidos da semana atual: ${startDate} até ${endDate}`);
    return await this.getPedidosProducao({
      ...filters,
      dataInicial: startDate,
      dataFinal: endDate
    });
  }

  /**
   * Buscar métricas de vendas
   */
  async getMetricasVendas(filters = {}) {
    try {
      console.log('🔍 Buscando métricas de vendas com filtros:', filters);
      const pedidos = await this.getPedidos(filters);
      console.log(`📊 Encontrados ${pedidos.length} pedidos para o período`);
      
      const totalRevenue = pedidos.reduce((sum, pedido) => sum + parseFloat(pedido.valor_total || 0), 0);
      const totalPedidos = pedidos.length;
      const averageOrderValue = totalPedidos > 0 ? totalRevenue / totalPedidos : 0;

      console.log(`💰 Receita total: R$ ${totalRevenue.toFixed(2)}, Pedidos: ${totalPedidos}`);
      
      // Debug: verificar datas dos pedidos encontrados
      if (pedidos.length > 0) {
        const datasUnicas = [...new Set(pedidos.map(p => p.data_pedido))].sort();
        console.log(`📊 Datas dos pedidos encontrados: ${datasUnicas.join(', ')}`);
      }

      return {
        totalRevenue,
        totalPedidos,
        averageOrderValue
      };

    } catch (error) {
      console.error('❌ Erro ao calcular métricas de vendas:', error);
      throw error;
    }
  }

  /**
   * Buscar métricas de vendas por período (diário, semanal, mensal)
   */
  async getMetricasVendasPorPeriodo() {
    try {
      const hoje = new Date();
      console.log(`📅 Data atual: ${hoje.toISOString()} (${hoje.toLocaleDateString('pt-BR')})`);
      
      // ===== PERÍODO DIÁRIO =====
      // Meta diária: apenas o dia atual (00:00:00 até 23:59:59)
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
      
      // ===== PERÍODO SEMANAL =====
      // Meta semanal: semana atual (segunda a domingo)
      const inicioSemana = this.getInicioSemana(hoje);
      const fimSemana = this.getFimSemana(hoje);
      
      // ===== PERÍODO MENSAL =====
      // Meta mensal: mês atual (1º dia até último dia do mês)
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
      
      // ===== PERÍODOS ANTERIORES PARA COMPARAÇÃO =====
      const inicioHojeAnterior = new Date(inicioHoje);
      inicioHojeAnterior.setDate(inicioHojeAnterior.getDate() - 1);
      const fimHojeAnterior = new Date(fimHoje);
      fimHojeAnterior.setDate(fimHojeAnterior.getDate() - 1);
      
      const inicioSemanaAnterior = this.getInicioSemanaAnterior(hoje);
      const fimSemanaAnterior = this.getFimSemanaAnterior(hoje);
      
      const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59);

      console.log('📅 Períodos calculados:');
      console.log(`  Diário: ${this.formatDateToISO(inicioHoje)} até ${this.formatDateToISO(fimHoje)}`);
      console.log(`  Semanal: ${this.formatDateToISO(inicioSemana)} até ${this.formatDateToISO(fimSemana)}`);
      console.log(`  Mensal: ${this.formatDateToISO(inicioMes)} até ${this.formatDateToISO(fimMes)}`);
      
      // Debug: verificar se as datas estão sendo formatadas corretamente
      console.log('🔍 Debug - Datas formatadas:');
      console.log(`  Início hoje: ${inicioHoje} -> ${this.formatDateToISO(inicioHoje)}`);
      console.log(`  Fim hoje: ${fimHoje} -> ${this.formatDateToISO(fimHoje)}`);
      console.log(`  Início semana: ${inicioSemana} -> ${this.formatDateToISO(inicioSemana)}`);
      console.log(`  Fim semana: ${fimSemana} -> ${this.formatDateToISO(fimSemana)}`);

      // Buscar dados para cada período
      const [vendasHoje, vendasHojeAnterior, vendasSemana, vendasSemanaAnterior, vendasMes, vendasMesAnterior] = await Promise.all([
        this.getMetricasVendas({
          dataInicial: this.formatDateToISO(inicioHoje),
          dataFinal: this.formatDateToISO(fimHoje)
        }),
        this.getMetricasVendas({
          dataInicial: this.formatDateToISO(inicioHojeAnterior),
          dataFinal: this.formatDateToISO(fimHojeAnterior)
        }),
        this.getMetricasVendas({
          dataInicial: this.formatDateToISO(inicioSemana),
          dataFinal: this.formatDateToISO(fimSemana)
        }),
        this.getMetricasVendas({
          dataInicial: this.formatDateToISO(inicioSemanaAnterior),
          dataFinal: this.formatDateToISO(fimSemanaAnterior)
        }),
        this.getMetricasVendas({
          dataInicial: this.formatDateToISO(inicioMes),
          dataFinal: this.formatDateToISO(fimMes)
        }),
        this.getMetricasVendas({
          dataInicial: this.formatDateToISO(inicioMesAnterior),
          dataFinal: this.formatDateToISO(fimMesAnterior)
        })
      ]);

      // Metas (valores padrão - podem ser configuráveis)
      const metas = {
        daily: 1000,    // R$ 1.000 por dia
        weekly: 7000,   // R$ 7.000 por semana
        monthly: 30000  // R$ 30.000 por mês
      };

      return {
        daily: {
          current: vendasHoje.totalRevenue,
          previous: vendasHojeAnterior.totalRevenue,
          goal: metas.daily,
          orders: vendasHoje.totalPedidos,
          period: `${this.formatDateToPTBR(inicioHoje)}`
        },
        weekly: {
          current: vendasSemana.totalRevenue,
          previous: vendasSemanaAnterior.totalRevenue,
          goal: metas.weekly,
          orders: vendasSemana.totalPedidos,
          period: `${this.formatDateToPTBR(inicioSemana)} - ${this.formatDateToPTBR(fimSemana)}`
        },
        monthly: {
          current: vendasMes.totalRevenue,
          previous: vendasMesAnterior.totalRevenue,
          goal: metas.monthly,
          orders: vendasMes.totalPedidos,
          period: `${this.formatDateToPTBR(inicioMes)} - ${this.formatDateToPTBR(fimMes)}`
        }
      };

    } catch (error) {
      console.error('❌ Erro ao calcular métricas de vendas por período:', error);
      throw error;
    }
  }

  /**
   * Obter início da semana (domingo)
   */
  getInicioSemana(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Domingo = 0, então diff = 0
    const inicio = new Date(d);
    inicio.setDate(diff);
    inicio.setHours(0, 0, 0, 0);
    return inicio;
  }

  /**
   * Obter fim da semana (sábado)
   */
  getFimSemana(date) {
    const inicio = this.getInicioSemana(date);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6); // Domingo + 6 = Sábado
    fim.setHours(23, 59, 59, 999);
    return fim;
  }

  /**
   * Obter início da semana anterior
   */
  getInicioSemanaAnterior(date) {
    const inicioAtual = this.getInicioSemana(date);
    const inicioAnterior = new Date(inicioAtual);
    inicioAnterior.setDate(inicioAtual.getDate() - 7);
    return inicioAnterior;
  }

  /**
   * Obter fim da semana anterior
   */
  getFimSemanaAnterior(date) {
    const inicioAnterior = this.getInicioSemanaAnterior(date);
    const fimAnterior = new Date(inicioAnterior);
    fimAnterior.setDate(inicioAnterior.getDate() + 6);
    fimAnterior.setHours(23, 59, 59, 999);
    return fimAnterior;
  }

  /**
   * Buscar breakdown por situação
   */
  async getBreakdownSituacao(filters = {}) {
    try {
      const pedidos = await this.getPedidos(filters);
      
      const breakdown = {};
      pedidos.forEach(pedido => {
        const situacao = pedido.situacao || 'Não informado';
        if (!breakdown[situacao]) {
          breakdown[situacao] = {
            count: 0,
            totalItens: 0,
            totalValor: 0
          };
        }
        
        breakdown[situacao].count++;
        breakdown[situacao].totalValor += parseFloat(pedido.valor_total || 0);
        
        // Calcular itens
        if (pedido.itens_json && Array.isArray(pedido.itens_json)) {
          pedido.itens_json.forEach(item => {
            breakdown[situacao].totalItens += parseFloat(item.item?.quantidade || 0);
          });
        }
      });

      return breakdown;

    } catch (error) {
      console.error('❌ Erro ao calcular breakdown por situação:', error);
      throw error;
    }
  }

  /**
   * Buscar pedidos por vendedor
   */
  async getPedidosPorVendedor(filters = {}) {
    try {
      const pedidos = await this.getPedidos(filters);
      
      const vendedores = {};
      pedidos.forEach(pedido => {
        const vendedor = pedido.nome_vendedor || 'Não informado';
        if (!vendedores[vendedor]) {
          vendedores[vendedor] = {
            count: 0,
            totalValor: 0,
            pedidos: []
          };
        }
        
        vendedores[vendedor].count++;
        vendedores[vendedor].totalValor += parseFloat(pedido.valor_total || 0);
        vendedores[vendedor].pedidos.push(pedido);
      });

      return vendedores;

    } catch (error) {
      console.error('❌ Erro ao buscar pedidos por vendedor:', error);
      throw error;
    }
  }

  /**
   * Extrair e validar valor total do pedido
   */
  extractValorTotal(pedidoData) {
    // Tentar diferentes campos possíveis da API
    const possibleFields = [
      pedidoData.valor,
      pedidoData.total_pedido,
      pedidoData.valor_total,
      pedidoData.total,
      pedidoData.valor_pedido
    ];
    
    for (const field of possibleFields) {
      if (field !== undefined && field !== null && field !== '') {
        const parsed = parseFloat(field);
        if (!isNaN(parsed) && parsed > 0) {
          console.log(`✅ Valor total encontrado: ${parsed} (campo: ${field})`);
          return parsed;
        }
      }
    }
    
    console.warn(`⚠️ Valor total não encontrado ou inválido. Campos disponíveis:`, {
      valor: pedidoData.valor,
      total_pedido: pedidoData.total_pedido,
      valor_total: pedidoData.valor_total,
      total: pedidoData.total,
      valor_pedido: pedidoData.valor_pedido
    });
    
    return 0;
  }

  /**
   * Sincronizar pedido da API para a tabela centralizada
   */
  async syncPedidoFromAPI(pedidoData, itensData = []) {
    try {
      // Validar dados obrigatórios
      if (!pedidoData.id) {
        throw new Error('ID do pedido é obrigatório');
      }

      if (!pedidoData.numero) {
        throw new Error('Número do pedido é obrigatório');
      }

      // Verificar se o pedido já existe
      const { data: existingPedido, error: fetchError } = await this.supabase
        .from('pedidos')
        .select('envio_15, envio_45')
        .eq('id', pedidoData.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Erro ao verificar pedido existente:', fetchError);
        throw new Error(`Erro ao verificar pedido existente: ${fetchError.message}`);
      }

      // Determinar valores para envio_15 e envio_45
      let envio15, envio45;
      
      if (existingPedido) {
        // Pedido existe: manter valores atuais (preservar alterações do usuário)
        envio15 = existingPedido.envio_15;
        envio45 = existingPedido.envio_45;
        console.log(`🔄 Atualizando pedido existente ${pedidoData.numero} - mantendo envio_15: ${envio15}, envio_45: ${envio45}`);
      } else {
        // Pedido novo: usar false como padrão
        envio15 = false;
        envio45 = false;
        console.log(`🆕 Novo pedido ${pedidoData.numero} - definindo envio_15: ${envio15}, envio_45: ${envio45}`);
      }

      // Validar e formatar dados
      const pedido = {
        id: pedidoData.id,
        pedido_id: pedidoData.id, // Adicionar campo pedido_id obrigatório
        numero: pedidoData.numero,
        nome_cliente: pedidoData.nome || pedidoData.cliente?.nome || 'Cliente não informado',
        data_pedido: this.formatDateToISO(pedidoData.data_pedido),
        data_pedido_pt_br: this.formatDateToPTBR(pedidoData.data_pedido),
        data_prevista: pedidoData.data_prevista ? this.formatDateToISO(pedidoData.data_prevista) : null,
        situacao: pedidoData.situacao || 'Não informado',
        valor_total: this.extractValorTotal(pedidoData),
        nome_vendedor: pedidoData.nome_vendedor || 'Não informado',
        itens_json: Array.isArray(itensData) ? itensData : [],
        envio_15: envio15,
        envio_45: envio45,
        updated_at: new Date().toISOString()
      };

      // Debug: Mostrar dados que serão inseridos
      console.log(`🔍 Sincronizando pedido ${pedido.numero} (ID: ${pedido.id}) - Valor: R$ ${pedido.valor_total}`);

      const { error } = await this.supabase
        .from('pedidos')
        .upsert(pedido, {
          onConflict: 'id'
        });

      if (error) {
        console.error('❌ Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao sincronizar pedido: ${error.message}`);
      }

      console.log(`✅ Pedido ${pedido.numero} sincronizado com sucesso`);
      return pedido;

    } catch (error) {
      console.error('❌ Erro ao sincronizar pedido:', error);
      throw error;
    }
  }

  /**
   * Formatar data para ISO (YYYY-MM-DD)
   */
  formatDateToISO(dateInput) {
    if (!dateInput) return null;
    
    try {
      // Se é um objeto Date, converter para string ISO
      if (dateInput instanceof Date) {
        const year = dateInput.getFullYear();
        const month = String(dateInput.getMonth() + 1).padStart(2, '0');
        const day = String(dateInput.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // Se é uma string, processar normalmente
      const dateString = String(dateInput);
      
      // Se já está no formato YYYY-MM-DD
      if (dateString.includes('-')) {
        return dateString;
      }
      
      // Se está no formato DD/MM/YYYY
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao formatar data para ISO:', dateInput, error);
      return null;
    }
  }

  /**
   * Formatar data para PT-BR (DD/MM/YYYY)
   */
  formatDateToPTBR(dateInput) {
    if (!dateInput) return null;
    
    try {
      // Se é um objeto Date, converter para string
      if (dateInput instanceof Date) {
        const year = dateInput.getFullYear();
        const month = String(dateInput.getMonth() + 1).padStart(2, '0');
        const day = String(dateInput.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
      }
      
      // Se é uma string, processar normalmente
      const dateString = String(dateInput);
      
      // Se já está no formato YYYY-MM-DD
      if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // Se já está no formato DD/MM/YYYY
      if (dateString.includes('/')) {
        return dateString;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao formatar data para PT-BR:', dateInput, error);
      return null;
    }
  }

  /**
   * Calcular se o pedido tem envio em 15 dias
   */
  calculateEnvio15(dataPedido, dataPrevista) {
    if (!dataPedido || !dataPrevista) return false;
    
    try {
      const pedidoDate = this.createLocalDate(dataPedido);
      const previstaDate = this.createLocalDate(dataPrevista);
      
      if (!pedidoDate || !previstaDate) return false;
      
      const diffDays = Math.ceil((previstaDate - pedidoDate) / (1000 * 60 * 60 * 24));
      
      return diffDays <= 15;
    } catch (error) {
      console.error('Erro ao calcular envio 15:', error);
      return false;
    }
  }

  /**
   * Calcular se o pedido tem envio em 45 dias
   */
  calculateEnvio45(dataPedido, dataPrevista) {
    if (!dataPedido || !dataPrevista) return false;
    
    try {
      const pedidoDate = this.createLocalDate(dataPedido);
      const previstaDate = this.createLocalDate(dataPrevista);
      
      if (!pedidoDate || !previstaDate) return false;
      
      const diffDays = Math.ceil((previstaDate - pedidoDate) / (1000 * 60 * 60 * 24));
      
      return diffDays <= 45;
    } catch (error) {
      console.error('Erro ao calcular envio 45:', error);
      return false;
    }
  }

  /**
   * Criar data no fuso horário local
   */
  createLocalDate(dateString) {
    if (!dateString) return null;
    
    try {
      // Se está no formato YYYY-MM-DD
      if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        // Criar data no fuso horário local (não UTC) - definir hora como meio-dia para evitar problemas de fuso
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
      }
      
      // Se está no formato DD/MM/YYYY
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao criar data local:', dateString, error);
      return null;
    }
  }
}

// Exportar instância singleton
export const pedidosCentralizedService = new PedidosCentralizedService();
export default pedidosCentralizedService;
