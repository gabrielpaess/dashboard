#!/usr/bin/env node

/**
 * Script para criar tabela e usuários no Supabase
 * Primeiro mostra o SQL, depois tenta inserir os usuários
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

function mostrarSQL() {
  console.log('📋 Execute o seguinte SQL no Supabase SQL Editor:');
  console.log('');
  console.log('```sql');
  console.log('-- Criar tabela de usuários');
  console.log('CREATE TABLE usuarios (');
  console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
  console.log('  email VARCHAR(255) UNIQUE NOT NULL,');
  console.log('  senha_hash VARCHAR(255) NOT NULL,');
  console.log('  nivel VARCHAR(50) NOT NULL CHECK (nivel IN (\'admin\', \'vendas\', \'desenvolvimento\', \'producao\')),');
  console.log('  nome VARCHAR(255) NOT NULL,');
  console.log('  ativo BOOLEAN DEFAULT true,');
  console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
  console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
  console.log(');');
  console.log('');
  console.log('-- Criar índices para performance');
  console.log('CREATE INDEX idx_usuarios_email ON usuarios(email);');
  console.log('CREATE INDEX idx_usuarios_nivel ON usuarios(nivel);');
  console.log('CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);');
  console.log('```');
  console.log('');
  console.log('💡 Após executar o SQL, execute novamente: npm run setup:users');
}

async function inserirUsuarios() {
  try {
    console.log('👥 Tentando inserir usuários...');

    for (const usuario of usuarios) {
      // Criptografar senha
      const saltRounds = 12;
      const senhaHash = await bcrypt.hash(usuario.senha, saltRounds);

      // Verificar se usuário já existe
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', usuario.email)
        .single();

      if (existingUser) {
        console.log(`⚠️  Usuário ${usuario.email} já existe, pulando...`);
        continue;
      }

      // Inserir usuário
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
        if (insertError.code === 'PGRST116') {
          console.log('\n❌ Tabela "usuarios" não existe!');
          mostrarSQL();
          return false;
        }
        
        console.error(`❌ Erro ao inserir usuário ${usuario.email}:`, insertError);
        continue;
      }

      console.log(`✅ Usuário ${usuario.email} (${usuario.nivel}) criado com sucesso!`);
    }

    return true;

  } catch (error) {
    console.error('❌ Erro ao inserir usuários:', error);
    return false;
  }
}

async function verificarUsuarios() {
  try {
    console.log('\n🔍 Verificando usuários criados...');

    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('email, nivel, nome, ativo, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }

    console.log(`\n📊 Total de usuários: ${usuarios.length}`);
    console.log('\n👥 Lista de usuários:');
    
    usuarios.forEach((usuario, index) => {
      console.log(`  ${index + 1}. ${usuario.nome}`);
      console.log(`     Email: ${usuario.email}`);
      console.log(`     Nível: ${usuario.nivel}`);
      console.log(`     Ativo: ${usuario.ativo ? 'Sim' : 'Não'}`);
      console.log(`     Criado: ${new Date(usuario.created_at).toLocaleString('pt-BR')}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Configurando sistema de usuários...\n');

    // Verificar conexão com Supabase
    console.log('🔌 Verificando conexão com Supabase...');
    const { data, error } = await supabase.from('usuarios').select('count').limit(1);
    
    if (error && (error.code === 'PGRST116' || error.code === 'PGRST205')) {
      console.log('❌ Tabela "usuarios" não existe!');
      mostrarSQL();
      return;
    }

    if (error) {
      console.error('❌ Erro de conexão com Supabase:', error);
      return;
    }

    console.log('✅ Conexão com Supabase estabelecida!');

    // Inserir usuários
    const usuariosInseridos = await inserirUsuarios();
    if (!usuariosInseridos) {
      return;
    }

    // Verificar usuários
    await verificarUsuarios();

    console.log('\n✅ Sistema de usuários configurado com sucesso!');
    console.log('\n🔐 Níveis de acesso configurados:');
    console.log('  👑 Admin: Acesso completo a todas as abas');
    console.log('  💰 Vendas: Acesso apenas à aba Vendas');
    console.log('  🔧 Desenvolvimento: Acesso apenas à aba Desenvolvimento');
    console.log('  📦 Produção: Acesso apenas à aba Produção');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

main();
