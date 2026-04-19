# Renovar certificado SSL – API com PM2 e Nginx

Guia para usar **Let's Encrypt** (certificado gratuito e confiável) no **Nginx**, para que `https://v1.pontodeshboard.com` funcione sem precisar desabilitar validação no cliente.

**Recomendação:** SSL fica só no Nginx. A API (PM2) escuta em HTTP na porta 3001; o Nginx recebe HTTPS na 443 e repassa para a API.

---

## Pré-requisitos

- Servidor com **Nginx** e **PM2** (ex.: VPS Linux).
- Domínio **v1.pontodeshboard.com** apontando para o IP do servidor (DNS A).
- Portas **80** e **443** liberadas no firewall.

---

## Parte 1: Instalar o Certbot (Let's Encrypt)

No servidor (SSH), como usuário com sudo:

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

### CentOS / RHEL / Rocky

```bash
sudo dnf install -y certbot python3-certbot-nginx
# ou: sudo yum install -y certbot python3-certbot-nginx
```

Verificar instalação:

```bash
certbot --version
```

---

## Parte 2: Obter o certificado (primeira vez)

1. **Parar o Nginx** temporariamente (o Certbot pode usar a porta 80):

   ```bash
   sudo systemctl stop nginx
   ```

2. **Emitir o certificado** para o domínio da API:

   ```bash
   sudo certbot certonly --standalone -d v1.pontodeshboard.com
   ```

   - Digite o e-mail para avisos de renovação.
   - Aceite os termos (A).
   - Os arquivos serão criados em:
     - Certificado: `/etc/letsencrypt/live/v1.pontodeshboard.com/fullchain.pem`
     - Chave privada: `/etc/letsencrypt/live/v1.pontodeshboard.com/privkey.pem`

3. **Subir o Nginx de novo:**

   ```bash
   sudo systemctl start nginx
   ```

Se preferir **não** parar o Nginx (e o Nginx já estiver configurado para o domínio), use:

```bash
sudo certbot certonly --nginx -d v1.pontodeshboard.com
```

---

## Parte 3: Configurar o Nginx para HTTPS

1. Abrir o arquivo de configuração do site (ex.: `v1.pontodeshboard.com` ou `default`):

   ```bash
   sudo nano /etc/nginx/sites-available/v1.pontodeshboard.com
   ```

   (Em algumas instalações o path é `/etc/nginx/conf.d/v1.pontodeshboard.com.conf`.)

2. **Configuração recomendada** (SSL no Nginx, API em HTTP atrás):

   ```nginx
   # Redirecionar HTTP -> HTTPS
   server {
       listen 80;
       server_name v1.pontodeshboard.com;
       return 301 https://$server_name$request_uri;
   }

   # HTTPS
   server {
       listen 443 ssl http2;
       server_name v1.pontodeshboard.com;

       # Certificados Let's Encrypt
       ssl_certificate     /etc/letsencrypt/live/v1.pontodeshboard.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/v1.pontodeshboard.com/privkey.pem;

       # Boas práticas SSL (opcional)
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_prefer_server_ciphers on;
       ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

       # Proxy para a API (PM2 na porta 3001)
       location / {
           proxy_pass http://127.0.0.1:3001;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. Testar a configuração:

   ```bash
   sudo nginx -t
   ```

4. Recarregar o Nginx:

   ```bash
   sudo systemctl reload nginx
   ```

Com isso, **todo o HTTPS é tratado pelo Nginx**. A API pode rodar só em HTTP na 3001 (sem certificado dentro do Node).

---

## Parte 4: API rodando só em HTTP (recomendado)

Com Nginx fazendo SSL, a API não precisa de certificado. Garanta que o PM2 está subindo a API **sem** arquivos SSL, para evitar conflito:

- **Opção A:** Não ter os arquivos em `/etc/ssl/trend-quadros/` (o `main.ts` sobe em HTTP).
- **Opção B:** No `.env` da API em produção, não definir `SSL_CERT_PATH` / `SSL_KEY_PATH`, ou apontar para caminhos que não existam, para o Nest subir em HTTP.

Assim, apenas o Nginx usa o certificado; o Insomnia e os navegadores validam o certificado do Nginx e tudo fica correto.

---

## Parte 5: Renovar o certificado (manual)

Let's Encrypt expira em ~90 dias. Para renovar:

```bash
# Renovar todos os certificados que estiverem perto de vencer
sudo certbot renew

