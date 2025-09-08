import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animar progresso em 3 segundos
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          setTimeout(() => onComplete(), 300); // Aguardar 300ms antes de completar
          return 100;
        }
        return prev + 1.5; // Mais suave: 100% em ~67 steps
      });
    }, 45); // 3 segundos total (3000ms / 67 steps = 45ms)

    return () => {
      clearInterval(progressTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Container da imagem com borda de carregamento */}
          <div className="relative w-48 h-48">
            {/* Borda de carregamento circular */}
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
              {/* Círculo de fundo */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="2"
                fill="none"
              />
              {/* Círculo de progresso */}
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                stroke="url(#gradient)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 283" }}
                animate={{ strokeDasharray: `${(progress * 283) / 100} 283` }}
                transition={{ duration: 0.1 }}
              />
              {/* Gradiente para a borda */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>

            {/* Imagem central */}
            <div className="absolute inset-4 rounded-full overflow-hidden bg-white shadow-lg">
              <img
                src="/522184952_17844836835536970_1924575561701237564_n.jpg"
                alt="Ponto Quadros"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Texto de carregamento */}
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center">
              <p className="text-sm text-gray-400 font-medium">Carregando...</p>
              <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}%</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingScreen;
