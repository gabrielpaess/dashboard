import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContaPagar } from '../../database/entities/conta-pagar.entity';

@Injectable()
export class FinanceiroService {
  constructor(
    @InjectRepository(ContaPagar)
    private readonly contaPagarRepository: Repository<ContaPagar>,
  ) {}

  async listarContasPagar() {
    return this.contaPagarRepository.find({
      order: {
        data_vencimento: 'ASC',
        id: 'DESC',
      },
    });
  }

  async criarContaPagar(data: {
    descricao: string;
    valor: number;
    data_vencimento?: string;
    status?: string;
  }) {
    const conta = this.contaPagarRepository.create({
      descricao: data.descricao,
      valor: Number(data.valor),
      data_vencimento: data.data_vencimento || undefined,
      status: data.status || 'pendente',
    });

    return this.contaPagarRepository.save(conta);
  }
}