# Recarregar Nginx para usar os novos arquivos
sudo systemctl reload nginx
```

Não é necessário reiniciar o PM2: o Nginx que serve HTTPS; a API continua em HTTP atrás dele.

---

### Erro: "Could not bind TCP port 80 because it is already in use"

Isso acontece quando o certificado foi obtido com `--standalone` e o Nginx já está usando a porta 80. O Certbot tenta ocupar a 80 e não consegue.

**Solução imediata (renovar agora):** parar o Nginx, renovar e subir de novo (breve indisponibilidade):

```bash
sudo systemctl stop nginx
sudo certbot renew
sudo systemctl start nginx
```

**Solução definitiva (próximas renovações sem parar o Nginx):** fazer o Certbot usar o plugin do Nginx em vez do standalone. Edite o arquivo de renovação:

```bash
sudo nano /etc/letsencrypt/renewal/v1.pontodeshboard.com.conf
```

Altere apenas as linhas do authenticator e installer para:

```ini
authenticator = nginx
installer = nginx
```

(Mantenha o restante do arquivo, incluindo `account`.) Salve e saia. Da próxima vez, `certbot renew` usará o Nginx e não precisará da porta 80 sozinha.

Se preferir não editar o arquivo, use sempre a renovação parando o Nginx (comandos acima) ou force a renovação com o plugin nginx:

```bash
sudo certbot renew --nginx
```

(Se `--nginx` não for aceito no seu Certbot, use o método de parar/iniciar o Nginx.)

---

## Parte 6: Renovação automática (cron)

1. Testar o comando de renovação (dry-run):

   ```bash
   sudo certbot renew --dry-run
   ```

2. Abrir o crontab do root:

   ```bash
   sudo crontab -e
   ```

3. Adicionar uma linha para renovar todo dia às 3h e recarregar o Nginx:

   ```cron
   0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
   ```

   Salvar e sair. O Certbot só renova quando o certificado estiver perto de vencer; o `reload nginx` aplica o novo certificado.

---

## Parte 7: Se a API também usasse HTTPS (não recomendado com Nginx)

Caso um dia você queira que o Node também use os mesmos certificados (geralmente desnecessário com Nginx na frente):

1. Criar link ou copiar para o path que a API espera, por exemplo:

   ```bash
   sudo mkdir -p /etc/ssl/trend-quadros
   sudo cp /etc/letsencrypt/live/v1.pontodeshboard.com/fullchain.pem /etc/ssl/trend-quadros/
   sudo cp /etc/letsencrypt/live/v1.pontodeshboard.com/privkey.pem /etc/ssl/trend-quadros/
   sudo chown -R $USER:$USER /etc/ssl/trend-quadros   # ou o usuário do PM2
   ```

2. No `.env` da API:

   ```env
   SSL_CERT_PATH=/etc/ssl/trend-quadros/fullchain.pem
   SSL_KEY_PATH=/etc/ssl/trend-quadros/privkey.pem
   ```

3. Após **cada** `certbot renew`, copiar de novo e reiniciar o PM2:

   ```bash
   sudo certbot renew --post-hook "cp /etc/letsencrypt/live/v1.pontodeshboard.com/*.pem /etc/ssl/trend-quadros/ && pm2 restart all"
   ```

O cenário recomendado continua sendo: **SSL só no Nginx**, API em HTTP atrás do proxy.

---

## Checklist rápido

| Etapa | Comando / Ação |
|-------|----------------|
| 1. Instalar Certbot | `sudo apt install -y certbot python3-certbot-nginx` |
| 2. Obter certificado | `sudo certbot certonly --nginx -d v1.pontodeshboard.com` |
| 3. Configurar Nginx | Editar site, `ssl_certificate` e `ssl_certificate_key` apontando para `/etc/letsencrypt/live/v1.pontodeshboard.com/` |
| 4. Testar Nginx | `sudo nginx -t` |
| 5. Recarregar Nginx | `sudo systemctl reload nginx` |
| 6. Renovação manual | `sudo certbot renew` + `sudo systemctl reload nginx` |
| 7. Renovação automática | `sudo crontab -e` → `0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"` |

Depois disso, acessar **https://v1.pontodeshboard.com/health** no Insomnia **com** validação de certificado ativada deve funcionar sem erro.
