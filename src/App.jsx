import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Dashboard from '@/components/Dashboard';
import LoadingScreen from '@/components/LoadingScreen';
import { Toaster } from '@/components/ui/toaster';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - Ponto Quadros</title>
        <meta name="description" content="Dashboard para gestão de pedidos, integrado com a API do Tiny." />
        <meta property="og:title" content="Dashboard - Ponto Quadros" />
        <meta property="og:description" content="Dashboard para gestão de pedidos do e-commerce, integrado com a API do Tiny." />
        <meta property="og:image" content="/522184952_17844836835536970_1924575561701237564_n.jpg" />
        <link rel="icon" type="image/jpeg" href="/522184952_17844836835536970_1924575561701237564_n.jpg" />
        <link rel="apple-touch-icon" href="/522184952_17844836835536970_1924575561701237564_n.jpg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Helmet>
      
      {isLoading ? (
        <LoadingScreen onComplete={handleLoadingComplete} />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-slate-50">
          <Dashboard />
          <Toaster />
        </div>
      )}
    </>
  );
}

export default App;