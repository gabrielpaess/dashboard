import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('sales_goals')
export class SalesGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 7000.00 })
  daily_goal: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 45000.00 })
  weekly_goal: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 200000.00 })
  monthly_goal: number;

  @Column({ type: 'int', nullable: true })
  created_by: number;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  user: Usuario;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
