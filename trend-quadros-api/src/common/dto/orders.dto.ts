import { IsOptional, IsString, IsDateString, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePedidoDto {
  @ApiProperty({ example: '12345' })
  @IsString()
  pedido_id: string;

  @ApiProperty({ example: 'PED-001', required: false })
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiProperty({ example: 'João Silva', required: false })
  @IsOptional()
  @IsString()
  nome_cliente?: string;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsOptional()
  @IsDateString()
  data_pedido?: string;

  @ApiProperty({ example: '15/01/2024', required: false })
  @IsOptional()
  @IsString()
  data_pedido_pt_br?: string;

  @ApiProperty({ example: '20/01/2024', required: false })
  @IsOptional()
  @IsString()
  data_prevista?: string;

  @ApiProperty({ example: 'Em aberto', required: false })
  @IsOptional()
  @IsString()
  situacao?: string;

  @ApiProperty({ example: 150.50, required: false })
  @IsOptional()
  @IsNumber()
  valor_total?: number;

  @ApiProperty({ example: 'Maria Santos', required: false })
  @IsOptional()
  @IsString()
  nome_vendedor?: string;

  @ApiProperty({ example: [], required: false })
  @IsOptional()
  @IsArray()
  itens_json?: any[];

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  envio_15?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  envio_45?: boolean;
}

export class UpdatePedidoDto {
  @ApiProperty({ example: 'PED-001', required: false })
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiProperty({ example: 'João Silva', required: false })
  @IsOptional()
  @IsString()
  nome_cliente?: string;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsOptional()
  @IsDateString()
  data_pedido?: string;

  @ApiProperty({ example: '15/01/2024', required: false })
  @IsOptional()
  @IsString()
  data_pedido_pt_br?: string;

  @ApiProperty({ example: '20/01/2024', required: false })
  @IsOptional()
  @IsString()
  data_prevista?: string;

  @ApiProperty({ example: 'Em aberto', required: false })
  @IsOptional()
  @IsString()
  situacao?: string;

  @ApiProperty({ example: 150.50, required: false })
  @IsOptional()
  @IsNumber()
  valor_total?: number;

  @ApiProperty({ example: 'Maria Santos', required: false })
  @IsOptional()
  @IsString()
  nome_vendedor?: string;

  @ApiProperty({ example: [], required: false })
  @IsOptional()
  @IsArray()
  itens_json?: any[];

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  envio_15?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  envio_45?: boolean;
}

export class UpdateNotificationsDto {
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  envio_15?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  envio_45?: boolean;
}

export class GetOrdersQueryDto {
  @ApiProperty({ example: '2024-01-01', required: false })
  @IsOptional()
  @IsDateString()
  dataInicial?: string;

  @ApiProperty({ example: '2024-01-31', required: false })
  @IsOptional()
  @IsDateString()
  dataFinal?: string;

  @ApiProperty({ example: 'Em aberto', required: false })
  @IsOptional()
  @IsString()
  situacao?: string;

  @ApiProperty({ example: 'Maria Santos', required: false })
  @IsOptional()
  @IsString()
  nome_vendedor?: string;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
