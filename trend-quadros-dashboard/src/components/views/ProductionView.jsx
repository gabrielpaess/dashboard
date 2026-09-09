import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Box,
  CheckCircle2,
  Clock,
  Factory,
  FileImage,
  PackageCheck,
  Palette,
  Search,
  ShoppingCart,
  Truck
} from 'lucide-react';

const STAGES = [
  {
    id: 'pedido',
    label: 'Pedido lançado',
    icon: Box,
    head: 'border-slate-600 bg-slate-800/70',
    badge: 'bg-slate-700 text-slate-200'
  },
  {
    id: 'arte',
    label: 'Arte',
    icon: Palette,
    head: 'border-violet-500/40 bg-violet-500/10',
    badge: 'bg-violet-500/15 text-violet-300'
  },
  {
    id: 'aprovacao',
    label: 'Aprovação',
    icon: CheckCircle2,
    head: 'border-rose-500/40 bg-rose-500/10',
    badge: 'bg-rose-500/15 text-rose-300'
  },
  {
    id: 'compras',
    label: 'Compras',
    icon: ShoppingCart,
    head: 'border-amber-500/40 bg-amber-500/10',
    badge: 'bg-amber-500/15 text-amber-300'
  },
  {
    id: 'arquivos',
    label: 'Arquivos',
    icon: FileImage,
    head: 'border-blue-500/40 bg-blue-500/10',
    badge: 'bg-blue-500/15 text-blue-300'
  },
  {
    id: 'producao',
    label: 'Produção',
    icon: Factory,
    head: 'border-emerald-500/40 bg-emerald-500/10',
    badge: 'bg-emerald-500/15 text-emerald-300'
  },
  {
    id: 'expedicao',
    label: 'Expedição',
    icon: Truck,
    head: 'border-cyan-500/40 bg-cyan-500/10',
    badge: 'bg-cyan-500/15 text-cyan-300'
  }
];

