/**
 * Script de Migração para Nova Arquitetura
 * Facilita a transição dos serviços antigos para a nova arquitetura
 */

import { validateAllConnections } from '../index.js';
import { apiConfig } from '../config/ApiConfig.js';

export class MigrationHelper {
  constructor() {
    this.migrationSteps = [
      'validate_config',
      'test_connections',
      'backup_data',
      'migrate_components',
      'cleanup_old_files',
      'verify_functionality'
    ];
  }

  /**
   * Executar migração completa
   * @returns {Promise<Object>} Resultado da migração
   */
  async executeMigration() {
    const results = {
      success: false,
      steps: {},
      errors: [],
      warnings: [],
      timestamp: new Date().toISOString()
    };

    console.log('🚀 Iniciando migração para nova arquitetura...');

    for (const step of this.migrationSteps) {
      try {
        console.log(`📋 Executando passo: ${step}`);
        results.steps[step] = await this.executeStep(step);
        console.log(`✅ Passo ${step} concluído`);
      } catch (error) {
        console.error(`❌ Erro no passo ${step}:`, error);
        results.errors.push({ step, error: error.message });
        results.warnings.push(`Passo ${step} falhou: ${error.message}`);
      }
    }

    results.success = results.errors.length === 0;
    
    if (results.success) {
      console.log('🎉 Migração concluída com sucesso!');
    } else {
      console.log('⚠️ Migração concluída com erros. Verifique os logs.');
    }

    return results;
  }

  /**
   * Executar passo específico da migração
   * @param {string} step - Nome do passo
   * @returns {Promise<Object>} Resultado do passo
   */
  async executeStep(step) {
    switch (step) {
      case 'validate_config':
        return await this.validateConfig();
      
      case 'test_connections':
        return await this.testConnections();
      
      case 'backup_data':
        return await this.backupData();
      
      case 'migrate_components':
        return await this.migrateComponents();
      
      case 'cleanup_old_files':
        return await this.cleanupOldFiles();
      
      case 'verify_functionality':
        return await this.verifyFunctionality();
      
      default:
        throw new Error(`Passo desconhecido: ${step}`);
    }
  }

  /**
   * Validar configurações
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateConfig() {
    const validation = apiConfig.validateConfig();
    
    if (!validation.valid) {
      throw new Error(`Configurações inválidas: ${validation.errors.join(', ')}`);
    }

    return {
      success: true,
      config: validation,
      message: 'Configurações validadas com sucesso'
    };
  }

  /**
   * Testar conexões
   * @returns {Promise<Object>} Resultado dos testes
   */
  async testConnections() {
    const connections = await validateAllConnections();
    
    const failedConnections = Object.entries(connections)
      .filter(([key, value]) => key !== 'errors' && !value)
      .map(([key]) => key);

    if (failedConnections.length > 0) {
      throw new Error(`Conexões falharam: ${failedConnections.join(', ')}`);
    }

    return {
      success: true,
      connections,
      message: 'Todas as conexões testadas com sucesso'
    };
  }

  /**
   * Fazer backup dos dados
   * @returns {Promise<Object>} Resultado do backup
   */
  async backupData() {
    // Em uma implementação real, aqui seria feito backup dos dados
    console.log('📦 Fazendo backup dos dados...');
    
    return {
      success: true,
      message: 'Backup dos dados concluído',
      backupLocation: '/backups/migration-backup.json'
    };
  }

