# Conectar ao banco PostgreSQL da VPS pelo DBeaver

Guia para descobrir os dados de conexão do banco na VPS e conectar pelo DBeaver (ou outro cliente) no seu PC.

---

## Parte 1: Descobrir os dados de conexão na VPS

A API usa **PostgreSQL** com estas variáveis de ambiente:

| Variável     | Significado   | Exemplo        |
|-------------|---------------|----------------|
| `DB_HOST`   | Host do banco | `localhost` ou IP |
| `DB_PORT`   | Porta         | `5432`         |
| `DB_NAME`   | Nome do banco | `dashboard`    |
| `DB_USER`   | Usuário       | `postgres`     |
| `DB_PASSWORD` | Senha       | (a que está no .env) |

### 1.1 Conectar na VPS por SSH

```bash
ssh root@IP_DA_SUA_VPS
# ou: ssh seu_usuario@IP_DA_SUA_VPS
```

### 1.2 Onde a API está rodando (PM2 / pasta do projeto)

Se a API está em `/root/dashboard/trend-quadros-api` (ou parecido):

```bash
cd /root/dashboard/trend-quadros-api
# ou: cd ~/dashboard/trend-quadros-api
cat .env | grep DB_
```

Você deve ver algo como:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dashboard
DB_USER=postgres
DB_PASSWORD=xxxxxxxx
```

- **Host:** Se for `localhost`, o PostgreSQL está **na própria VPS**. Para conectar do seu PC você vai precisar liberar acesso remoto ou usar túnel SSH (recomendado).
- **Porta:** quase sempre `5432`.
- **Database / User / Password:** use exatamente esses valores no DBeaver.

Se o `.env` não existir na pasta do projeto, procure em outro lugar (ex.: `~/dashboard/.env`, ou variáveis que o PM2 carrega). Você também pode ver no painel da hospedagem (ex.: variáveis de ambiente do serviço).

---

## Parte 2: Duas formas de conectar do seu PC

### Opção A: Túnel SSH (recomendado – mais seguro)

Você **não** abre a porta 5432 na internet. O DBeaver conecta em um canal SSH até a VPS e a VPS redireciona para o PostgreSQL em `localhost:5432`.

**Vantagem:** não precisa mudar firewall nem configuração do PostgreSQL; o banco continua aceitando só conexões locais.

**No DBeaver:**

1. **Nova conexão** → PostgreSQL.
2. Aba **Principal:**
   - **Host:** `localhost` (porque o túnel termina no seu PC em uma porta local).
   - **Porta:** ex. `5432` (pode ser outra, ex. `5433`, se 5432 já estiver em uso no seu PC).
   - **Database:** valor de `DB_NAME` (ex. `dashboard`).
   - **Username:** valor de `DB_USER` (ex. `postgres`).
   - **Password:** valor de `DB_PASSWORD`.
3. Aba **SSH:**
   - Marque **"Use SSH Tunnel"**.
   - **Host/IP:** IP público da VPS.
   - **Port:** `22`.
   - **User name:** usuário SSH (ex. `root`).
   - **Authentication Method:** Password (ou chave privada, se você usar).
   - **Password:** senha SSH da VPS (ou deixe em branco se usar chave).
4. **Test Connection** → **Finish**.

Assim, o DBeaver abre um túnel SSH até a VPS e, por dentro da VPS, conecta em `127.0.0.1:5432` no PostgreSQL. Não é preciso liberar 5432 no firewall nem alterar o PostgreSQL.

---

### Opção B: Conexão direta (porta 5432 aberta na VPS)

Aqui o PostgreSQL na VPS precisa **aceitar conexões de fora** e o firewall deve permitir a porta 5432.

#### Passo B.1: PostgreSQL aceitar conexões remotas

No servidor (SSH):

1. Descobrir onde está o `postgresql.conf` (geralmente em `/etc/postgresql/14/main/` ou `/etc/postgresql/15/main/` – o número é a versão):

   ```bash
   sudo -u postgres psql -c "SHOW config_file;"
   ```

   O resultado é o caminho do `postgresql.conf`. A pasta `main` fica no mesmo diretório.

2. Editar o `postgresql.conf`:

   ```bash
   sudo nano /etc/postgresql/14/main/postgresql.conf
   ```

   Encontrar a linha:

   ```ini
   #listen_addresses = 'localhost'
   ```

   Alterar para (ou descomentar e deixar assim):

   ```ini
   listen_addresses = '*'
   ```

   Salvar e sair (Ctrl+O, Enter, Ctrl+X).

3. Editar o `pg_hba.conf` (na mesma pasta do `postgresql.conf`):

   ```bash
   sudo nano /etc/postgresql/14/main/pg_hba.conf
   ```

   No **final do arquivo**, adicionar uma linha que permita seu IP (substitua `SEU_IP` pelo IP do seu PC ou da sua rede):

   ```ini
   host    all    all    SEU_IP/32    scram-sha-256
   ```

   Exemplo para IP 203.0.113.50:

   ```ini
   host    all    all    203.0.113.50/32    scram-sha-256
   ```

   Se o PostgreSQL for antigo e não tiver `scram-sha-256`, use `md5`:

   ```ini
   host    all    all    203.0.113.50/32    md5
   ```

   Para liberar **qualquer IP** (menos seguro, use só em rede confiável ou teste):

   ```ini
   host    all    all    0.0.0.0/0    scram-sha-256
   ```

4. Reiniciar o PostgreSQL:

   ```bash
   sudo systemctl restart postgresql
   ```

#### Passo B.2: Firewall – liberar porta 5432

Se a VPS usa **ufw**:

```bash
sudo ufw allow 5432/tcp
sudo ufw reload
sudo ufw status
```

Se usar **iptables** ou firewall do painel da hospedagem, libere a porta **5432 TCP** para o seu IP (ou para 0.0.0.0/0 só em teste).

#### Passo B.3: DBeaver – conexão direta

1. **Nova conexão** → PostgreSQL.
2. **Host:** IP público da VPS (ex. `168.231.90.41` ou o domínio que aponte para a VPS).
3. **Porta:** `5432`.
4. **Database:** valor de `DB_NAME` (ex. `dashboard`).
5. **Username:** valor de `DB_USER` (ex. `postgres`).
6. **Password:** valor de `DB_PASSWORD`.
7. Se a API em produção usa SSL para o banco, na aba **SSL** marque "Use SSL" e ajuste conforme o servidor (muitas VPS usam SSL com `rejectUnauthorized: false`; no DBeaver pode ser "allow" ou "prefer").
8. **Test Connection** → **Finish**.

---

## Parte 3: Resumo rápido

| O que você precisa | Onde pegar |
|-------------------|------------|
| Host              | Na VPS: `cat /root/dashboard/trend-quadros-api/.env \| grep DB_HOST` (para conexão direta use o **IP da VPS**) |
| Porta             | `DB_PORT` (geralmente `5432`) |
| Database          | `DB_NAME` (ex. `dashboard`) |
| Usuário           | `DB_USER` (ex. `postgres`) |
| Senha             | `DB_PASSWORD` do `.env` |

- **Recomendado:** usar **túnel SSH** no DBeaver (Opção A) e deixar o PostgreSQL só em `localhost` na VPS.
- **Alternativa:** liberar 5432 e configurar `listen_addresses` e `pg_hba.conf` (Opção B); use preferencialmente com restrição por IP no `pg_hba.conf`.

Depois de configurar, você consegue consultar e administrar o banco da VPS pelo DBeaver normalmente.
