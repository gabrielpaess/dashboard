# 📊 Explicação dos Indicadores de Vendas

## 🔍 Como são Calculados os Indicadores

### **💰 Fonte dos Dados**
- **API do Tiny**: Busca todos os pedidos do período filtrado
- **Campo `valor`**: Valor total de cada pedido
- **Período**: Baseado no filtro de data aplicado (padrão: últimos 7 dias)

### **🧮 Cálculo do Revenue Total**
```javascript
const totalRevenue = apiOrders.reduce((sum, { pedido }) => 
  sum + parseFloat(pedido.valor || 0), 0
);
```
- **Soma**: Todos os valores dos pedidos do período
- **Conversão**: `parseFloat()` para garantir número
- **Fallback**: `|| 0` para pedidos sem valor

---

## 📈 Métricas por Período

### **📅 Meta Diária**
```javascript
daily: { 
  current: totalRevenue / 30,           // ❌ PROBLEMA: Divide por 30 fixo
  goal: Math.max(7000, totalRevenue / 30 * 1.3),  // ❌ PROBLEMA: Baseado em 30 dias
  previous: totalRevenue / 30 * 0.9
}
```

**Problemas Identificados**:
- **Divisão Fixa**: Sempre divide por 30, independente do período filtrado
- **Meta Irreal**: Se período = 7 dias, meta diária fica muito baixa
- **Inconsistência**: Não considera o período real dos dados

### **📆 Meta Semanal**
```javascript
weekly: { 
  current: (totalRevenue / 30) * 7,     // ❌ PROBLEMA: Baseado em 30 dias
  goal: Math.max(45000, (totalRevenue / 30) * 7 * 1.3),  // ❌ PROBLEMA: Meta fixa
  previous: (totalRevenue / 30) * 7 * 0.9
}
```

**Problemas Identificados**:
- **Cálculo Incorreto**: `(totalRevenue / 30) * 7` não faz sentido
- **Meta Fixa**: `Math.max(45000, ...)` ignora dados reais
- **Período Ignorado**: Não considera quantos dias realmente tem

### **📊 Meta Mensal**
```javascript
monthly: { 
  current: totalRevenue,                // ✅ CORRETO: Revenue total do período
  goal: Math.max(200000, totalRevenue * 1.2),  // ❌ PROBLEMA: Meta fixa
  previous: totalRevenue * 0.9
}
```

**Análise**:
- **Current**: ✅ Correto - usa revenue total
- **Goal**: ❌ Meta fixa de R$ 200.000
- **Previous**: ✅ Correto - 90% do atual

---

## ⚠️ Problemas Identificados

### **1. Divisão por 30 Fixa**
```javascript
// PROBLEMA: Sempre divide por 30
current: totalRevenue / 30

// SOLUÇÃO: Dividir pelo período real
current: totalRevenue / diasNoPeriodo
```

### **2. Metas Não Realistas**
```javascript
// PROBLEMA: Metas fixas ignoram dados reais
goal: Math.max(7000, totalRevenue / 30 * 1.3)

// SOLUÇÃO: Metas baseadas em dados históricos
goal: calcularMetaBaseadaEmHistorico(periodo, dados)
```

### **3. Período Ignorado**
- **Filtro de 7 dias**: Meta diária fica muito baixa
- **Filtro de 30 dias**: Meta diária fica muito alta
- **Filtro de 1 dia**: Cálculos ficam inconsistentes

---

## 🔧 Proposta de Correção

### **Cálculo Correto por Período**
```javascript
const diasNoPeriodo = calcularDiasEntreDatas(dataInicial, dataFinal);
const diasNoMes = new Date().getDate(); // Dia atual do mês
const diasNaSemana = 7;

salesMetrics: {
  daily: { 
    current: totalRevenue / diasNoPeriodo,
    goal: calcularMetaDiaria(dadosHistoricos),
    previous: totalRevenue / diasNoPeriodo * 0.9
  },
  weekly: { 
    current: totalRevenue / diasNoPeriodo * 7,
    goal: calcularMetaSemanal(dadosHistoricos),
    previous: totalRevenue / diasNoPeriodo * 7 * 0.9
  },
  monthly: { 
    current: totalRevenue / diasNoPeriodo * diasNoMes,
    goal: calcularMetaMensal(dadosHistoricos),
    previous: totalRevenue / diasNoPeriodo * diasNoMes * 0.9
  }
}
```

### **Metas Inteligentes**
```javascript
const calcularMetaDiaria = (dadosHistoricos) => {
  const mediaHistorica = calcularMedia(dadosHistoricos);
  return Math.max(7000, mediaHistorica * 1.2);
};

const calcularMetaSemanal = (dadosHistoricos) => {
  const mediaSemanal = calcularMediaSemanal(dadosHistoricos);
  return Math.max(45000, mediaSemanal * 1.15);
};

const calcularMetaMensal = (dadosHistoricos) => {
  const mediaMensal = calcularMediaMensal(dadosHistoricos);
  return Math.max(200000, mediaMensal * 1.1);
};
```

---

## 📋 Resumo dos Problemas

| Métrica | Problema | Impacto |
|---------|----------|---------|
| **Diária** | Divisão por 30 fixa | Metas irreais |
| **Semanal** | Cálculo `(total/30)*7` | Valores incorretos |
| **Mensal** | Meta fixa R$ 200k | Não reflete capacidade real |
| **Período** | Ignorado no cálculo | Inconsistência com filtros |

---

## 🎯 Recomendação

**Implementar cálculo baseado no período real dos dados filtrados**, considerando:
1. **Dias reais** do período filtrado
2. **Metas dinâmicas** baseadas em dados históricos
3. **Consistência** entre filtros e cálculos
4. **Realismo** nas metas propostas

*Este documento foi gerado para explicar a lógica atual e propor melhorias nos cálculos de métricas de vendas.*

