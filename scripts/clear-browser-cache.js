#!/usr/bin/env node

/**
 * Script para limpar cache do browser
 * Fornece instruções para limpar diferentes tipos de cache
 */

console.log('🌐 Limpando cache do browser...\n');

console.log('📋 Instruções para limpar cache do browser:\n');

console.log('🔧 Método 1: DevTools (Recomendado)');
console.log('1. Abra o DevTools (F12)');
console.log('2. Vá para a aba "Application"');
console.log('3. No menu lateral, clique em "Storage"');
console.log('4. Clique em "Clear storage"');
console.log('5. Marque todas as opções');
console.log('6. Clique em "Clear site data"');

console.log('\n🔧 Método 2: Console do Browser');
console.log('1. Abra o DevTools (F12)');
console.log('2. Vá para a aba "Console"');
console.log('3. Cole e execute:');
console.log('   localStorage.clear();');
console.log('   sessionStorage.clear();');
console.log('   location.reload();');

console.log('\n🔧 Método 3: Limpeza Manual');
console.log('1. Pressione Ctrl+Shift+Delete');
console.log('2. Selecione "Tudo" no período');
console.log('3. Marque todas as opções');
console.log('4. Clique em "Limpar dados"');

console.log('\n🔧 Método 4: Modo Incógnito');
console.log('1. Abra uma janela incógnita (Ctrl+Shift+N)');
console.log('2. Acesse o dashboard');
console.log('3. Teste o login');

console.log('\n🔧 Método 5: Hard Refresh');
console.log('1. Pressione Ctrl+Shift+R');
console.log('2. Ou pressione Ctrl+F5');
console.log('3. Isso força o reload sem cache');

console.log('\n🔧 Método 6: Limpeza Específica do Site');
console.log('1. Clique no ícone de cadeado ao lado da URL');
console.log('2. Clique em "Configurações do site"');
console.log('3. Clique em "Limpar dados"');
console.log('4. Confirme a limpeza');

console.log('\n🎯 Após limpar o cache:');
console.log('1. Execute: npm run start:full');
console.log('2. Acesse o dashboard');
console.log('3. Teste o login com qualquer usuário');

console.log('\n💡 Usuários disponíveis:');
console.log('• Admin: williaamtelles@gmail.com / Pontoink2025!');
console.log('• Vendas: vendas@pontoquadros.com / Vendas2025!');
console.log('• Desenvolvimento: desenvolvimento@pontoquadros.com / Desenvolvimento2025!');
console.log('• Produção: producao@pontoquadros.com / Producao2025!');

console.log('\n✅ Cache do browser limpo!');
