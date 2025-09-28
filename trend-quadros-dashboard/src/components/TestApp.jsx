import React from 'react';

const TestApp = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Teste de Renderização</h1>
        <p className="text-lg">Se você está vendo isso, o React está funcionando!</p>
        <div className="mt-8 p-4 bg-blue-600 rounded-lg">
          <p>✅ Aplicação carregada com sucesso</p>
        </div>
      </div>
    </div>
  );
};

export default TestApp;
