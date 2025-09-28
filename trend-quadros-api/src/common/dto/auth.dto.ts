import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@pontoquadros.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(2)
  nome: string;

  @ApiProperty({ example: 'joao@pontoquadros.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'admin', enum: ['admin', 'vendas', 'desenvolvimento', 'producao', 'after-sales'] })
  @IsOptional()
  @IsIn(['admin', 'vendas', 'desenvolvimento', 'producao', 'after-sales'])
  nivel?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'João Silva', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @ApiProperty({ example: 'joao@pontoquadros.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'admin', enum: ['admin', 'vendas', 'desenvolvimento', 'producao', 'after-sales'], required: false })
  @IsOptional()
  @IsIn(['admin', 'vendas', 'desenvolvimento', 'producao', 'after-sales'])
  nivel?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  ativo?: boolean;
}
