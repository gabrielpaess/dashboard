import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { authService } from '../services/authServiceSimple';

const UserHeader = ({ onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const user = authService.getCurrentUser();
  const userLevel = user?.nivel || 'Usuário';

  const handleLogout = () => {
    authService.logout();
    onLogout();
    setShowDropdown(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-3 transition-all duration-200"
      >
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        
        <div className="text-left">
          <p className="text-sm font-medium text-white">{user.nome}</p>
          <p className="text-xs text-gray-300">{userLevel}</p>
        </div>
        
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
      </motion.button>

      {showDropdown && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-full mt-2 w-64 bg-gray-800/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl z-50"
        >
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">{user.nome}</p>
                <p className="text-sm text-gray-300">{user.email}</p>
                <p className="text-xs text-purple-400 font-medium">{userLevel}</p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/20 py-2 text-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </motion.div>
      )}

      {/* Overlay para fechar dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default UserHeader;
