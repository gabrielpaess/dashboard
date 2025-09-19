# 🔗 Como Funciona o Webhook - Guia Completo

## 🎯 Conceito Básico

O **webhook** é uma forma de contornar as limitações do plano gratuito da Vercel, permitindo sincronização mais frequente que 1x por dia.

### 📊 Comparação de Frequências

```
┌─────────────────┬──────────────┬─────────────┬─────────────┐
│     Método      │  Frequência  │    Custo    │  Limitações │
├─────────────────┼──────────────┼─────────────┼─────────────┤
│ Cron Vercel     │ 1x por dia   │   Gratuito  │ Plano Hobby │
│ Webhook Externo │ 2-4x por dia │   Gratuito  │   Externa   │
│ Manual          │   Sob demanda│   Gratuito  │  Manual     │
└─────────────────┴──────────────┴─────────────┴─────────────┘
```

## 🔄 Fluxo de Funcionamento

### 1. Configuração Inicial
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │    │   Vercel API    │    │ Serviço Externo │
│   (Frontend)    │    │   (Backend)     │    │  (Webhook)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
    Usuários acessam        Endpoints criados      Configuração
    o dashboard             /api/sync              do webhook
                           /api/sync-manual
```

### 2. Execução Automática
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Serviço Externo │───▶│   Vercel API    │───▶│   Supabase      │
│  (Zapier/IFTTT) │    │   /api/sync     │    │   (Banco)       │
│                 │    │   -manual       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
    Executa a cada          Processa pedidos        Dados atualizados
    2-4 horas              da API Tiny             no dashboard
```

## 🛠️ Configuração Passo a Passo

### Opção 1: Zapier (Recomendado)

#### 1. Criar Conta no Zapier
- Acesse: https://zapier.com
- Crie uma conta gratuita
- Limite: 100 execuções/mês

#### 2. Configurar Zap
```
Trigger: Schedule by Zapier
├── Frequência: Every 4 hours
├── Horário: 24/7
└── Timezone: UTC

Action: Webhooks by Zapier
├── URL: https://seu-dominio.vercel.app/api/sync-manual
├── Método: GET
├── Headers: (opcional)
└── Test: Sim
```

#### 3. Ativar Zap
- Teste a conexão
- Ative o Zap
- Monitore execuções

### Opção 2: IFTTT (Alternativa)

#### 1. Criar Conta no IFTTT
- Acesse: https://ifttt.com
- Crie uma conta gratuita
- Limite: 3 Applets ativos

#### 2. Configurar Applet
```
IF: Date & Time
├── Every 4 hours
└── At any time

THEN: Webhooks
├── URL: https://seu-dominio.vercel.app/api/sync-manual
├── Method: GET
├── Content Type: application/json
└── Body: (vazio)
```

### Opção 3: Cron-job.org (Simples)

#### 1. Criar Conta
- Acesse: https://cron-job.org
- Crie uma conta gratuita
- Limite: 1 job ativo

#### 2. Configurar Job
```
Title: Dashboard Sync
URL: https://seu-dominio.vercel.app/api/sync-manual
Schedule: */4 * * * * (a cada 4 horas)
Method: GET
Timeout: 60 seconds
```

### Opção 4: GitHub Actions (Avançado)

#### 1. Criar Workflow
Arquivo: `.github/workflows/sync.yml`
```yaml
name: Sync Dashboard
on:
  schedule:
    - cron: '0 */4 * * *'  # A cada 4 horas
  workflow_dispatch:        # Execução manual

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
    - name: Sync Data
      run: |
        curl -X GET https://seu-dominio.vercel.app/api/sync-manual
```

#### 2. Commit e Push
```bash
git add .github/workflows/sync.yml
git commit -m "Add webhook sync workflow"
git push origin main
```

## 🧪 Testando o Webhook

### 1. Teste Manual
```bash
# Testar sincronização manual
curl https://seu-dominio.vercel.app/api/sync-manual

# Testar sincronização diária
curl https://seu-dominio.vercel.app/api/sync
```

