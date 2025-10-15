import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { SalesGoal } from './sales-goal.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  senha_hash: string;

  @Column({ type: 'varchar', length: 50 })
  nivel: string;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => SalesGoal, salesGoal => salesGoal.user)
  salesGoals: SalesGoal[];
}