/**
 * Teste Simples para Verificar Carregamento
 * Componente mínimo para testar se o React está funcionando
 * SEM dependências externas para evitar erros
 */

import React from 'react';

const TestSimple = () => {
  console.log('🧪 TestSimple - Componente carregado!');
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#1e293b', 
      color: 'white', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🧪 Teste Simples - Dashboard</h1>
      <p>Se você está vendo isso, o React está funcionando!</p>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#334155', borderRadius: '8px' }}>
        <h3>Informações do Ambiente:</h3>
        <ul>
          <li>NODE_ENV: {import.meta.env.NODE_ENV}</li>
          <li>MODE: {import.meta.env.MODE}</li>
          <li>DEV: {import.meta.env.DEV ? 'Sim' : 'Não'}</li>
          <li>PROD: {import.meta.env.PROD ? 'Sim' : 'Não'}</li>
          <li>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? 'Configurada' : 'Não configurada'}</li>
          <li>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'Não configurada'}</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#334155', borderRadius: '8px' }}>
        <h3>Teste de Console:</h3>
        <button 
          onClick={() => {
            console.log('🧪 Botão clicado!');
            alert('Console funcionando!');
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Testar Console
        </button>
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#334155', borderRadius: '8px' }}>
        <h3>Teste de Fetch:</h3>
        <button 
          onClick={async () => {
            try {
              console.log('🧪 Testando fetch...');
              const response = await fetch('/api/test-frontend');
              const data = await response.json();
              console.log('🧪 Resposta do fetch:', data);
              alert(`Fetch funcionando! Status: ${response.status}`);
            } catch (error) {
              console.error('🧪 Erro no fetch:', error);
              alert(`Erro no fetch: ${error.message}`);
            }
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Testar Fetch
        </button>
      </div>
    </div>
  );
};

export default TestSimple;
