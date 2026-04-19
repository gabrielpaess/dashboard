/**
 * Intervalo de datas para pesquisa de pedidos na API Tiny (regra de negócio):
 * dataInicial = dois meses atrás, dataFinal = hoje.
 * Mantém a mesma semântica de TinyApiService no Nest.
 */

function formatDateToTiny(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getRollingTwoMonthTinyDateRange() {
  const dataFinal = new Date();
  const dataInicial = new Date();
  dataInicial.setMonth(dataInicial.getMonth() - 2);
  return {
    dataInicial: formatDateToTiny(dataInicial),
    dataFinal: formatDateToTiny(dataFinal),
  };
}

module.exports = { formatDateToTiny, getRollingTwoMonthTinyDateRange };
