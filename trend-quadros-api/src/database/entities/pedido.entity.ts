import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('pedidos')
@Index(['pedido_id'], { unique: true })
@Index(['situacao'])
@Index(['data_pedido'])
export class Pedido {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  pedido_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  numero: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nome_cliente: string;

  @Column({ type: 'date', nullable: true })
  data_pedido: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  data_pedido_pt_br: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  data_prevista: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  situacao: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_total: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nome_vendedor: string;

  @Column({ type: 'jsonb', nullable: true })
  itens_json: any;

  @Column({ type: 'boolean', default: false })
  envio_15: boolean;

  @Column({ type: 'boolean', default: false })
  envio_45: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
