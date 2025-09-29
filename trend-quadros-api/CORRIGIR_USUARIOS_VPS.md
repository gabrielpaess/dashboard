# 🔧 Corrigir Usuários no Banco de Dados

## 📋 Problema
Os usuários padrão foram criados com senhas incorretas. Este guia mostra como corrigir isso.

## 🎯 Usuários Corretos
- **Admin**: williaamtelles@gmail.com / Pontoink2025!
- **Vendas**: vendas@pontoquadros.com / Vendas2025!
- **Desenvolvimento**: desenvolvimento@pontoquadros.com / Desenvolvimento2025!
- **Produção**: producao@pontoquadros.com / Producao2025!

## 🚀 Como Executar na VPS

### Opção 1: Via psql (Recomendado)
```bash
# Conectar ao banco
psql -d meus_pedidos -U api_user -h localhost

# Executar o script SQL
\i scripts/fix-users-database.sql

# Verificar usuários
SELECT id, nome, email, nivel, ativo FROM usuarios ORDER BY created_at;

# Sair
\q
```

### Opção 2: Via arquivo SQL
```bash
# Executar diretamente o arquivo
psql -d meus_pedidos -U api_user -h localhost -f scripts/fix-users-database.sql
```

### Opção 3: Via Node.js (se preferir)
```bash
# Executar o script Node.js
node scripts/create-users-correct-db.js
```

## ✅ Verificação
Após executar, você deve ver:
```
 id |      nome      |                email                |     nivel      | ativo |         created_at         
----+----------------+-------------------------------------+----------------+-------+----------------------------
  1 | Admin          | williaamtelles@gmail.com           | admin          | t     | 2024-01-XX XX:XX:XX.XXX+00
  2 | Vendas         | vendas@pontoquadros.com            | vendas         | t     | 2024-01-XX XX:XX:XX.XXX+00
  3 | Desenvolvimento| desenvolvimento@pontoquadros.com   | desenvolvimento| t     | 2024-01-XX XX:XX:XX.XXX+00
  4 | Produção       | producao@pontoquadros.com          | producao       | t     | 2024-01-XX XX:XX:XX.XXX+00
```

## 🧪 Testar no Insomnia
Use as credenciais acima para testar o login:
- **URL**: `http://168.231.90.41:3001/api/auth/login`
- **Method**: POST
- **Body**: 
  ```json
  {
    "email": "williaamtelles@gmail.com",
    "password": "Pontoink2025!"
  }
  ```

## 🔄 Reiniciar API
Após corrigir os usuários, reinicie a API:
```bash
pm2 restart trend-quadros-api
```

## 📝 Notas
- ✅ Usuários incorretos foram removidos do projeto
- ✅ Migration com usuários incorretos foi deletada
- ✅ Apenas usuários corretos serão criados
- ✅ Senhas estão corretamente hasheadas com bcrypt
