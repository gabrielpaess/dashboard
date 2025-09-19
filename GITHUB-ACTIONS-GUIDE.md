# 🚀 GitHub Actions - Guia Completo para Sincronização

## 🎯 **O que é GitHub Actions?**

O GitHub Actions é um serviço de CI/CD integrado ao GitHub que permite automatizar tarefas como:
- ✅ Executar código automaticamente
- ✅ Agendar execuções (cron jobs)
- ✅ Executar manualmente quando necessário
- ✅ Monitorar logs e status
- ✅ Notificar sobre falhas

## 🔄 **Como Funciona a Sincronização**

### **Fluxo Automático**
```
GitHub Actions → Vercel API → Supabase
     ↓              ↓           ↓
Executa a cada   Processa     Dados
4 horas          pedidos      atualizados
```

### **Fluxo Manual**
```
Usuário → GitHub → Actions → Vercel API → Supabase
   ↓         ↓        ↓         ↓           ↓
Clica em   Executa   Processa  Atualiza   Dashboard
"Run"      workflow  pedidos   dados      atualizado
```

## 🛠️ **Configuração Passo a Passo**

### **Passo 1: Preparar o Repositório**

#### **1.1 Verificar se é um repositório Git**
```bash
# Verificar status
git status

# Se não for um repositório Git, inicializar
git init
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
```

#### **1.2 Fazer commit do arquivo de workflow**
```bash
# Adicionar arquivo
git add .github/workflows/sync.yml

# Fazer commit
git commit -m "Add GitHub Actions sync workflow"

# Enviar para o GitHub
git push origin main
```

### **Passo 2: Configurar a URL**

#### **2.1 Usar o script automático (Recomendado)**
```bash
# Executar script de configuração
npm run setup:github

# Seguir as instruções na tela
# Digitar a URL do seu dashboard na Vercel
```

#### **2.2 Configuração manual**
1. Abrir arquivo `.github/workflows/sync.yml`
2. Substituir `https://seu-dominio.vercel.app` pela URL real
3. Salvar e fazer commit

### **Passo 3: Ativar no GitHub**

#### **3.1 Acessar Actions**
1. Ir para: `https://github.com/seu-usuario/seu-repositorio/actions`
2. Clicar em "Sync Dashboard Data"
3. Clicar em "Run workflow"
4. Selecionar branch "main"
5. Clicar em "Run workflow"

#### **3.2 Verificar Execução**
1. Aguardar execução (1-2 minutos)
2. Clicar na execução para ver logs
3. Verificar se status é "✅ Success"

## 📊 **Monitoramento e Logs**

### **Verificar Status**
```
GitHub → Actions → Sync Dashboard Data → [Execução]
```

### **Logs Detalhados**
```
🔄 Iniciando sincronização do dashboard...
📊 Status HTTP: 200
📋 Resposta: {"success":true,"data":{"totalProcessed":150}}
✅ Sincronização executada com sucesso!
📈 Detalhes: {"totalProcessed":150,"totalWithItems":120}
🎉 Sincronização concluída com sucesso!
⏰ Timestamp: Mon Jan 27 10:30:00 UTC 2025
```

### **Interpretar Status**
- **✅ Success**: Sincronização bem-sucedida
- **❌ Failure**: Erro na sincronização
- **⏳ In Progress**: Executando
- **⏸️ Queued**: Aguardando execução

## ⚙️ **Configurações Avançadas**

### **Alterar Frequência**
Editar arquivo `.github/workflows/sync.yml`:

```yaml
# A cada 2 horas
- cron: '0 */2 * * *'

# A cada 6 horas  
- cron: '0 */6 * * *'

# Apenas uma vez por dia
- cron: '0 6 * * *'
```

### **Adicionar Notificações**
```yaml
- name: Notify on Success
  if: success()
  run: |
    echo "✅ Sincronização concluída!"
    # Adicionar notificação por email, Slack, etc.
```

### **Configurar Variáveis de Ambiente**
```yaml
env:
  SYNC_URL: ${{ secrets.SYNC_URL }}
  API_KEY: ${{ secrets.API_KEY }}
```

## 🔧 **Troubleshooting**

### **Problemas Comuns**

#### **1. Workflow não executa**
```
Causa: Arquivo não está na branch main
Solução: Fazer push do arquivo .github/workflows/sync.yml
```

#### **2. Erro 404 na URL**
```
Causa: URL incorreta ou dashboard não deployado
Solução: Verificar URL e fazer deploy na Vercel
```

#### **3. Timeout na execução**
```
Causa: Muitos pedidos para processar
Solução: Reduzir lotes no arquivo api/sync-manual.js
```

#### **4. Falha de autenticação**
```
Causa: Tokens inválidos ou expirados
Solução: Verificar variáveis de ambiente na Vercel
```

### **Soluções**

#### **1. Verificar Configuração**
```bash
# Testar URL manualmente
curl https://seu-dominio.vercel.app/api/sync-manual

# Verificar logs do GitHub Actions
# Ir para: GitHub > Actions > Sync Dashboard Data
```

#### **2. Ajustar Parâmetros**
```javascript
// Reduzir carga de processamento
const maxPages = 2;        // Menos páginas
const batchSize = 3;       // Lotes menores
const delay = 1000;        // Mais delay
```

#### **3. Monitorar Performance**
```bash
# Verificar duração da execução
# GitHub Actions > Sync Dashboard Data > [Execução] > Logs

# Verificar pedidos processados
# Procurar por "totalProcessed" nos logs
```

## 📈 **Vantagens do GitHub Actions**

### **✅ Gratuito**
- 2000 minutos/mês gratuitos
- Suficiente para sincronização a cada 4 horas

### **✅ Confiável**
- Infraestrutura do GitHub
- 99.9% de uptime
- Execução garantida

### **✅ Flexível**
- Execução manual e automática
- Configuração via YAML
- Integração com outros serviços

### **✅ Monitorável**
- Logs detalhados
- Status visual
- Notificações de falha

## 🎯 **Resultado Final**

Com o GitHub Actions configurado, você terá:

- ✅ **Sincronização automática** a cada 4 horas
- ✅ **Execução manual** quando necessário
- ✅ **Logs detalhados** para monitoramento
- ✅ **Notificações de falha** automáticas
- ✅ **Sem custos adicionais** (plano gratuito)
- ✅ **Integração nativa** com GitHub

## 🚀 **Próximos Passos**

1. **Configurar**: `npm run setup:github`
2. **Testar**: Executar manualmente no GitHub
3. **Monitorar**: Acompanhar logs e status
4. **Otimizar**: Ajustar frequência conforme necessário
5. **Expandir**: Adicionar notificações e alertas

O GitHub Actions é a solução perfeita para manter seu dashboard sempre atualizado! 🎉
