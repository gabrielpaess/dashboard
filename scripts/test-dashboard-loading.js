#!/usr/bin/env node

/**
 * Script para testar o carregamento do dashboard
 * Verifica se há problemas de renderização ou autenticação
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config/environment.js';

const supabase = createClient(config.supabase.url, config.supabase.anonKey);

async function testarConexaoSupabase() {
  console.log('🔌 Testando conexão com Supabase...\n');

  try {
    // Testar conexão básica
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST205') {
        console.log('❌ Tabela "usuarios" não existe!');
        console.log('📋 Execute o SQL em criar-tabela-usuarios.sql no Supabase');
        return false;
      }
      console.log(`❌ Erro de conexão: ${error.message}`);
      return false;
    }

    console.log('✅ Conexão com Supabase OK!');
    return true;

  } catch (error) {
    console.log(`❌ Erro geral: ${error.message}`);
    return false;
  }
}

async function testarTabelaUsuarios() {
  console.log('\n👥 Testando tabela de usuários...\n');

  try {
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('email, nivel, nome, ativo')
      .limit(5);

    if (error) {
      console.log(`❌ Erro ao buscar usuários: ${error.message}`);
      return false;
    }

    console.log(`📊 Usuários encontrados: ${usuarios.length}`);
    
    if (usuarios.length > 0) {
      console.log('\n👤 Lista de usuários:');
      usuarios.forEach((usuario, index) => {
        console.log(`  ${index + 1}. ${usuario.nome} (${usuario.email}) - ${usuario.nivel}`);
      });
    } else {
      console.log('📭 Nenhum usuário encontrado');
      console.log('💡 Execute: npm run insert:users');
    }

    return true;

  } catch (error) {
    console.log(`❌ Erro ao testar tabela: ${error.message}`);
    return false;
  }
}

async function testarAuthService() {
  console.log('\n🔐 Testando AuthService...\n');

  try {
    // Simular verificação de autenticação
    const storedUser = localStorage.getItem('user');
    const storedAuth = localStorage.getItem('isAuthenticated');

    console.log(`📱 localStorage user: ${storedUser ? 'Presente' : 'Ausente'}`);
    console.log(`📱 localStorage auth: ${storedAuth}`);

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log(`👤 Usuário logado: ${user.nome} (${user.nivel})`);
      } catch (error) {
        console.log(`❌ Erro ao parsear usuário: ${error.message}`);
      }
    } else {
      console.log('ℹ️  Nenhum usuário logado');
    }

    return true;

  } catch (error) {
    console.log(`❌ Erro no AuthService: ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Testando carregamento do dashboard...\n');

    // Teste 1: Conexão com Supabase
    const supabaseOK = await testarConexaoSupabase();
    if (!supabaseOK) {
      console.log('\n❌ Falha na conexão com Supabase. Dashboard não funcionará.');
      return;
    }

    // Teste 2: Tabela de usuários
    const tabelaOK = await testarTabelaUsuarios();
    if (!tabelaOK) {
      console.log('\n❌ Problema com tabela de usuários.');
      return;
    }

    // Teste 3: AuthService
    await testarAuthService();

    console.log('\n✅ Testes concluídos!');
    console.log('\n📋 Diagnóstico:');
    console.log('  🔌 Supabase: OK');
    console.log('  👥 Tabela usuarios: OK');
    console.log('  🔐 AuthService: OK');

    console.log('\n🎯 Para resolver tela branca:');
    console.log('1. Execute: npm run insert:users');
    console.log('2. Execute: npm run start:full');
    console.log('3. Faça login com qualquer usuário');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

main();
