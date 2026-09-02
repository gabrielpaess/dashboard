import React, { useMemo, useState } from 'react';

const brl = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));

const FinanceView = () => {
  const [cash, setCash] = useState(0);

  const [payables, setPayables] = useState([]);
  const [receivables, setReceivables] = useState([]);

  const [payableForm, setPayableForm] = useState({
    description: '',
    amount: '',
    dueDate: '',
  });

  const [receivableForm, setReceivableForm] = useState({
    description: '',
    amount: '',
    dueDate: '',
  });

  const totals = useMemo(() => {
    const toPay = payables
      .filter((item) => item.status !== 'Pago')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const toReceive = receivables
      .filter((item) => item.status !== 'Recebido')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      toPay,
      toReceive,
      projected: Number(cash || 0) + toReceive - toPay,
    };
  }, [cash, payables, receivables]);

  const addPayable = (e) => {
    e.preventDefault();

    if (!payableForm.description || !payableForm.amount) return;

    setPayables((current) => [
      ...current,
      {
        id: Date.now(),
        ...payableForm,
        amount: Number(payableForm.amount),
        status: 'Pendente',
      },
    ]);

    setPayableForm({
      description: '',
      amount: '',
      dueDate: '',
    });
  };

  const addReceivable = (e) => {
    e.preventDefault();

    if (!receivableForm.description || !receivableForm.amount) return;

    setReceivables((current) => [
      ...current,
      {
        id: Date.now(),
        ...receivableForm,
        amount: Number(receivableForm.amount),
        status: 'Pendente',
      },
    ]);

    setReceivableForm({
      description: '',
      amount: '',
      dueDate: '',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
          Central financeira
        </p>
        <h2 className="mt-2 text-3xl font-bold text-white">
          Financeiro
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Controle manual de caixa, contas a pagar e contas a receber.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Caixa atual</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {brl(cash)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">A receber</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {brl(totals.toReceive)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">A pagar</p>
          <p className="mt-2 text-2xl font-bold text-red-400">
            {brl(totals.toPay)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Caixa projetado</p>
          <p className="mt-2 text-2xl font-bold text-blue-400">
            {brl(totals.projected)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
        <label className="text-sm font-medium text-white">
          Saldo atual do caixa / banco
        </label>

        <div className="mt-3 flex max-w-md gap-3">
          <input
            type="number"
            step="0.01"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-lg font-semibold text-white">
            Nova conta a pagar
          </h3>

          <form onSubmit={addPayable} className="mt-4 space-y-3">
            <input
              placeholder="Fornecedor / descrição"
              value={payableForm.description}
              onChange={(e) =>
                setPayableForm({
                  ...payableForm,
                  description: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
            />

            <input
              type="number"
              step="0.01"
              placeholder="Valor"
              value={payableForm.amount}
              onChange={(e) =>
                setPayableForm({
                  ...payableForm,
                  amount: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
            />

            <input
              type="date"
              value={payableForm.dueDate}
              onChange={(e) =>
                setPayableForm({
                  ...payableForm,
                  dueDate: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
            />

            <button
              type="submit"
              className="rounded-lg bg-red-500 px-4 py-3 font-semibold text-white"
            >
              Adicionar conta
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-lg font-semibold text-white">
            Nova conta a receber
          </h3>

          <form onSubmit={addReceivable} className="mt-4 space-y-3">
            <input
              placeholder="Cliente / descrição"
              value={receivableForm.description}
              onChange={(e) =>
                setReceivableForm({
                  ...receivableForm,
                  description: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
            />

            <input
              type="number"
              step="0.01"
              placeholder="Valor"
              value={receivableForm.amount}
              onChange={(e) =>
                setReceivableForm({
                  ...receivableForm,
                  amount: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
            />

            <input
              type="date"
              value={receivableForm.dueDate}
              onChange={(e) =>
                setReceivableForm({
                  ...receivableForm,
                  dueDate: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
            />

            <button
              type="submit"
              className="rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-white"
            >
              Adicionar recebimento
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-lg font-semibold text-white">
            Contas a pagar
          </h3>

          <div className="mt-4 space-y-2">
            {payables.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhuma conta cadastrada.
              </p>
            ) : (
              payables.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3"
                >
                  <div>
                    <p className="font-medium text-white">
                      {item.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.dueDate || 'Sem vencimento'}
                    </p>
                  </div>

                  <strong className="text-red-400">
                    {brl(item.amount)}
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-lg font-semibold text-white">
            Contas a receber
          </h3>

          <div className="mt-4 space-y-2">
            {receivables.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum recebimento cadastrado.
              </p>
            ) : (
              receivables.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3"
                >
                  <div>
                    <p className="font-medium text-white">
                      {item.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.dueDate || 'Sem vencimento'}
                    </p>
                  </div>

                  <strong className="text-emerald-400">
                    {brl(item.amount)}
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceView;
