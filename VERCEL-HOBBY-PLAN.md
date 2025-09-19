# 🆓 Configuração para Plano Gratuito da Vercel (Hobby)

## ⚠️ Limitações do Plano Hobby

### Cron Jobs
- **Quantidade**: Apenas 2 cron jobs por conta
- **Frequência**: Máximo 1 execução por dia
- **Precisão**: Não garante execução exata (pode variar até 1 hora)
- **Projeto**: Máximo 20 cron jobs por projeto

### Functions
- **Timeout**: Máximo 5 minutos por execução
- **Memória**: 1GB por função
- **Execuções**: 100GB-horas por mês

## ✅ Solução Implementada

### 1. Cron Job Diário
```json
{
  "path": "/api/sync",
  "schedule": "0 6 * * *"
}
```
- **Execução**: Diariamente às 6:00 AM UTC
- **Função**: Sincronização completa (até 20 páginas)
- **Timeout**: 5 minutos
- **Otimização**: Lotes de 5 pedidos, 100 por página

### 2. Sincronização Manual
```json
{
  "path": "/api/sync-manual",
  "maxDuration": 60
}
```
- **Execução**: Sob demanda (sem limite)
- **Função**: Sincronização rápida (3 páginas)
- **Timeout**: 1 minuto
- **Otimização**: Lotes de 3 pedidos, 50 por página

## 🔧 Configuração

### 1. Deploy na Vercel
```bash
# Build de produção
npm run build:production

# Deploy
vercel --prod
```

### 2. Configurar Webhook Externo (Recomendado)
```bash
# Configurar webhook para sincronização mais frequente
npm run setup:webhook
```

### 3. Testar Endpoints
```bash
# Testar sincronização diária
curl https://seu-dominio.vercel.app/api/sync

# Testar sincronização manual
curl https://seu-dominio.vercel.app/api/sync-manual
```

## 📊 Estratégias de Sincronização

### Opção 1: Apenas Cron Diário
- ✅ **Prós**: Simples, sem custos adicionais
- ❌ **Contras**: Dados atualizados apenas 1x por dia
- 🎯 **Ideal para**: Uso básico, poucos pedidos

### Opção 2: Cron + Webhook Externo
- ✅ **Prós**: Dados atualizados a cada 2-4 horas
- ✅ **Prós**: Mantém limite do plano gratuito
- ❌ **Contras**: Requer configuração adicional
- 🎯 **Ideal para**: Uso profissional, muitos pedidos

### Opção 3: Apenas Manual
- ✅ **Prós**: Controle total sobre execução
- ❌ **Contras**: Requer execução manual
- 🎯 **Ideal para**: Testes, uso esporádico

## 🔗 Serviços de Webhook Recomendados

### 1. Zapier (Gratuito)
- **Limite**: 100 execuções/mês
- **Frequência**: A cada 2-4 horas
- **Configuração**: Schedule by Zapier + Webhooks

### 2. IFTTT (Gratuito)
- **Limite**: 3 Applets ativos
- **Frequência**: A cada 2-4 horas
- **Configuração**: Date & Time + Webhooks

### 3. Cron-job.org (Gratuito)
- **Limite**: 1 job ativo
- **Frequência**: A cada 2-4 horas
- **Configuração**: URL + Schedule

### 4. GitHub Actions (Gratuito)
- **Limite**: 2000 minutos/mês
- **Frequência**: A cada 2-4 horas
- **Configuração**: .github/workflows/sync.yml

## 📈 Monitoramento

### Logs da Vercel
1. Acesse o painel da Vercel
2. Vá em "Functions"
3. Visualize logs de `/api/sync` e `/api/sync-manual`

### Status dos Endpoints
```bash
# Verificar status da sincronização diária
curl -s https://seu-dominio.vercel.app/api/sync | jq

# Verificar status da sincronização manual
curl -s https://seu-dominio.vercel.app/api/sync-manual | jq
```

### Métricas Incluídas
- Total de pedidos processados
- Pedidos com itens vs sem itens
- Tempo de execução
- Páginas processadas
- Timestamp da execução

## 🚀 Upgrade para Plano Pro

### Benefícios do Plano Pro
- **Cron Jobs**: 40 cron jobs, execução ilimitada
- **Precisão**: Execução exata no horário programado
- **Functions**: 1000GB-horas por mês
- **Custo**: $20/mês por membro da equipe

### Configuração Pro
```json
{
  "crons": [
    {
      "path": "/api/sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

## 💡 Dicas de Otimização

### Para Plano Hobby
1. **Use webhook externo** para sincronização frequente
2. **Monitore logs** para identificar problemas
3. **Teste endpoints** antes de configurar webhooks
4. **Configure alertas** para falhas de sincronização

### Para Plano Pro
1. **Configure múltiplos cron jobs** para diferentes frequências
2. **Use sincronização incremental** para pedidos recentes
3. **Implemente retry logic** para falhas temporárias
4. **Monitore métricas** de performance

## 🔧 Troubleshooting

### Problemas Comuns
1. **Timeout**: Reduza lotes ou páginas
2. **Rate Limiting**: Aumente delays entre requisições
3. **Falhas de API**: Verifique tokens e URLs
4. **Cron não executa**: Verifique configuração do vercel.json

### Soluções
1. **Ajustar parâmetros** nos endpoints
2. **Configurar webhook externo** como backup
3. **Monitorar logs** da Vercel
4. **Testar localmente** antes do deploy

## 📋 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] vercel.json configurado corretamente
- [ ] Endpoints testados localmente
- [ ] Deploy realizado na Vercel
- [ ] Cron job funcionando
- [ ] Webhook externo configurado (opcional)
- [ ] Monitoramento ativo
- [ ] Documentação atualizada

## 🎯 Resultado Final

Com esta configuração, você terá:
- ✅ Sincronização diária automática
- ✅ Sincronização manual sob demanda
- ✅ Respeito aos limites do plano gratuito
- ✅ Opção de webhook externo para maior frequência
- ✅ Monitoramento completo
- ✅ Documentação detalhada

A solução está otimizada para o plano gratuito da Vercel! 🎉
