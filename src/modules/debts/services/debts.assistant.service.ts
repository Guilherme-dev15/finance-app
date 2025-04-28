import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Debt } from '../schemas/debts.model';
import { DebtStatus } from '../dto/create-debt.dto';
import { PrioritizedDebt } from '../interfaces/prioritized-debt.interface';

@Injectable()
export class DebtAssistantService {
  constructor(
    @InjectModel(Debt.name)
    private readonly debtModel: Model<Debt>,
  ) { }

  async analyzeDebts(userId: string, availableMonthlyAmount: number): Promise<{
    message: string;
    totalDebts: number;
    availableMonthlyAmount: number;
    prioritizedDebts: PrioritizedDebt[];
  }> {
    const debts = await this.debtModel.find({ userId, status: { $ne: DebtStatus.PAID } }).exec();

    if (!debts || debts.length === 0) {
      throw new NotFoundException('Nenhuma dívida ativa encontrada para este usuário.');
    }

    const prioritized = this.prioritizeDebts(debts);

    return {
      message: 'Dívidas priorizadas com base em juros, parcelas e vencimento.',
      totalDebts: prioritized.length,
      availableMonthlyAmount,
      prioritizedDebts: prioritized.map(debt => ({
        id: String(debt._id),
        name: debt.description,
        interestRate: debt.interestRate,
        remainingInstallments: debt.remainingInstallments,
        dueDate: debt.dueDate,
        monthlyInstallment: debt.currentAmount / debt.remainingInstallments,
      })),
    };

  }

  analyzeDebtFeasibility(
    totalDebt: number,
    monthlyInstallment: number,
    userIncome: number,
  ): string {
    const percentageUsed = (monthlyInstallment / userIncome) * 100;

    if (percentageUsed > 50) {
      return '⚠️ Alta: Mais de 50% da renda será comprometida com essa dívida.';
    } else if (percentageUsed > 30) {
      return '🟡 Moderada: Entre 30% e 50% da sua renda será comprometida.';
    } else {
      return '🟢 Baixa: Essa dívida é viável dentro do seu orçamento.';
    }
  }

  private prioritizeDebts(debts: Debt[]): Debt[] {
    return debts.sort((a, b) => {
      // Ordena por taxa de juros (decrescente)
      const interestDiff = (b.interestRate || 0) - (a.interestRate || 0);
      if (interestDiff !== 0) return interestDiff;

      // Depois por menor número de parcelas restantes
      const installmentDiff = a.remainingInstallments - b.remainingInstallments;
      if (installmentDiff !== 0) return installmentDiff;

      // Por fim, por vencimento mais próximo
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }
}
