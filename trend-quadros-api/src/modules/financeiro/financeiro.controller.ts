import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';

@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  @Get('contas-pagar')
  async listarContasPagar() {
    const contas = await this.financeiroService.listarContasPagar();

    return {
      success: true,
      data: contas,
    };
  }

  @Post('contas-pagar')
  async criarContaPagar(
    @Body()
    body: {
      descricao: string;
      valor: number;
      data_vencimento?: string;
      status?: string;
    },
  ) {
    const conta = await this.financeiroService.criarContaPagar(body);

    return {
      success: true,
      data: conta,
    };
  }

  @Patch('contas-pagar/:id/pago')
  async marcarComoPago(@Param('id') id: string) {
    const conta = await this.financeiroService.marcarComoPago(Number(id));

    return {
      success: true,
      data: conta,
    };
  }

  @Delete('contas-pagar/:id')
  async excluirContaPagar(@Param('id') id: string) {
    const resultado = await this.financeiroService.excluirContaPagar(Number(id));

    return {
      success: true,
      data: resultado,
    };
  }


}
