import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../database/entities/usuario.entity';
import { LoginDto, RegisterDto, ChangePasswordDto, UpdateUserDto } from '../../common/dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usuarioRepository.findOne({
      where: { email, ativo: true }
    });

    if (user && await bcrypt.compare(password, user.senha_hash)) {
      const { senha_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const payload = { 
      sub: user.id, 
      email: user.email, 
      nome: user.nome, 
      nivel: user.nivel 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        nivel: user.nivel
      }
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usuarioRepository.findOne({
      where: { email: registerDto.email }
    });

    if (existingUser) {
      throw new ConflictException('Usuário com este email já existe');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const user = this.usuarioRepository.create({
      nome: registerDto.nome,
      email: registerDto.email,
      senha_hash: hashedPassword,
      nivel: registerDto.nivel || 'user'
    });

    const savedUser = await this.usuarioRepository.save(user);
    const { senha_hash, ...result } = savedUser;

    return result;
  }

  async getProfile(userId: number) {
    const user = await this.usuarioRepository.findOne({
      where: { id: userId, ativo: true }
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const { senha_hash, ...result } = user;
    return result;
  }

  async getAllUsers() {
    const users = await this.usuarioRepository.find({
      select: ['id', 'nome', 'email', 'nivel', 'ativo', 'created_at', 'updated_at'],
      order: { nome: 'ASC' }
    });

    return users;
  }

  async updateUser(userId: number, updateUserDto: UpdateUserDto) {
    const user = await this.usuarioRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    Object.assign(user, updateUserDto);
    const savedUser = await this.usuarioRepository.save(user);
    const { senha_hash, ...result } = savedUser;

    return result;
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.usuarioRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.senha_hash = hashedPassword;
    
    await this.usuarioRepository.save(user);
    return { message: 'Senha alterada com sucesso' };
  }

  hasAccessToTab(nivel: string, tab: string): boolean {
    const accessMatrix = {
      'admin': ['overview', 'sales', 'development', 'production', 'after-sales'],
      'vendas': ['overview', 'sales'],
      'desenvolvimento': ['overview', 'development'],
      'producao': ['overview', 'production'],
      'after-sales': ['overview', 'after-sales']
    };

    return accessMatrix[nivel]?.includes(tab) || false;
  }
}
