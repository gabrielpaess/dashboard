/**
 * Authentication Service - Simple Browser Version
 * Handles user login, logout, and access control
 * Uses hardcoded users for development (NOT SECURE - FOR DEVELOPMENT ONLY)
 */

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.userLevel = null;

    // Usuários hardcoded para desenvolvimento
    this.users = [
      {
        id: '1',
        email: 'williaamtelles@gmail.com',
        password: 'Pontoink2025!',
        nome: 'William Telles',
        nivel: 'admin',
        ativo: true
      },
      {
        id: '2',
        email: 'vendas@pontoquadros.com',
        password: 'Vendas2025!',
        nome: 'Usuário Vendas',
        nivel: 'vendas',
        ativo: true
      },
      {
        id: '3',
        email: 'desenvolvimento@pontoquadros.com',
        password: 'Desenvolvimento2025!',
        nome: 'Usuário Desenvolvimento',
        nivel: 'desenvolvimento',
        ativo: true
      },
      {
        id: '4',
        email: 'producao@pontoquadros.com',
        password: 'Producao2025!',
        nome: 'Usuário Produção',
        nivel: 'producao',
        ativo: true
      }
    ];
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

      // Buscar usuário na lista hardcoded
      const user = this.users.find(u => u.email === email && u.ativo);

      if (!user) {
        console.log('❌ Usuário não encontrado');
        return {
          success: false,
          message: 'Usuário não encontrado ou inativo'
        };
      }

      // Verificar senha
      if (user.password !== password) {
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
      console.log('❌ hasAccessToTab - Não autenticado ou sem userLevel');
      return false;
    }

    // Admin tem acesso a tudo
    if (this.userLevel === 'admin') {
      console.log('✅ hasAccessToTab - Admin tem acesso a tudo');
      return true;
    }

    // Mapear níveis de usuário para abas
    const levelToTabMap = {
      'vendas': 'sales',
      'desenvolvimento': 'development', 
      'producao': 'production',
      'admin': 'overview'
    };

    const userTab = levelToTabMap[this.userLevel];
    const hasAccess = userTab === tabLevel;
    
    console.log('🔍 hasAccessToTab - Verificação:', {
      userLevel: this.userLevel,
      userTab,
      requiredTab: tabLevel,
      hasAccess
    });

    return hasAccess;
  }

  /**
   * Get user level display name
   * @returns {string} User level display name
   */
  getUserLevelDisplayName() {
    if (!this.userLevel) {
      return 'Nenhum';
    }

    const levelNames = {
      'admin': 'Administrador',
      'vendas': 'Vendas',
      'desenvolvimento': 'Desenvolvimento',
      'producao': 'Produção'
    };

    return levelNames[this.userLevel] || this.userLevel;
  }

  /**
   * Force sync with localStorage
   * @returns {Object} Current user and auth status
   */
  forceSync() {
    try {
      const storedUser = localStorage.getItem('user');
      const storedAuth = localStorage.getItem('isAuthenticated');

      if (storedUser && storedAuth === 'true') {
        this.currentUser = JSON.parse(storedUser);
        this.isAuthenticated = true;
        this.userLevel = this.currentUser.nivel;
        console.log('🔄 AuthService - Sincronização forçada:', this.currentUser);
        return { user: this.currentUser, isAuthenticated: true };
      } else {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.userLevel = null;
        return { user: null, isAuthenticated: false };
      }
    } catch (error) {
      console.error('❌ Erro na sincronização forçada:', error);
      return { user: null, isAuthenticated: false };
    }
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
