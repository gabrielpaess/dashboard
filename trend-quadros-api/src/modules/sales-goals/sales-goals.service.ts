import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesGoal } from '../../database/entities/sales-goal.entity';
import { UpdateSalesGoalsDto, SalesGoalsResponseDto } from '../../common/dto/sales-goals.dto';

@Injectable()
export class SalesGoalsService {
  constructor(
    @InjectRepository(SalesGoal)
    private salesGoalsRepository: Repository<SalesGoal>,
  ) {}

  async getCurrentGoals(): Promise<SalesGoalsResponseDto> {
    try {
      // Buscar a meta mais recente
      const latestGoal = await this.salesGoalsRepository.findOne({
        where: {},
        order: { created_at: 'DESC' }
      });

      if (!latestGoal) {
        // Se não existir meta, criar uma padrão
        const defaultGoal = this.salesGoalsRepository.create({
          daily_goal: 7000.00,
          weekly_goal: 45000.00,
          monthly_goal: 200000.00,
          created_by: 1 // Assumindo que o admin tem ID 1
        });
        
        const savedGoal = await this.salesGoalsRepository.save(defaultGoal);
        return {
          daily_goal: savedGoal.daily_goal,
          weekly_goal: savedGoal.weekly_goal,
          monthly_goal: savedGoal.monthly_goal,
          created_at: savedGoal.created_at,
          updated_at: savedGoal.updated_at
        };
      }

      return {
        daily_goal: latestGoal.daily_goal,
        weekly_goal: latestGoal.weekly_goal,
        monthly_goal: latestGoal.monthly_goal,
        created_at: latestGoal.created_at,
        updated_at: latestGoal.updated_at
      };
    } catch (error) {
      console.error('Erro no getCurrentGoals:', error);
      throw error;
    }
  }

  async updateGoals(updateDto: UpdateSalesGoalsDto, userId: number): Promise<SalesGoalsResponseDto> {
    try {
      console.log('🔍 Service - Iniciando atualização de metas:', updateDto);
      console.log('🔍 Service - User ID:', userId);
      
      // Validar dados de entrada
      if (!updateDto.daily_goal || !updateDto.weekly_goal || !updateDto.monthly_goal) {
        throw new Error('Dados incompletos: todas as metas devem ser fornecidas');
      }

      if (updateDto.daily_goal < 0 || updateDto.weekly_goal < 0 || updateDto.monthly_goal < 0) {
        throw new Error('Valores inválidos: as metas não podem ser negativas');
      }

      // Buscar o registro mais recente para atualizar
      const existingGoal = await this.salesGoalsRepository.findOne({
        where: {},
        order: { created_at: 'DESC' }
      });

      if (existingGoal) {
        console.log('🔍 Service - Atualizando registro existente:', existingGoal.id);
        
        // Atualizar o registro existente
        existingGoal.daily_goal = updateDto.daily_goal;
        existingGoal.weekly_goal = updateDto.weekly_goal;
        existingGoal.monthly_goal = updateDto.monthly_goal;
        existingGoal.created_by = userId;
        existingGoal.updated_at = new Date();
        
        const updatedGoal = await this.salesGoalsRepository.save(existingGoal);
        console.log('✅ Service - Registro atualizado com sucesso:', updatedGoal.id);
        
        return {
          daily_goal: updatedGoal.daily_goal,
          weekly_goal: updatedGoal.weekly_goal,
          monthly_goal: updatedGoal.monthly_goal,
          created_at: updatedGoal.created_at,
          updated_at: updatedGoal.updated_at
        };
      } else {
        console.log('🔍 Service - Criando novo registro');
        
        // Se não existir nenhum registro, criar um novo
        const newGoal = this.salesGoalsRepository.create({
          daily_goal: updateDto.daily_goal,
          weekly_goal: updateDto.weekly_goal,
          monthly_goal: updateDto.monthly_goal,
          created_by: userId
        });
        
        const savedGoal = await this.salesGoalsRepository.save(newGoal);
        console.log('✅ Service - Novo registro criado com sucesso:', savedGoal.id);
        
        return {
          daily_goal: savedGoal.daily_goal,
          weekly_goal: savedGoal.weekly_goal,
          monthly_goal: savedGoal.monthly_goal,
          created_at: savedGoal.created_at,
          updated_at: savedGoal.updated_at
        };
      }
    } catch (error) {
      console.error('❌ Service - Erro ao atualizar metas:', error);
      throw error;
    }
  }

  async getGoalsHistory(): Promise<SalesGoalsResponseDto[]> {
    const goals = await this.salesGoalsRepository.find({
      order: { created_at: 'DESC' },
      take: 10 // Últimas 10 alterações
    });

    return goals.map(goal => ({
      daily_goal: goal.daily_goal,
      weekly_goal: goal.weekly_goal,
      monthly_goal: goal.monthly_goal,
      created_at: goal.created_at,
      updated_at: goal.updated_at
    }));
  }
}
