#!/usr/bin/env node

/**
 * Script para verificar as senhas no banco de dados
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config/environment.js';

const supabase = createClient(config.supabase.url, config.supabase.anonKey);

async function checkPasswords() {
  console.log('🔍 Verificando senhas no banco de dados...\n');

  try {
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('email, senha_hash, nome, nivel')
      .limit(5);

    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }

    console.log(`📊 Usuários encontrados: ${usuarios.length}\n`);

    usuarios.forEach((usuario, index) => {
      console.log(`${index + 1}. ${usuario.nome} (${usuario.email})`);
      console.log(`   Nível: ${usuario.nivel}`);
      console.log(`   Senha Hash: ${usuario.senha_hash.substring(0, 20)}...`);
      console.log(`   Tamanho: ${usuario.senha_hash.length} caracteres`);
      console.log(`   Começa com $2b$: ${usuario.senha_hash.startsWith('$2b$')}`);
      console.log('');
    });

    console.log('💡 Análise:');
    console.log('- Se as senhas começam com "$2b$", estão criptografadas com bcrypt');
    console.log('- Se não, estão em texto plano');
    console.log('- O authServiceBrowser precisa ser ajustado conforme o formato');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkPasswords();
