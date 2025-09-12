/**
 * Authentication Service - Browser Version
 * Handles user login, logout, and access control without bcrypt
 * For browser use only - passwords are stored as plain text (NOT SECURE)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '@/config/environment';

const supabase = createClient(config.supabase.url, config.supabase.anonKey);

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.userLevel = null;
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} Authentication result
   */
  async login(email, password) {
    try {
      console.log('🔐 Tentando fazer login:', email);

      // Buscar usuário no banco
      const { data: user, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('ativo', true)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar usuário:', error);
        return {
          success: false,
          message: 'Usuário não encontrado ou inativo'
        };
      }

      if (!user) {
        return {
          success: false,
          message: 'Usuário não encontrado'
        };
      }

      // Comparar senha (sem bcrypt - apenas para desenvolvimento)
      if (user.senha_hash !== password) {
        console.log('❌ Senha incorreta');
        return {
          success: false,
          message: 'Senha incorreta'
        };
      }

      // Login bem-sucedido
      this.currentUser = {
        id: user.id,
        email: user.email,
        nome: user.nome,
        nivel: user.nivel,
        ativo: user.ativo
      };

      this.isAuthenticated = true;
      this.userLevel = user.nivel;

      // Salvar no localStorage
      localStorage.setItem('user', JSON.stringify(this.currentUser));
      localStorage.setItem('isAuthenticated', 'true');

      console.log('✅ Login realizado com sucesso:', this.currentUser.nome);

      return {
        success: true,
        user: this.currentUser,
        message: 'Login realizado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro durante login:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Logout user
   * @returns {Object} Logout result
   */
  async logout() {
    try {
      console.log('🚪 Fazendo logout...');

      // Limpar dados locais
      this.currentUser = null;
      this.isAuthenticated = false;
      this.userLevel = null;

      // Limpar localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');

      console.log('✅ Logout realizado com sucesso');

      return {
        success: true,
        message: 'Logout realizado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro durante logout:', error);
      return {
        success: false,
        message: 'Erro durante logout'
      };
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isLoggedIn() {
    try {
      // Verificar localStorage primeiro
      const storedUser = localStorage.getItem('user');
      const storedAuth = localStorage.getItem('isAuthenticated');

      if (storedUser && storedAuth === 'true') {
        try {
          this.currentUser = JSON.parse(storedUser);
          this.isAuthenticated = true;
          this.userLevel = this.currentUser.nivel;
          return true;
        } catch (error) {
          console.error('❌ Erro ao parsear usuário do localStorage:', error);
          this.logout();
          return false;
        }
      }

      return this.isAuthenticated;
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      return false;
    }
  }

  /**
   * Get current user
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    if (this.isAuthenticated && this.currentUser) {
      return this.currentUser;
    }

    // Tentar carregar do localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        return this.currentUser;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar usuário do localStorage:', error);
    }

    return null;
  }

  /**
   * Load user from localStorage
   * @returns {Object|null} User data or null
   */
  loadUserFromLocalStorage() {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        this.currentUser = user;
        this.isAuthenticated = true;
        this.userLevel = user.nivel;
        return user;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar usuário do localStorage:', error);
    }
    return null;
  }

  /**
   * Check if user has access to a specific tab
   * @param {string} tabLevel - Required access level
   * @returns {boolean} Access granted
   */
  hasAccessToTab(tabLevel) {
    if (!this.isAuthenticated || !this.userLevel) {
      return false;
    }

    // Admin tem acesso a tudo
    if (this.userLevel === 'admin') {
      return true;
    }

    // Verificar acesso específico
    return this.userLevel === tabLevel;
  }
}

// Níveis de acesso
export const ACCESS_LEVELS = {
  ADMIN: 'admin',
  VENDAS: 'vendas',
  DESENVOLVIMENTO: 'desenvolvimento',
  PRODUCAO: 'producao'
};

// Instância singleton
export const authService = new AuthService();
