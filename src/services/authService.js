/**
 * Authentication Service
 * Handles user login, logout, and access control
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
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

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.senha_hash);
      
      if (!isPasswordValid) {
        console.log('❌ Senha incorreta para:', email);
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
        message: 'Login realizado com sucesso',
        user: this.currentUser
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
  logout() {
    try {
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
    if (this.isLoggedIn()) {
      return this.currentUser;
    }
    return null;
  }

  /**
   * Get user access level
   * @returns {string|null} User level or null
   */
  getUserLevel() {
    if (this.isLoggedIn()) {
      return this.userLevel;
    }
    return null;
  }

  /**
   * Check if user has access to a specific tab
   * @param {string} tabName - Tab name to check
   * @returns {boolean} Has access or not
   */
  hasAccessToTab(tabName) {
    if (!this.isLoggedIn()) {
      return false;
    }

    const level = this.getUserLevel();
    
    // Admin tem acesso a tudo
    if (level === 'admin') {
      return true;
    }

    // Verificar acesso específico por nível
    const accessMap = {
      'vendas': ['sales'],
      'desenvolvimento': ['development'],
      'producao': ['production']
    };

    const allowedTabs = accessMap[level] || [];
    return allowedTabs.includes(tabName);
  }

  /**
   * Get allowed tabs for current user
   * @returns {Array} Array of allowed tab names
   */
  getAllowedTabs() {
    if (!this.isLoggedIn()) {
      return [];
    }

    const level = this.getUserLevel();
    
    // Admin tem acesso a tudo
    if (level === 'admin') {
      return ['overview', 'sales', 'development', 'production', 'after-sales'];
    }

    // Retornar apenas a aba permitida
    const accessMap = {
      'vendas': ['sales'],
      'desenvolvimento': ['development'],
      'producao': ['production']
    };

    return accessMap[level] || [];
  }

  /**
   * Get user display name
   * @returns {string} User display name
   */
  getUserDisplayName() {
    const user = this.getCurrentUser();
    return user ? user.nome : 'Usuário';
  }

  /**
   * Get user level display name
   * @returns {string} User level display name
   */
  getUserLevelDisplayName() {
    const level = this.getUserLevel();
    const levelMap = {
      'admin': 'Administrador',
      'vendas': 'Vendas',
      'desenvolvimento': 'Desenvolvimento',
      'producao': 'Produção'
    };
    return levelMap[level] || 'Usuário';
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