### 2. Teste Automatizado
```bash
# Usar script de teste
npm run test:webhook

# Ou executar diretamente
node test-webhook.js
```

### 3. Verificar Logs
- Acesse painel da Vercel
- Vá em "Functions"
- Visualize logs de `/api/sync-manual`

## 📊 Monitoramento

### 1. Status dos Endpoints
```bash
# Verificar status
curl -s https://seu-dominio.vercel.app/api/sync-manual | jq

# Resposta esperada:
{
  "success": true,
  "message": "Sincronização manual executada com sucesso",
  "data": {
    "totalProcessed": 150,
    "totalWithItems": 120,
    "totalWithoutItems": 30,
    "pagesProcessed": 3,
    "duration": 45.2,
    "timestamp": "2025-01-27T10:30:00.000Z",
    "type": "manual"
  }
}
```

### 2. Logs da Vercel
```
🔄 Iniciando sincronização manual...
📄 Sincronizando página 1...
📦 Processando 50 pedidos da página 1
✅ Sincronização manual finalizada em 45.2s
📊 Resumo: 150 pedidos processados (120 com itens, 30 sem itens)
```

### 3. Alertas de Falha
- Configure notificações no serviço de webhook
- Monitore logs da Vercel
- Configure alertas por email/SMS

## ⚡ Otimizações

### 1. Frequência Ideal
```
┌─────────────┬──────────────┬─────────────┬─────────────┐
│  Frequência │   Pedidos    │   Custo     │  Performance│
├─────────────┼──────────────┼─────────────┼─────────────┤
│ A cada 2h   │    Muitos    │    Alto     │    Excelente│
│ A cada 4h   │    Médio     │    Médio    │     Boa    │
│ A cada 6h   │    Poucos    │    Baixo    │    Adequada│
│ 1x por dia  │    Mínimo    │   Gratuito  │    Básica  │
└─────────────┴──────────────┴─────────────┴─────────────┘
```

### 2. Configuração Recomendada
- **Desenvolvimento**: A cada 4 horas
- **Produção**: A cada 2 horas
- **Teste**: Manual apenas

### 3. Tratamento de Erros
- Retry automático em falhas
- Timeout adequado (60s)
- Logs detalhados
- Notificações de falha

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Webhook não executa
```
Causa: URL incorreta ou serviço inativo
Solução: Verificar URL e testar manualmente
```

#### 2. Timeout na execução
```
Causa: Muitos pedidos para processar
Solução: Reduzir lotes ou páginas
```

#### 3. Rate limiting da API
```
Causa: Muitas requisições para API Tiny
Solução: Aumentar delays entre requisições
```

#### 4. Erro de autenticação
```
Causa: Tokens inválidos ou expirados
Solução: Verificar variáveis de ambiente
```

### Soluções

#### 1. Verificar Configuração
```bash
# Testar endpoints
npm run test:webhook

# Verificar logs
vercel logs --follow
```

#### 2. Ajustar Parâmetros
```javascript
// Reduzir carga
const maxPages = 2;        // Menos páginas
const batchSize = 3;       // Lotes menores
const delay = 1000;        // Mais delay
```

#### 3. Monitorar Performance
```bash
# Verificar status
curl -s https://seu-dominio.vercel.app/api/sync-manual | jq '.data.duration'

# Verificar pedidos processados
curl -s https://seu-dominio.vercel.app/api/sync-manual | jq '.data.totalProcessed'
```

## 🎯 Resultado Final

Com o webhook configurado, você terá:

- ✅ **Sincronização automática** a cada 2-4 horas
- ✅ **Dados sempre atualizados** no dashboard
- ✅ **Sem custos adicionais** (usando serviços gratuitos)
- ✅ **Monitoramento completo** via logs e status
- ✅ **Tratamento de erros** automático
- ✅ **Flexibilidade** para ajustar frequência

O webhook é a solução perfeita para manter o dashboard atualizado sem pagar pelo plano Pro da Vercel! 🚀
