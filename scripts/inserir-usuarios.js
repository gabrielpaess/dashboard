#!/usr/bin/env node

/**
 * Script simples para inserir usuários após criar a tabela
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { config } from '../src/config/environment.js';

const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

// Dados dos usuários
const usuarios = [
  {
    email: 'williaamtelles@gmail.com',
    senha: 'Pontoink2025!',
    nivel: 'admin',
    nome: 'William Telles',
    ativo: true
  },
  {
    email: 'vendas@pontoquadros.com',
    senha: 'Vendas2025!',
    nivel: 'vendas',
    nome: 'Usuário Vendas',
    ativo: true
  },
  {
    email: 'desenvolvimento@pontoquadros.com',
    senha: 'Desenvolvimento2025!',
    nivel: 'desenvolvimento',
    nome: 'Usuário Desenvolvimento',
    ativo: true
  },
  {
    email: 'producao@pontoquadros.com',
    senha: 'Producao2025!',
    nivel: 'producao',
    nome: 'Usuário Produção',
    ativo: true
  }
];

async function inserirUsuarios() {
  console.log('👥 Inserindo usuários...\n');

  for (const usuario of usuarios) {
    try {
      console.log(`🔐 Processando: ${usuario.nome}`);
      
      // Criptografar senha
      const senhaHash = await bcrypt.hash(usuario.senha, 12);
      
      // Inserir usuário
      const { error } = await supabase
        .from('usuarios')
        .insert({
          email: usuario.email,
          senha_hash: senhaHash,
          nivel: usuario.nivel,
          nome: usuario.nome,
          ativo: usuario.ativo
        });

      if (error) {
        console.log(`❌ Erro: ${error.message}`);
      } else {
        console.log(`✅ ${usuario.nome} inserido!`);
      }

    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
  }
}

async function verificarUsuarios() {
  console.log('\n🔍 Verificando usuários...\n');

  const { data: usuarios, error } = await supabase
    .from('usuarios')
    .select('email, nivel, nome, ativo');

  if (error) {
    console.log(`❌ Erro: ${error.message}`);
    return;
  }

  console.log(`📊 Total: ${usuarios.length} usuários`);
  usuarios.forEach((u, i) => {
    console.log(`${i + 1}. ${u.nome} (${u.email}) - ${u.nivel}`);
  });
}

async function main() {
  console.log('🚀 Inserindo usuários no Supabase...\n');
  
  await inserirUsuarios();
  await verificarUsuarios();
  
  console.log('\n✅ Pronto! Agora execute: npm run start:full');
}

main();
