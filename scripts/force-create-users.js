#!/usr/bin/env node

/**
 * Script para forçar criação de usuários
 * Tenta inserir diretamente, se der erro, mostra instruções
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
  console.log('👥 Tentando inserir usuários diretamente...\n');

  for (const usuario of usuarios) {
    try {
      // Criptografar senha
      const saltRounds = 12;
      const senhaHash = await bcrypt.hash(usuario.senha, saltRounds);

      console.log(`🔐 Criptografando senha para ${usuario.email}...`);

      // Tentar inserir usuário
      const { error: insertError } = await supabase
        .from('usuarios')
        .insert({
          email: usuario.email,
          senha_hash: senhaHash,
          nivel: usuario.nivel,
          nome: usuario.nome,
          ativo: usuario.ativo
        });

      if (insertError) {
        if (insertError.code === 'PGRST116' || insertError.code === 'PGRST205') {
          console.log(`❌ Tabela "usuarios" não existe para ${usuario.email}`);
          console.log('📋 Execute o SQL em SQL-CRIAR-TABELA-USUARIOS.sql no Supabase');
          continue;
        }
        
        console.error(`❌ Erro ao inserir ${usuario.email}:`, insertError.message);
        continue;
      }

      console.log(`✅ Usuário ${usuario.email} (${usuario.nivel}) criado com sucesso!`);

    } catch (error) {
      console.error(`❌ Erro ao processar ${usuario.email}:`, error.message);
    }
  }
}

async function verificarUsuarios() {
  try {
    console.log('\n🔍 Verificando usuários existentes...');

    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('email, nivel, nome, ativo, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST205') {
        console.log('❌ Tabela "usuarios" não existe!');
        console.log('📋 Execute o SQL em SQL-CRIAR-TABELA-USUARIOS.sql no Supabase');
        return;
      }
      console.error('❌ Erro ao buscar usuários:', error.message);
      return;
    }

    console.log(`\n📊 Total de usuários: ${usuarios.length}`);
    
    if (usuarios.length > 0) {
      console.log('\n👥 Usuários encontrados:');
      usuarios.forEach((usuario, index) => {
        console.log(`  ${index + 1}. ${usuario.nome}`);
        console.log(`     Email: ${usuario.email}`);
        console.log(`     Nível: ${usuario.nivel}`);
        console.log(`     Ativo: ${usuario.ativo ? 'Sim' : 'Não'}`);
        console.log(`     Criado: ${new Date(usuario.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('📭 Nenhum usuário encontrado');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Forçando criação de usuários...\n');

    // Tentar inserir usuários
    await inserirUsuarios();

    // Verificar usuários
    await verificarUsuarios();

    console.log('\n📋 Próximos passos:');
    console.log('1. Execute o SQL em SQL-CRIAR-TABELA-USUARIOS.sql no Supabase');
    console.log('2. Execute: npm run setup:users');
    console.log('3. Execute: npm run test:login');
    console.log('4. Execute: npm run start:full');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

main();
