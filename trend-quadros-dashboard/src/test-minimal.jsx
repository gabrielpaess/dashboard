/**
 * Teste Mínimo - Sem Dependências
 * Apenas React puro para testar se o problema é com dependências
 */

import React from 'react';

const TestMinimal = () => {
  console.log('🧪 TestMinimal - Componente carregado!');
  
  return React.createElement('div', {
    style: { 
      padding: '20px', 
      backgroundColor: '#1e293b', 
      color: 'white', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }
  }, 
    React.createElement('h1', null, '🧪 Teste Mínimo - Dashboard'),
    React.createElement('p', null, 'Se você está vendo isso, o React está funcionando!'),
    React.createElement('div', {
      style: { 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#334155', 
        borderRadius: '8px' 
      }
    },
      React.createElement('h3', null, 'Informações do Ambiente:'),
      React.createElement('ul', null,
        React.createElement('li', null, `NODE_ENV: ${import.meta.env.NODE_ENV}`),
        React.createElement('li', null, `MODE: ${import.meta.env.MODE}`),
        React.createElement('li', null, `DEV: ${import.meta.env.DEV ? 'Sim' : 'Não'}`),
        React.createElement('li', null, `PROD: ${import.meta.env.PROD ? 'Sim' : 'Não'}`),
        React.createElement('li', null, `VITE_API_URL: ${import.meta.env.VITE_API_URL ? 'Configurada' : 'Não configurada'}`),
        React.createElement('li', null, `VITE_API_BASE_URL: ${import.meta.env.VITE_API_BASE_URL ? 'Configurada' : 'Não configurada'}`)
      )
    ),
      React.createElement('div', {
        style: { 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#334155', 
          borderRadius: '8px' 
        }
      },
        React.createElement('h3', null, 'Teste de Console:'),
        React.createElement('button', {
          onClick: () => {
            console.log('🧪 Botão clicado!');
            alert('Console funcionando!');
          },
          style: {
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }
        }, 'Testar Console'),
        React.createElement('button', {
          onClick: async () => {
            try {
              console.log('🧪 Testando conexão com API...');
              const apiUrl = import.meta.env.VITE_API_URL || 'http://168.231.90.41:3001';
              const response = await fetch(`${apiUrl}/api/health`);
              const data = await response.json();
              console.log('🧪 Resposta da API:', data);
              alert(`API OK! Status: ${response.status}`);
            } catch (error) {
              console.error('🧪 Erro na API:', error);
              alert(`Erro: ${error.message}`);
            }
          },
          style: {
            padding: '10px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, 'Testar API')
      )
  );
};

export default TestMinimal;