const parseDate = (value) => {
  if (!value) return null;

  if (typeof value === 'string' && value.includes('/')) {
    const [day, month, year] = value.split('/');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = parseDate(value);
  if (!date) return '-';

  return date.toLocaleDateString('pt-BR');
};

const inferStage = (pedido) => {
  const situacao = String(pedido?.situacao || '').toLowerCase();

  if (
    situacao.includes('pronto para envio') ||
    situacao.includes('enviado') ||
    situacao.includes('entregue')
  ) {
    return 'expedicao';
  }

  if (
    situacao.includes('preparando envio') ||
    situacao.includes('faturado')
  ) {
    return 'producao';
  }

  if (situacao.includes('aprovado')) {
    return 'arte';
  }

  return 'pedido';
};

const getDeadline = (pedido) =>
  pedido?.data_prevista ||
  pedido?.previsao_entrega ||
  pedido?.data_limite ||
  null;

const getRisk = (pedido) => {
  const deadline = parseDate(getDeadline(pedido));

  if (!deadline) {
    return {
      level: 'neutral',
      label: 'Sem prazo',
      days: null,
      className: 'border-slate-700 bg-slate-800 text-slate-300'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  const days = Math.ceil((deadline - today) / 86400000);

  if (days < 0) {
    return {
      level: 'late',
      label: 'Atrasado',
      days,
      className: 'border-red-500/30 bg-red-500/10 text-red-300'
    };
  }

  if (days <= 1) {
    return {
      level: 'critical',
      label: 'Crítico',
      days,
      className: 'border-red-500/30 bg-red-500/10 text-red-300'
    };
  }

  if (days <= 3) {
    return {
      level: 'risk',
      label: 'Em risco',
      days,
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-300'
    };
  }

  return {
    level: 'ok',
    label: 'No prazo',
    days,
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  };
};

const ProductionView = ({ data }) => {
  const pedidos = data?.todosPedidos || data?.orders || data?.pedidos || [];

  const [busca, setBusca] = useState('');
  const [stageByOrder, setStageByOrder] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ponto-production-stage-v1') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(
      'ponto-production-stage-v1',
      JSON.stringify(stageByOrder)
    );
  }, [stageByOrder]);

  const ativos = useMemo(() => {
    return pedidos
      .filter((pedido) => {
        const situacao = String(pedido.situacao || '').toLowerCase();

        return (
          !situacao.includes('cancelado') &&
          !situacao.includes('entregue')
        );
      })
      .map((pedido) => {
        const stage =
          stageByOrder[pedido.id] ||
          stageByOrder[pedido.numero] ||
          inferStage(pedido);

        return {
          ...pedido,
          productionStage: stage,
          risk: getRisk(pedido)
        };
      });
  }, [pedidos, stageByOrder]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return ativos;

    return ativos.filter((pedido) =>
      [
        pedido.numero,
        pedido.nome_cliente,
        pedido.situacao,
        pedido.cpf_cnpj,
        pedido.cnpj_cpf
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(termo)
        )
    );
  }, [ativos, busca]);

  const counts = useMemo(() => {
    const map = {};

    STAGES.forEach((stage) => {
      map[stage.id] = ativos.filter(
        (pedido) => pedido.productionStage === stage.id
      ).length;
    });

    return map;
  }, [ativos]);

  const atrasados = ativos.filter(
    (pedido) =>
      pedido.risk.level === 'late' ||
      pedido.risk.level === 'critical'
  );

  const emRisco = ativos.filter(
    (pedido) => pedido.risk.level === 'risk'
  );

  const filaPrioridade = useMemo(() => {
    const weight = {
      late: 0,
      critical: 1,
      risk: 2,
      neutral: 3,
      ok: 4
    };

    return [...filtrados].sort((a, b) => {
      const riskCompare =
        weight[a.risk.level] - weight[b.risk.level];

      if (riskCompare !== 0) return riskCompare;

      const aDate = parseDate(getDeadline(a));
      const bDate = parseDate(getDeadline(b));

      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;

      return aDate - bDate;
    });
  }, [filtrados]);

  const updateStage = (pedido, stage) => {
    const key = pedido.id || pedido.numero;

    setStageByOrder((prev) => ({
      ...prev,
      [key]: stage
    }));
  };

  const resumoGerente = useMemo(() => {
    if (!ativos.length) {
      return 'Nenhum pedido ativo encontrado.';
    }

    if (atrasados.length) {
      return `${atrasados.length} pedido(s) exigem atenção imediata. Priorize os pedidos com prazo vencido ou expedição em até 1 dia.`;
    }

    if (emRisco.length) {
      return `${emRisco.length} pedido(s) estão em risco. Vale antecipar as próximas etapas hoje.`;
    }

    return 'A operação está saudável. Nenhum pedido crítico foi identificado pelos prazos cadastrados.';
  }, [ativos, atrasados.length, emRisco.length]);

  const comprasPendentes = filaPrioridade.filter(
    (pedido) => pedido.productionStage === 'compras'
  );

  const cards = [
    {
      label: 'Pedidos ativos',
      value: ativos.length,
      icon: Box,
      className: 'text-blue-300'
    },
    {
      label: 'Atrasados / críticos',
      value: atrasados.length,
      icon: Clock,
      className: 'text-red-300'
    },
    {
      label: 'Em risco',
      value: emRisco.length,
      icon: AlertTriangle,
      className: 'text-amber-300'
    },
    {
      label: 'Aguardando arte',
      value: counts.arte || 0,
      icon: Palette,
      className: 'text-violet-300'
    },
    {
      label: 'Compras pendentes',
      value: counts.compras || 0,
      icon: ShoppingCart,
      className: 'text-amber-300'
    },
    {
      label: 'Em produção',
      value: counts.producao || 0,
      icon: Factory,
      className: 'text-emerald-300'
    },
    {
      label: 'Expedição',
      value: counts.expedicao || 0,
      icon: Truck,
      className: 'text-cyan-300'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Central de Produção
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Controle de pedidos, prazos, gargalos e prioridades da operação.
          </p>
        </div>

        <div className="relative w-full xl:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar pedido, cliente ou status..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-xl border border-slate-800 bg-slate-950/80 p-4"
            >
              <div className="flex items-center justify-between">
                <Icon className={`h-5 w-5 ${card.className}`} />
                <span className="text-2xl font-semibold text-white">
                  {card.value}
                </span>
              </div>

              <div className="mt-3 text-xs text-slate-400">
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">
            Fluxo de Produção
          </h3>
          <p className="text-sm text-slate-500">
            Acompanhe em qual etapa cada pedido se encontra.
          </p>
        </div>

        <div className="grid min-w-[1200px] grid-cols-7 gap-3 overflow-x-auto">
          {STAGES.map((stage) => {
            const Icon = stage.icon;
            const stageOrders = filaPrioridade.filter(
              (pedido) => pedido.productionStage === stage.id
            );

            return (
              <div
                key={stage.id}
                className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/40"
              >
                <div
                  className={`rounded-t-xl border-b px-3 py-3 ${stage.head}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-200" />
                      <span className="text-xs font-medium text-white">
                        {stage.label}
                      </span>
                    </div>

                    <span className="rounded-full bg-slate-950/70 px-2 py-0.5 text-xs text-slate-300">
                      {stageOrders.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 p-2">
                  {stageOrders.slice(0, 5).map((pedido) => (
                    <div
                      key={pedido.id || pedido.numero}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-white">
                          #{pedido.numero || pedido.id}
                        </span>

                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${pedido.risk.className}`}
                        >
                          {pedido.risk.label}
                        </span>
                      </div>

                      <div className="mt-2 truncate text-xs text-slate-300">
                        {pedido.nome_cliente || 'Cliente não informado'}
                      </div>

                      <div className="mt-2 text-[11px] text-slate-500">
                        Prazo: {formatDate(getDeadline(pedido))}
                      </div>
                    </div>
                  ))}

                  {stageOrders.length > 5 && (
                    <div className="px-2 py-1 text-center text-xs text-slate-500">
                      + {stageOrders.length - 5} pedidos
                    </div>
                  )}

                  {!stageOrders.length && (
                    <div className="px-2 py-6 text-center text-xs text-slate-600">
                      Nenhum pedido
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-violet-500/15 p-2">
                <Bot className="h-5 w-5 text-violet-300" />
              </div>

              <div>
                <h3 className="font-semibold text-white">
                  Gerente de Produção
                </h3>
                <span className="text-xs text-violet-300">
                  Resumo automático
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              {resumoGerente}
            </p>

            <div className="mt-4 space-y-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <div className="text-xs text-slate-500">
                  Prioridade máxima
                </div>
                <div className="mt-1 text-sm font-medium text-white">
                  {filaPrioridade[0]
                    ? `Pedido #${filaPrioridade[0].numero || filaPrioridade[0].id}`
                    : 'Nenhuma'}
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <div className="text-xs text-slate-500">
                  Maior fila atual
                </div>
                <div className="mt-1 text-sm font-medium text-white">
                  {
                    STAGES.reduce(
                      (maior, stage) =>
                        (counts[stage.id] || 0) >
                        (counts[maior.id] || 0)
                          ? stage
                          : maior,
                      STAGES[0]
                    ).label
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-300" />
              <h3 className="font-semibold text-white">
                Alertas
              </h3>
            </div>

            <div className="mt-4 space-y-3">
              {filaPrioridade
                .filter((pedido) =>
                  ['late', 'critical', 'risk'].includes(
                    pedido.risk.level
                  )
                )
                .slice(0, 5)
                .map((pedido) => (
                  <div
                    key={pedido.id || pedido.numero}
                    className="border-b border-slate-800 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="text-sm text-white">
                      Pedido #{pedido.numero || pedido.id}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {pedido.risk.label} • prazo{' '}
                      {formatDate(getDeadline(pedido))}
                    </div>
                  </div>
                ))}

              {!atrasados.length && !emRisco.length && (
                <div className="text-sm text-slate-500">
                  Nenhum alerta crítico no momento.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-amber-300" />
              <h3 className="font-semibold text-white">
                Compras pendentes
              </h3>
            </div>

            <div className="mt-4 space-y-3">
              {comprasPendentes.slice(0, 5).map((pedido) => (
                <div
                  key={pedido.id || pedido.numero}
                  className="border-b border-slate-800 pb-3 last:border-0 last:pb-0"
                >
                  <div className="text-sm text-white">
                    #{pedido.numero || pedido.id}
                  </div>
                  <div className="mt-1 truncate text-xs text-slate-500">
                    {pedido.nome_cliente}
                  </div>
                </div>
              ))}

              {!comprasPendentes.length && (
                <div className="text-sm text-slate-500">
                  Nenhum pedido marcado em Compras.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
          <div className="border-b border-slate-800 px-5 py-4">
            <h3 className="font-semibold text-white">
              Pedidos em Produção
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Fila ordenada automaticamente por risco e prazo.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="bg-slate-900/70 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Pedido</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Prazo</th>
                  <th className="px-4 py-3 text-left">Etapa atual</th>
                  <th className="px-4 py-3 text-left">Risco</th>
                  <th className="px-4 py-3 text-left">Tiny</th>
                </tr>
              </thead>

              <tbody>
                {filaPrioridade.slice(0, 20).map((pedido) => {
                  const currentStage =
                    STAGES.find(
                      (stage) =>
                        stage.id === pedido.productionStage
                    ) || STAGES[0];

                  return (
                    <tr
                      key={pedido.id || pedido.numero}
                      className="border-t border-slate-900 hover:bg-slate-900/40"
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        #{pedido.numero || pedido.id}
                      </td>

                      <td className="max-w-[260px] truncate px-4 py-3 text-slate-300">
                        {pedido.nome_cliente || '-'}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {formatDate(getDeadline(pedido))}
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={pedido.productionStage}
                          onChange={(e) =>
                            updateStage(pedido, e.target.value)
                          }
                          className={`rounded-lg border border-slate-700 px-3 py-2 text-xs outline-none ${currentStage.badge}`}
                        >
                          {STAGES.map((stage) => (
                            <option
                              key={stage.id}
                              value={stage.id}
                              className="bg-slate-950 text-white"
                            >
                              {stage.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${pedido.risk.className}`}
                        >
                          {pedido.risk.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-500">
                        {pedido.situacao || '-'}
                      </td>
                    </tr>
                  );
                })}

                {!filaPrioridade.length && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      Nenhum pedido ativo encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3 text-xs text-slate-500">
            <span>
              Mostrando até 20 de {filaPrioridade.length} pedidos
            </span>

            <div className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-emerald-400" />
              Priorização automática por prazo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionView;
