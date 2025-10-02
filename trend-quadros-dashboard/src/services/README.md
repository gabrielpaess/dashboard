# Nova Arquitetura de Serviços - Dashboard Ponto Quadros

## 📋 Visão Geral

Esta é a nova arquitetura de serviços implementada seguindo as melhores práticas identificadas na análise. A arquitetura foi completamente refatorada para:

- ✅ Eliminar duplicação de código
- ✅ Padronizar tratamento de erros
- ✅ Implementar cache inteligente
- ✅ Adicionar rate limiting
- ✅ Facilitar manutenção e extensão
- ✅ Preparar para integração com Instagram

## 🏗️ Estrutura da Arquitetura

```
src/services/
├── api/
│   ├── base/                    # Clientes base
│   │   ├── ApiClient.js         # Cliente base com funcionalidades comuns
│   │   ├── ApiError.js          # Tratamento padronizado de erros
│   │   ├── ApiCache.js          # Sistema de cache inteligente
│   │   └── RateLimiter.js       # Controle de rate limiting
│   ├── tiny/                    # API Tiny
│   │   ├── TinyApiClient.js     # Cliente específico Tiny
│   │   └── TinyOrderService.js  # Serviço de pedidos Tiny
│   ├── nestjs/                  # NestJS API
│   │   ├── NestjsApiClient.js   # Cliente NestJS
│   │   └── NestjsOrderService.js # Serviço de pedidos NestJS
│   └── instagram/               # Instagram (preparado)
│       ├── InstagramApiClient.js
│       └── InstagramConversationService.js
├── data/
│   └── OrderRepository.js       # Repositório centralizado de pedidos
├── sync/
│   └── SyncService.js           # Serviço de sincronização
├── utils/
│   ├── DateFormatter.js         # Formatação de datas centralizada
│   ├── DataValidator.js         # Validação de dados
│   └── ResponseMapper.js        # Mapeamento de respostas
├── config/
│   └── ApiConfig.js             # Configuração centralizada
├── migration/
│   └── LegacyServiceAdapter.js  # Adaptador para serviços antigos
└── index.js                     # Ponto de entrada principal
```

## 🚀 Como Usar

### Importação Simples

```javascript
import { orderRepository, syncService, validateAllConnections } from '@/services';
```

### Uso Básico

```javascript
// Buscar pedidos
const response = await orderRepository.getNestjsOrders({
  dataInicial: '2024-01-01',
  dataFinal: '2024-01-31'
});

// Sincronizar dados
const syncResult = await syncService.executeFullSync();

// Validar conexões
const connections = await validateAllConnections();
```

### Configuração Customizada

```javascript
import { createServices } from '@/services';

const customServices = createServices({
  tiny: { timeout: 20000 },
  nestjs: { cache: { ttl: 600000 } }
});
```

## 🔧 Funcionalidades Principais

### 1. **Cliente Base (ApiClient)**
- Retry automático
- Rate limiting configurável
- Cache inteligente com TTL
- Tratamento de erro padronizado
- Logging estruturado

### 2. **Sistema de Cache**
- TTL configurável por API
- Limpeza automática de itens expirados
- Estatísticas de hit/miss
- Eviction por tamanho máximo

### 3. **Rate Limiting**
- Controle por janela de tempo
- Diferentes limites por API
- Delay automático entre requisições
- Estatísticas de uso

### 4. **Validação de Dados**
- Validação centralizada
- Mensagens de erro padronizadas
- Validação de tipos e formatos
- Validação de regras de negócio

### 5. **Mapeamento de Respostas**
- Padronização de respostas
- Tratamento de diferentes APIs
- Formatação consistente
- Metadados estruturados

## 📊 Benefícios da Nova Arquitetura

### **Performance**
- Cache inteligente reduz chamadas desnecessárias
- Rate limiting previne problemas com APIs externas
- Retry automático melhora confiabilidade
- Processamento paralelo quando possível

### **Manutenibilidade**
- Código organizado e modular
- Responsabilidades bem definidas
- Fácil adição de novas APIs
- Testes mais simples

### **Escalabilidade**
- Fácil adição de novas APIs
- Sistema de cache centralizado
- Rate limiting configurável
- Arquitetura extensível

### **Confiabilidade**
- Tratamento de erro consistente
- Retry automático
- Validação de dados
- Logging estruturado

## 🔄 Migração dos Serviços Antigos

### Adaptador Legado

Para facilitar a migração, foi criado um adaptador que mantém compatibilidade com os serviços antigos:

```javascript
import { legacyServiceAdapter } from '@/services/migration/LegacyServiceAdapter';

// Funciona como antes
const data = await legacyServiceAdapter.processOrderDataCentralized(dateFilter);
```

### Mapeamento de Serviços

| Serviço Antigo | Novo Serviço |
|----------------|--------------|
| `apiService` | `tinyOrderService` |
| `tinyApiService` | `tinyOrderService` |
| `pedidosService` | `nestjsOrderService` |
| `pedidosCentralizedService` | `nestjsOrderService` |
| `orderService` | `orderRepository` |
| `realtimeSyncService` | `syncService` |

## 🛠️ Configuração

### Variáveis de Ambiente

```env
# Tiny API
VITE_TINY_API_TOKEN=your_token_here

# NestJS API
VITE_API_URL=your_api_url
VITE_API_BASE_URL=your_api_base_url

# Instagram (opcional)
VITE_INSTAGRAM_ACCESS_TOKEN=your_access_token
VITE_INSTAGRAM_APP_ID=your_app_id
VITE_INSTAGRAM_APP_SECRET=your_app_secret
```

### Configuração Programática

```javascript
import { apiConfig } from '@/services';

// Validar configurações
const validation = apiConfig.validateConfig();

// Obter configuração específica
const tinyConfig = apiConfig.getTinyConfig();
```

## 📈 Monitoramento

### Estatísticas de Cache

```javascript
const stats = orderRepository.getRepositoryStats();
console.log('Cache hit rate:', stats.nestjs.cache.hitRate);
```

### Estatísticas de Rate Limiting

```javascript
const stats = orderRepository.getRepositoryStats();
console.log('Rate limit usage:', stats.tiny.rateLimit.getUsagePercentage());
```

### Estatísticas de Sincronização

```javascript
const stats = syncService.getSyncStats();
console.log('Success rate:', stats.successRate);
```

## 🧪 Testes

### Validação de Conexões

```javascript
import { validateAllConnections } from '@/services';

const connections = await validateAllConnections();
console.log('Tiny:', connections.tiny);
console.log('NestJS:', connections.nestjs);
console.log('Instagram:', connections.instagram);
```

### Teste de Sincronização

```javascript
const syncResult = await syncService.executeFullSync();
console.log('Sync result:', syncResult);
```

## 🔮 Próximos Passos

1. **Integração Instagram**: Implementar funcionalidades específicas do Instagram
2. **Dashboard de Monitoramento**: Criar interface para monitorar APIs
3. **Alertas**: Implementar sistema de alertas para falhas
4. **Métricas Avançadas**: Adicionar métricas de performance
5. **Testes Automatizados**: Implementar testes unitários e de integração

## 📚 Documentação Adicional

- [Análise de Práticas de API](./ANALISE_API_PRATICAS.md)
- [Configuração de APIs](./config/ApiConfig.js)
- [Exemplos de Uso](./examples/)

---

**Nota**: Esta arquitetura foi implementada seguindo as melhores práticas identificadas na análise e está preparada para futuras expansões e integrações.
