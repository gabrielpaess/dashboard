#!/usr/bin/env node

/**
 * Script para configurar usuários no Supabase
 * Primeiro tenta inserir, se der erro, mostra o SQL para criar a tabela
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
          console.log('\n📋 Execute o seguinte SQL no Supabase para criar a tabela:');
          console.log(`
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  nivel VARCHAR(50) NOT NULL CHECK (nivel IN ('admin', 'vendas', 'desenvolvimento', 'producao')),
  nome VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para email
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- Criar índice para nível
CREATE INDEX idx_usuarios_nivel ON usuarios(nivel);
          `);
          console.log('\n💡 Após criar a tabela, execute novamente este script.');
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
    
    if (error && error.code !== 'PGRST116') {
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
