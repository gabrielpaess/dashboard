#!/usr/bin/env node

/**
 * Script para configurar HTTPS na API
 * Usa certificados Let's Encrypt com Certbot
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔐 Configurando HTTPS para a API...');

// Verificar se está rodando como root
if (process.getuid && process.getuid() !== 0) {
  console.error('❌ Este script precisa ser executado como root (sudo)');
  process.exit(1);
}

const domain = 'api.pontodeshboard.com'; // Substitua pelo seu domínio
const email = 'admin@pontodeshboard.com'; // Substitua pelo seu email

console.log(`📧 Domínio: ${domain}`);
console.log(`📧 Email: ${email}`);

try {
  // 1. Instalar Certbot se não estiver instalado
  console.log('📦 Instalando Certbot...');
  execSync('apt-get update', { stdio: 'inherit' });
  execSync('apt-get install -y certbot', { stdio: 'inherit' });

  // 2. Parar a API temporariamente
  console.log('⏸️ Parando a API...');
  try {
    execSync('pm2 stop trend-quadros-api', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ PM2 não encontrado ou API não está rodando');
  }

  // 3. Obter certificado SSL
  console.log('🔐 Obtendo certificado SSL...');
  execSync(`certbot certonly --standalone -d ${domain} --email ${email} --agree-tos --non-interactive`, {
    stdio: 'inherit'
  });

  // 4. Criar diretório para certificados
  const certDir = '/etc/ssl/trend-quadros';
  execSync(`mkdir -p ${certDir}`, { stdio: 'inherit' });

  // 5. Copiar certificados
  console.log('📋 Copiando certificados...');
  execSync(`cp /etc/letsencrypt/live/${domain}/fullchain.pem ${certDir}/`, { stdio: 'inherit' });
  execSync(`cp /etc/letsencrypt/live/${domain}/privkey.pem ${certDir}/`, { stdio: 'inherit' });

  // 6. Ajustar permissões
  execSync(`chown -R $USER:$USER ${certDir}`, { stdio: 'inherit' });
  execSync(`chmod 600 ${certDir}/privkey.pem`, { stdio: 'inherit' });
  execSync(`chmod 644 ${certDir}/fullchain.pem`, { stdio: 'inherit' });

  // 7. Configurar renovação automática
  console.log('🔄 Configurando renovação automática...');
  const cronJob = `0 12 * * * /usr/bin/certbot renew --quiet && pm2 restart trend-quadros-api`;
  
  // Adicionar ao crontab
  try {
    const currentCrontab = execSync('crontab -l', { encoding: 'utf8' });
    if (!currentCrontab.includes('certbot renew')) {
      execSync(`(crontab -l 2>/dev/null; echo "${cronJob}") | crontab -`, { stdio: 'inherit' });
    }
  } catch (error) {
    execSync(`echo "${cronJob}" | crontab -`, { stdio: 'inherit' });
  }

  console.log('✅ HTTPS configurado com sucesso!');
  console.log(`🔐 Certificados salvos em: ${certDir}`);
  console.log('📝 Próximos passos:');
  console.log('1. Atualize o main.ts para usar HTTPS');
  console.log('2. Reinicie a API com PM2');
  console.log('3. Atualize as URLs no frontend');

} catch (error) {
  console.error('❌ Erro ao configurar HTTPS:', error.message);
  process.exit(1);
}