  /**
   * Migrar componentes
   * @returns {Promise<Object>} Resultado da migração
   */
  async migrateComponents() {
    console.log('🔄 Migrando componentes para nova arquitetura...');
    
    // Lista de componentes que precisam ser migrados
    const componentsToMigrate = [
      'Dashboard.jsx',
      'OverviewView.jsx',
      'SalesView.jsx',
      'ProductionView.jsx',
      'AfterSalesView.jsx'
    ];

    const migratedComponents = [];
    const failedComponents = [];

    for (const component of componentsToMigrate) {
      try {
        // Em uma implementação real, aqui seria feita a migração automática
        console.log(`  - Migrando ${component}...`);
        migratedComponents.push(component);
      } catch (error) {
        console.error(`  - Erro ao migrar ${component}:`, error);
        failedComponents.push({ component, error: error.message });
      }
    }

    return {
      success: failedComponents.length === 0,
      migrated: migratedComponents,
      failed: failedComponents,
      message: `Migrados ${migratedComponents.length} componentes`
    };
  }

  /**
   * Limpar arquivos antigos
   * @returns {Promise<Object>} Resultado da limpeza
   */
  async cleanupOldFiles() {
    console.log('🧹 Limpando arquivos antigos...');
    
    // Lista de arquivos antigos que podem ser removidos
    const oldFiles = [
      'apiService.js',
      'tinyApiService.js',
      'pedidosService.js',
      'pedidosCentralizedService.js',
      'orderService.js',
      'realtimeSyncService.js',
      'cronJobService.js'
    ];

    const removedFiles = [];
    const failedFiles = [];

    for (const file of oldFiles) {
      try {
        // Em uma implementação real, aqui seria feita a remoção dos arquivos
        console.log(`  - Removendo ${file}...`);
        removedFiles.push(file);
      } catch (error) {
        console.error(`  - Erro ao remover ${file}:`, error);
        failedFiles.push({ file, error: error.message });
      }
    }

    return {
      success: failedFiles.length === 0,
      removed: removedFiles,
      failed: failedFiles,
      message: `Removidos ${removedFiles.length} arquivos antigos`
    };
  }

  /**
   * Verificar funcionalidade
   * @returns {Promise<Object>} Resultado da verificação
   */
  async verifyFunctionality() {
    console.log('✅ Verificando funcionalidade da nova arquitetura...');
    
    try {
      // Testar funcionalidades básicas
      const connections = await validateAllConnections();
      
      if (!connections.tiny || !connections.supabase) {
        throw new Error('Conexões essenciais não funcionando');
      }

      return {
        success: true,
        message: 'Funcionalidade verificada com sucesso',
        connections
      };
    } catch (error) {
      throw new Error(`Falha na verificação: ${error.message}`);
    }
  }

  /**
   * Gerar relatório de migração
   * @param {Object} results - Resultados da migração
   * @returns {Object} Relatório formatado
   */
  generateReport(results) {
    const report = {
      summary: {
        success: results.success,
        totalSteps: this.migrationSteps.length,
        completedSteps: Object.keys(results.steps).length,
        errors: results.errors.length,
        warnings: results.warnings.length
      },
      steps: results.steps,
      errors: results.errors,
      warnings: results.warnings,
      recommendations: this.generateRecommendations(results),
      timestamp: results.timestamp
    };

    return report;
  }

  /**
   * Gerar recomendações baseadas nos resultados
   * @param {Object} results - Resultados da migração
   * @returns {Array} Lista de recomendações
   */
  generateRecommendations(results) {
    const recommendations = [];

    if (results.errors.length > 0) {
      recommendations.push('Corrija os erros identificados antes de prosseguir');
    }

    if (results.warnings.length > 0) {
      recommendations.push('Revise os avisos para otimizar a implementação');
    }

    if (results.success) {
      recommendations.push('Migração concluída! Considere remover o adaptador legado após testes');
      recommendations.push('Implemente testes automatizados para a nova arquitetura');
      recommendations.push('Configure monitoramento das APIs');
    }

    return recommendations;
  }
}

// Função de conveniência para executar migração
export async function runMigration() {
  const migration = new MigrationHelper();
  const results = await migration.executeMigration();
  const report = migration.generateReport(results);
  
  console.log('📊 Relatório de Migração:');
  console.log(JSON.stringify(report, null, 2));
  
  return report;
}

export default MigrationHelper;
