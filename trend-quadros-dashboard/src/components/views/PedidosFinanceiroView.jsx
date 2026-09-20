import React, { useMemo, useState } from 'react';

const taxasCartao = {
  1: 4.50,
  2: 5.69,
  3: 6.13,
  4: 6.61,
  5: 7.36,
  6: 7.93,
  7: 8.77,
  8: 9.63,
  9: 10.44,
  10: 10.77,
  11: 11.79,
  12: 12.63
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

const PedidosFinanceiroView = ({ data }) => {
  const pedidos = data?.todosPedidos || [];
  const [statusSelecionado, setStatusSelecionado] = useState('todos');
  const [busca, setBusca] = useState('');
  const [pedidoAberto, setPedidoAberto] = useState(null);
  const [financeiro, setFinanceiro] = useState({});

  const status = useMemo(() => {
    const mapa = {};
    pedidos.forEach((pedido) => {
      const situacao = pedido.situacao || 'Sem situação';
      mapa[situacao] = (mapa[situacao] || 0) + 1;
    });
    return mapa;
  }, [pedidos]);

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((pedido) => {
      const bateStatus =
        statusSelecionado === 'todos' ||
        pedido.situacao === statusSelecionado;

      const termo = busca.toLowerCase();
      const bateBusca =
        !termo ||
        String(pedido.numero || '').toLowerCase().includes(termo) ||
        String(pedido.nome_cliente || '').toLowerCase().includes(termo) ||
        String(pedido.cpf_cnpj || pedido.cnpj_cpf || '').toLowerCase().includes(termo);

      return bateStatus && bateBusca;
    });
  }, [pedidos, statusSelecionado, busca]);

  const normalizarPagamentos = (info = {}) => {
    if (Array.isArray(info.pagamentos) && info.pagamentos.length) {
      return info.pagamentos;
    }

    return [{
      data: info.dataPagamento || '',
      valor: Number(info.valorPago || 0),
      forma: info.formaPagamento || 'PIX',
      parcelas: Number(info.parcelas || 1),
      taxa: Number(info.taxaCartao || 0)
    }];
  };

  const atualizarPagamento = (pedido, indice, campo, valor) => {
    setFinanceiro((prev) => {
      const atual = prev[pedido.id] || {};
      const pagamentos = normalizarPagamentos(atual).map((pagamento) => ({ ...pagamento }));

      pagamentos[indice] = {
        ...pagamentos[indice],
        [campo]: campo === 'valor' || campo === 'parcelas' || campo === 'taxa'
          ? Number(valor || 0)
          : valor
      };

      return {
        ...prev,
        [pedido.id]: {
          ...atual,
          pagamentos
        }
      };
    });
  };

  const adicionarPagamento = (pedido) => {
    setFinanceiro((prev) => {
      const atual = prev[pedido.id] || {};
      const pagamentos = normalizarPagamentos(atual);

      return {
        ...prev,
        [pedido.id]: {
          ...atual,
          pagamentos: [
            ...pagamentos,
            {
              data: '',
              valor: 0,
              forma: 'PIX',
              parcelas: 1,
              taxa: 0
            }
          ]
        }
      };
    });
  };

  const removerPagamento = (pedido, indice) => {
    setFinanceiro((prev) => {
      const atual = prev[pedido.id] || {};
      const pagamentos = normalizarPagamentos(atual);

      if (pagamentos.length <= 1) return prev;

      return {
        ...prev,
        [pedido.id]: {
          ...atual,
          pagamentos: pagamentos.filter((_, i) => i !== indice)
        }
      };
    });
  };

  const atualizarFinanceiro = (pedido, campo, valor) => {
    setFinanceiro((prev) => {
      const atual = prev[pedido.id] || {};
      const novo = { ...atual, [campo]: valor };

      const valorTotal = Number(pedido.valor_total || 0);

      if (campo === 'statusPagamento') {
        if (valor === '50%') novo.valorPago = valorTotal / 2;
        else if (valor === '100%') novo.valorPago = valorTotal;
        else novo.valorPago = 0;
      }

      if (campo === 'parcelas') {
        novo.taxaCartao = taxasCartao[Number(valor)] || 0;
      }

      const valorPago = Number(novo.valorPago || 0);
      const taxa = novo.formaPagamento === 'Cartão'
        ? Number(novo.taxaCartao || 0)
        : 0;

      novo.custoTaxa = valorPago * (taxa / 100);
      novo.valorLiquido = valorPago - novo.custoTaxa;
      novo.saldoReceber = Math.max(0, valorTotal - valorPago);

      return {
        ...prev,
        [pedido.id]: novo
      };
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Pedidos Financeiro</h2>
          <p className="text-sm text-slate-400">
            Acompanhe os pedidos do Tiny por fase e complete os dados financeiros.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setStatusSelecionado('todos')}
            className={`rounded-lg border px-4 py-2 text-sm whitespace-nowrap ${
              statusSelecionado === 'todos'
                ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                : 'border-slate-700 bg-slate-900 text-slate-300'
            }`}
          >
            Todos {pedidos.length}
          </button>

          {Object.entries(status).map(([nome, quantidade]) => (
            <button
              key={nome}
              onClick={() => setStatusSelecionado(nome)}
              className={`rounded-lg border px-4 py-2 text-sm whitespace-nowrap ${
                statusSelecionado === nome
                  ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
            >
              {nome} {quantidade}
            </button>
          ))}
        </div>

        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por pedido, cliente ou CNPJ/CPF..."
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/70 text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Nº</th>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">Previsto</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">CNPJ/CPF</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-left">Situação</th>
              <th className="px-4 py-3 text-center">Financeiro</th>
            </tr>
          </thead>

          <tbody>
            {pedidosFiltrados.map((pedido) => {
              const info = financeiro[pedido.id] || {};
              const aberto = pedidoAberto === pedido.id;

              return (
                <React.Fragment key={pedido.id}>
                  <tr className="border-b border-slate-900 hover:bg-slate-900/40">
                    <td className="px-4 py-3 text-white">{pedido.numero || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{pedido.data_pedido || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{pedido.data_prevista || '-'}</td>
                    <td className="px-4 py-3 text-white">{pedido.nome_cliente || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {pedido.cpf_cnpj || pedido.cnpj_cpf || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-white">
                      {formatMoney(pedido.valor_total)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{pedido.situacao || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setPedidoAberto(aberto ? null : pedido.id)}
                        className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:border-blue-500 hover:text-blue-300"
                      >
                        {aberto ? 'Fechar' : 'Editar'}
                      </button>
                    </td>
                  </tr>

                  {aberto && (
                    <tr className="border-b border-slate-800 bg-slate-900/50">
                      <td colSpan="8" className="px-4 py-5">
                        <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">Pagamentos do pedido</div>
                      <div className="text-xs text-slate-400">
                        Registre uma ou mais entradas para este pedido.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => adicionarPagamento(pedido)}
                      className="rounded-lg border border-blue-500/50 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
                    >
                      + Adicionar pagamento
                    </button>
                  </div>

                  {normalizarPagamentos(info).map((pagamento, indice) => {
                    const taxa =
                      pagamento.forma === 'Cartão'
                        ? Number(
                            pagamento.taxa ||
                              taxasCartao[Number(pagamento.parcelas || 1)] ||
                              0
                          )
                        : 0;

                    const valor = Number(pagamento.valor || 0);
                    const custoTaxa = valor * (taxa / 100);
                    const valorLiquido = valor - custoTaxa;

                    return (
                      <div
                        key={indice}
                        className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div className="text-sm font-semibold text-slate-200">
                            Pagamento {indice + 1}
                          </div>

                          {normalizarPagamentos(info).length > 1 && (
                            <button
                              type="button"
                              onClick={() => removerPagamento(pedido, indice)}
                              className="text-xs font-medium text-red-300 hover:text-red-200"
                            >
                              Remover
                            </button>
                          )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <label className="space-y-2">
                            <span className="text-xs text-slate-400">Data do pagamento</span>
                            <input
                              type="date"
                              value={pagamento.data || ''}
                              onChange={(e) =>
                                atualizarPagamento(
                                  pedido,
                                  indice,
                                  'data',
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-xs text-slate-400">Valor recebido</span>
                            <input
                              type="number"
                              step="0.01"
                              value={pagamento.valor || ''}
                              onChange={(e) =>
                                atualizarPagamento(
                                  pedido,
                                  indice,
                                  'valor',
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                              placeholder="0,00"
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-xs text-slate-400">Forma de pagamento</span>
                            <select
                              value={pagamento.forma || 'PIX'}
                              onChange={(e) =>
                                atualizarPagamento(
                                  pedido,
                                  indice,
                                  'forma',
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                            >
                              <option>PIX</option>
                              <option>Cartão</option>
                              <option>Boleto</option>
                            </select>
                          </label>

                          {pagamento.forma === 'Cartão' && (
                            <label className="space-y-2">
                              <span className="text-xs text-slate-400">Parcelas</span>
                              <select
                                value={pagamento.parcelas || 1}
                                onChange={(e) =>
                                  atualizarPagamento(
                                    pedido,
                                    indice,
                                    'parcelas',
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                              >
                                {Object.keys(taxasCartao).map((parcela) => (
                                  <option key={parcela} value={parcela}>
                                    {parcela}x — {taxasCartao[parcela].toFixed(2)}%
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                            <div className="text-xs text-slate-500">Valor recebido</div>
                            <div className="mt-1 font-semibold text-white">
                              {formatMoney(valor)}
                            </div>
                          </div>

                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                            <div className="text-xs text-slate-500">Custo taxa</div>
                            <div className="mt-1 font-semibold text-red-300">
                              {formatMoney(custoTaxa)}
                            </div>
                          </div>

                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                            <div className="text-xs text-slate-500">Valor líquido</div>
                            <div className="mt-1 font-semibold text-emerald-300">
                              {formatMoney(valorLiquido)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs text-slate-400">Frete cobrado do cliente</span>
                      <input
                        type="number"
                        step="0.01"
                        value={info.freteCobrado || ''}
                        onChange={(e) =>
                          atualizarFinanceiro(
                            pedido,
                            'freteCobrado',
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs text-slate-400">Frete pago pela empresa</span>
                      <input
                        type="number"
                        step="0.01"
                        value={info.fretePago || ''}
                        onChange={(e) =>
                          atualizarFinanceiro(
                            pedido,
                            'fretePago',
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                            <div className="text-xs text-slate-500">Valor pago</div>
                            <div className="mt-1 font-semibold text-white">
                              {formatMoney(info.valorPago)}
                            </div>
                          </div>

                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                            <div className="text-xs text-slate-500">Custo taxa cartão</div>
                            <div className="mt-1 font-semibold text-red-300">
                              {formatMoney(info.custoTaxa)}
                            </div>
                          </div>

                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                            <div className="text-xs text-slate-500">Valor líquido</div>
                            <div className="mt-1 font-semibold text-emerald-300">
                              {formatMoney(info.valorLiquido)}
                            </div>
                          </div>

                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                            <div className="text-xs text-slate-500">Saldo a receber</div>
                            <div className="mt-1 font-semibold text-amber-300">
                              {formatMoney(info.saldoReceber ?? pedido.valor_total)}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PedidosFinanceiroView;
