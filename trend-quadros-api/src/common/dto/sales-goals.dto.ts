import { IsNumber, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSalesGoalsDto {
  @ApiProperty({ description: 'Meta diária de vendas', example: 7000.00 })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  daily_goal: number;

  @ApiProperty({ description: 'Meta semanal de vendas', example: 45000.00 })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  weekly_goal: number;

  @ApiProperty({ description: 'Meta mensal de vendas', example: 200000.00 })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  monthly_goal: number;
}

export class SalesGoalsResponseDto {
  @ApiProperty({ description: 'Meta diária de vendas' })
  daily_goal: number;

  @ApiProperty({ description: 'Meta semanal de vendas' })
  weekly_goal: number;

  @ApiProperty({ description: 'Meta mensal de vendas' })
  monthly_goal: number;

  @ApiProperty({ description: 'Data de criação' })
  created_at: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updated_at: Date;
}
