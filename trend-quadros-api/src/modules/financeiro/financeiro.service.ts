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

  async marcarComoPago(id: number) {
    const conta = await this.contaPagarRepository.findOne({
      where: { id },
    });

    if (!conta) {
      throw new Error('Conta a pagar não encontrada');
    }

    conta.status = 'pago';
    conta.data_pagamento = new Date().toISOString().split('T')[0];

    return this.contaPagarRepository.save(conta);
  }

  async excluirContaPagar(id: number) {
    const conta = await this.contaPagarRepository.findOne({
      where: { id },
    });

    if (!conta) {
      throw new Error('Conta a pagar não encontrada');
    }

    await this.contaPagarRepository.remove(conta);

    return { id, excluido: true };
  }

}
