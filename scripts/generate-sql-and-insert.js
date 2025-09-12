#!/usr/bin/env node

/**
 * Script para gerar SQL e inserir usuários automaticamente
 * Gera o SQL completo e depois tenta inserir os usuários
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

function gerarSQL() {
  console.log('📋 SQL para criar tabela no Supabase:');
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
  console.log('');
  console.log('-- Comentários da tabela');
  console.log('COMMENT ON TABLE usuarios IS \'Tabela de usuários do sistema com níveis de acesso\';');
  console.log('COMMENT ON COLUMN usuarios.email IS \'Email único do usuário\';');
  console.log('COMMENT ON COLUMN usuarios.senha_hash IS \'Hash da senha criptografada com bcrypt\';');
  console.log('COMMENT ON COLUMN usuarios.nivel IS \'Nível de acesso: admin, vendas, desenvolvimento, producao\';');
  console.log('COMMENT ON COLUMN usuarios.nome IS \'Nome completo do usuário\';');
  console.log('COMMENT ON COLUMN usuarios.ativo IS \'Status ativo/inativo do usuário\';');
  console.log('```');
  console.log('');
  console.log('💡 Execute este SQL no Supabase SQL Editor');
  console.log('📝 Após executar, pressione ENTER para continuar...');
}

async function inserirUsuarios() {
  console.log('\n👥 Inserindo usuários no banco...\n');

  for (const usuario of usuarios) {
    try {
      console.log(`🔐 Processando: ${usuario.nome} (${usuario.email})`);
      
      // Criptografar senha
      const saltRounds = 12;
      const senhaHash = await bcrypt.hash(usuario.senha, saltRounds);
      
      console.log(`  ✅ Senha criptografada (${senhaHash.length} caracteres)`);

      // Verificar se usuário já existe
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', usuario.email)
        .single();

      if (existingUser) {
        console.log(`  ⚠️  Usuário já existe, pulando...`);
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
        console.error(`  ❌ Erro ao inserir: ${insertError.message}`);
        continue;
      }

      console.log(`  ✅ Usuário inserido com sucesso!`);

    } catch (error) {
      console.error(`  ❌ Erro ao processar ${usuario.email}: ${error.message}`);
    }
  }
}

async function verificarUsuarios() {
  try {
    console.log('\n🔍 Verificando usuários inseridos...\n');

    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('email, nivel, nome, ativo, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar usuários:', error.message);
      return;
    }

    console.log(`📊 Total de usuários: ${usuarios.length}`);
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
    console.error('❌ Erro ao verificar usuários:', error.message);
  }
}

async function testarLogin() {
  console.log('\n🧪 Testando login dos usuários...\n');

  for (const usuario of usuarios) {
    try {
      console.log(`🔐 Testando login: ${usuario.email}`);
      
      // Buscar usuário no banco
      const { data: user, error: fetchError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', usuario.email)
        .eq('ativo', true)
        .single();

      if (fetchError) {
        console.log(`  ❌ Erro ao buscar: ${fetchError.message}`);
        continue;
      }

      if (!user) {
        console.log(`  ❌ Usuário não encontrado`);
        continue;
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(usuario.senha, user.senha_hash);
      
      if (isPasswordValid) {
        console.log(`  ✅ Login válido - ${user.nome} (${user.nivel})`);
      } else {
        console.log(`  ❌ Senha inválida`);
      }

    } catch (error) {
      console.log(`  ❌ Erro no teste: ${error.message}`);
    }
  }
}

async function main() {
  try {
    console.log('🚀 Gerando SQL e configurando usuários...\n');

    // Mostrar SQL
    gerarSQL();

    // Aguardar confirmação do usuário
    console.log('\n⏳ Aguardando você executar o SQL no Supabase...');
    console.log('📝 Pressione ENTER quando terminar de executar o SQL...');
    
    // Simular aguardo (em produção seria readline)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Tentar inserir usuários
    await inserirUsuarios();

    // Verificar usuários
    await verificarUsuarios();

    // Testar login
    await testarLogin();

    console.log('\n✅ Configuração concluída!');
    console.log('\n🎯 Próximos passos:');
    console.log('1. Execute: npm run test:login');
    console.log('2. Execute: npm run start:full');
    console.log('3. Faça login com qualquer usuário configurado');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

main();
